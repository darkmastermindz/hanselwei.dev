// GET  /api/kudos       -> { counts: { [id]: n } }: kudos for the About card's XP entries, blog
//                           posts and Curiosity Feed entries
// POST /api/kudos { id } -> { id, count, counted }: one kudos for one of them. An id is an XP
//                           entry's (data/xp.mjs) or `post-<slug>` for a post on the site.
//
// Posts aren't a fixed list (dev.to posts are mirrored in at build time), so a post id has to
// be a plain slug (the dev.to mirror's rule) for a page the deployed site really has: its
// prerendered /blog/<slug>/_payload.json answers 200. The answer is kept for 10 minutes.
//
// The counts are one JSON document ("counts") in the "kudos" Netlify Blobs store, kept apart
// from the site's own data. Each visitor counts once per entry per day: a marker keyed by an
// HMAC of their IP address, the entry and the day (so no IP address is stored) is written with
// onlyIfNew, and only a write that creates it adds to the count. The count itself is updated
// with onlyIfMatch on its ETag and retried, so kudos sent at the same moment aren't lost.
import { createHmac } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { XP_IDS } from '../../data/xp.mjs'
import { SLUG } from '../../scripts/lib/devto.mjs'

const MAX_BODY = 1024
const MAX_TRIES = 6
const COUNTS = 'counts'
const POST = 'post-'
const POST_TTL_MS = 10 * 60_000
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

const postSlug = id => (id.startsWith(POST) && SLUG.test(id.slice(POST.length)) ? id.slice(POST.length) : null)
// The shape of an id we count: an XP entry, or a post id with a plain slug (whether that post
// exists is checked before its first kudos, so only real posts' ids are ever stored)
const knownShape = id => XP_IDS.has(id) || postSlug(id) !== null

// Only known entries, with whole positive counts: whatever else the stored document holds
const cleanCounts = data => {
  const counts = {}
  if (!data || typeof data !== 'object' || Array.isArray(data)) return counts
  for (const id of Object.keys(data)) {
    const n = data[id]
    if (knownShape(id) && Number.isSafeInteger(n) && n > 0) counts[id] = n
  }
  return counts
}

// Whether the deployed site has the post: its prerendered payload answers 200 (no redirects)
const checkPost = async (slug, siteUrl) => {
  try {
    const res = await fetch(new URL(`/blog/${slug}/_payload.json`, siteUrl), { redirect: 'manual' })
    return res.status === 200
  } catch {
    return false
  }
}
const seenPosts = new Map()
export const cachedPostExists = async (slug, siteUrl, now = Date.now(), check = checkPost) => {
  const hit = seenPosts.get(slug)
  if (hit && now - hit.at < POST_TTL_MS) return hit.exists
  const exists = await check(slug, siteUrl)
  if (seenPosts.size > 1000) seenPosts.clear()
  seenPosts.set(slug, { exists, at: now })
  return exists
}

const addOne = async (store, id) => {
  for (let i = 0; i < MAX_TRIES; i++) {
    const current = await store.getWithMetadata(COUNTS, { type: 'json' })
    const counts = cleanCounts(current?.data)
    counts[id] = (counts[id] ?? 0) + 1
    const options = current ? { onlyIfMatch: current.etag } : { onlyIfNew: true }
    const { modified } = await store.setJSON(COUNTS, counts, options)
    if (modified) return counts[id]
  }
  return null
}

export const handleKudos = async (req, { store, ip = '', secret = '', now = Date.now(), siteUrl = new URL(req.url).origin, postExists = slug => cachedPostExists(slug, siteUrl, now) }) => {
  if (req.method === 'GET') {
    const current = await store.get(COUNTS, { type: 'json' })
    return json({ counts: cleanCounts(current) })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' })
  // Only from the site's own pages (browsers send this on every fetch)
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return json({ error: 'Forbidden' }, 403)

  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, 413)
  let id
  try {
    id = JSON.parse(raw)?.id
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  if (typeof id !== 'string' || !knownShape(id)) return json({ error: 'Unknown entry' }, 404)
  const slug = postSlug(id)
  if (slug !== null && !(await postExists(slug))) return json({ error: 'Unknown entry' }, 404)

  const day = new Date(now).toISOString().slice(0, 10)
  const visitor = createHmac('sha256', `kudos:${secret}`).update(`${ip}\n${id}\n${day}`).digest('hex')
  const marker = `seen/${day}/${visitor}`
  const { modified: fresh } = await store.set(marker, '1', { onlyIfNew: true })
  if (!fresh) {
    const current = await store.get(COUNTS, { type: 'json' })
    return json({ id, count: cleanCounts(current)[id] ?? 0, counted: false })
  }

  const count = await addOne(store, id)
  if (count === null) {
    // Too busy to count it: let the visitor try again
    await store.delete(marker)
    return json({ error: 'Busy, try again' }, 503)
  }
  return json({ id, count, counted: true })
}

export default async (req, context) =>
  handleKudos(req, {
    store: getStore({ name: 'kudos', consistency: 'strong' }),
    ip: context?.ip ?? '',
    secret: process.env.GITHUB_CLIENT_SECRET ?? '',
    // This deploy's own address (a preview checks its own posts), else the site's
    siteUrl: process.env.DEPLOY_URL || process.env.URL || new URL(req.url).origin
  })

export const config = { path: '/api/kudos' }
