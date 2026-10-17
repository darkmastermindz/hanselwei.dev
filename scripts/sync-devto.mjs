#!/usr/bin/env node
// Mirrors published dev.to articles into content/blog/devto/*.md so they show up
// in the site's blog (/blog). Runs before every build (see "pregenerate" in package.json).
//
//   DEVTO_USERNAME  dev.to username to mirror (default: hansel)
//   DEVTO_API_KEY   optional; only needed to raise rate limits
//
// Network failures never fail the build: previously mirrored posts are kept.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const USERNAME = process.env.DEVTO_USERNAME || 'hansel'
const OUT_DIR = fileURLToPath(new URL('../content/blog/devto/', import.meta.url))
const API = 'https://dev.to/api'
const headers = {
  accept: 'application/vnd.forem.api-v1+json',
  ...(process.env.DEVTO_API_KEY && { 'api-key': process.env.DEVTO_API_KEY })
}

const getJSON = async url => {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

// dev.to liquid tags ({% embed url %}, {% github repo %}, ...) don't render outside dev.to;
// turn the common ones into plain links.
export const convertLiquidTags = markdown =>
  markdown
    .replace(/{%\s*(?:embed|link|twitter|youtube|codepen|github|gist|stackblitz|codesandbox|replit|glitch|instagram|speakerdeck|slideshare)\s+([^\s%]+)[^%]*%}/g, (_, target) => {
      const url = /^https?:\/\//.test(target)
        ? target
        : /^[\w.-]+\/[\w.-]+$/.test(target)
          ? `https://github.com/${target}`
          : /^[\w-]{11}$/.test(target)
            ? `https://www.youtube.com/watch?v=${target}`
            : target
      return `[${url}](${url})`
    })
    .replace(/{%\s*(?:raw|endraw)\s*%}/g, '')
    .replace(/{%[^%]*%}/g, '')

const frontMatter = data =>
  `---\n${Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n\n`

const sync = async () => {
  const summaries = []
  for (let page = 1; ; page++) {
    const batch = await getJSON(`${API}/articles?username=${encodeURIComponent(USERNAME)}&per_page=100&page=${page}`)
    summaries.push(...batch)
    if (batch.length < 100) break
  }

  const files = []
  for (const { id } of summaries) {
    const article = await getJSON(`${API}/articles/${id}`)
    const file = `${article.slug}.md`
    files.push(file)

    const data = {
      title: article.title,
      date: article.published_timestamp || article.published_at,
      description: article.description,
      tags: article.tags || article.tag_list,
      cover_image: article.cover_image,
      canonical_url: article.canonical_url || article.url,
      source: 'dev.to',
      devto_url: article.url,
      slug: article.slug
    }
    await writeFile(`${OUT_DIR}${file}`, frontMatter(data) + convertLiquidTags(article.body_markdown || '').trim() + '\n')
  }

  // Drop mirrored posts that were unpublished on dev.to
  for (const existing of await readdir(OUT_DIR)) {
    if (existing.endsWith('.md') && !files.includes(existing)) await rm(`${OUT_DIR}${existing}`)
  }

  return files.length
}

await mkdir(OUT_DIR, { recursive: true })
try {
  const count = await sync()
  console.log(`[sync-devto] Mirrored ${count} post(s) from dev.to`)
} catch (err) {
  console.warn(`[sync-devto] Skipped, keeping existing mirrored posts: ${err.message}`)
}
