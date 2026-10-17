import { marked } from 'marked'

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

const toPost = (key, source) => {
  const { data, content } = parseFrontMatter(source)
  // Storage keys look like "devto:my-post.md" or "hello-world.md"
  const file = key.split(':').pop()
  const slug = data.slug || file.replace(/\.md$/, '')
  const tags = Array.isArray(data.tags) ? data.tags : data.tags ? String(data.tags).split(',').map(t => t.trim()) : []

  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString() : null,
    description: data.description || content.replace(/[#>*_`[\]()!-]/g, '').trim().slice(0, 160),
    tags,
    cover: data.cover_image || null,
    source: data.source || 'hanselwei.dev',
    canonical: data.canonical_url || null,
    link: data.link || null, // feed entries can share an external link
    series: data.series || null, // feed entries: the recurring series they belong to
    draft: data.draft === true,
    readingTime: readingTime(content),
    content
  }
}

// collection: 'blog' (content/blog, long-form) or 'feed' (content/feed, short notes)
export const getPosts = async (collection = 'blog') => {
  const storage = useStorage(`assets:${collection}`)
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

export const renderMarkdown = content => marked.parse(content, { renderer, gfm: true })
