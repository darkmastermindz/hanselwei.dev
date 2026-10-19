import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { safeUrl } from '../../utils/safeUrl.js'

// Minimal front matter parser for the subset we write: `key: value` pairs where
// values are JSON-ish strings, numbers, booleans or `[a, b]` lists.
const parseValue = raw => {
  const value = raw.trim()
  if (value === '') return ''
  if (value === 'true' || value === 'false') return value === 'true'
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value)
    } catch {
      return value
        .slice(1, -1)
        .split(',')
        .map(v => parseValue(v))
        .filter(v => v !== '')
    }
  }
  return value
}

export const parseFrontMatter = source => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: source }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1 || line.trimStart().startsWith('#')) continue
    data[line.slice(0, idx).trim()] = parseValue(line.slice(idx + 1))
  }
  return { data, content: source.slice(match[0].length) }
}

const readingTime = text => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 225))

// Opens external links in a new tab; everything else renders as standard markdown.
const renderer = new marked.Renderer()
const renderLink = renderer.link.bind(renderer)
renderer.link = function (token) {
  const html = renderLink(token)
  return /^https?:\/\//.test(token.href) ? html.replace('<a ', '<a target="_blank" rel="noopener" ') : html
}

// A plain-text description from the body when a post has none: links and images become their
// text, markdown marks go, hyphens and parentheses stay ("one-off", "(see below)")
export const excerptOf = content =>
  String(content)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

export const toPost = (key, source) => {
  const { data, content } = parseFrontMatter(source)
  // Storage keys look like "devto:my-post.md" or "hello-world.md"
  const file = key.split(':').pop()
  const slug = data.slug || file.replace(/\.md$/, '')
  const tags = Array.isArray(data.tags) ? data.tags : data.tags ? String(data.tags).split(',').map(t => t.trim()) : []

  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString() : null,
    description: data.description || excerptOf(content),
    tags,
    cover: safeUrl(data.cover_image),
    source: data.source || 'hanselwei.dev',
    canonical: safeUrl(data.canonical_url),
    link: safeUrl(data.link), // feed entries can share an external link
    series: data.series || null, // recurring series => Curiosity Feed; none => one-shot post
    draft: data.draft === true,
    readingTime: readingTime(content),
    content
  }
}

export const getPosts = async () => {
  const storage = useStorage('assets:blog')
  const keys = (await storage.getKeys()).filter(key => key.endsWith('.md'))
  const posts = await Promise.all(keys.map(async key => toPost(key, String(await storage.getItem(key)))))

  const sorted = posts
    .filter(post => !post.draft)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  // Number entries within each series in date order (#1 is the oldest)
  const counts = {}
  for (const post of [...sorted].reverse()) {
    if (post.series) post.seriesNumber = counts[post.series] = (counts[post.series] || 0) + 1
  }
  return sorted
}

// Posts include markdown mirrored from dev.to and are injected with v-html, so the
// rendered HTML is reduced to plain formatting: no scripts, handlers, styles or
// non-http(s) links (tests/security/markdown.test.mjs)
const SANITIZE = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code', 'kbd', 'samp',
    'strong', 'b', 'em', 'i', 'del', 's', 'sub', 'sup', 'mark', 'small', 'abbr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'details', 'summary', 'span', 'div'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel', 'id'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    span: ['class'],
    th: ['align'],
    td: ['align'],
    ol: ['start'],
    li: ['id'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id']
  },
  allowedClasses: { code: [/^language-[\w-]+$/], span: [/^hljs-[\w-]+$/] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    // Only external links open in a new tab; `rel` can't be set by the post
    a: (tagName, { target, rel, ...attribs }) => ({
      tagName,
      attribs: /^https?:\/\//i.test(attribs.href ?? '') ? { ...attribs, target: '_blank', rel: 'noopener' } : attribs
    })
  }
}

export const renderMarkdown = content => sanitizeHtml(marked.parse(content, { renderer, gfm: true }), SANITIZE)
