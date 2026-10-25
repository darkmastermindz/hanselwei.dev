// GET  /api/kudos       -> { counts: { [xpId]: n } }: kudos for the About card's XP entries
// POST /api/kudos { id } -> { id, count, counted }: one kudos for one entry (data/xp.mjs)
//
// The counts are one JSON document ("counts") in the "kudos" Netlify Blobs store, kept apart
// from the site's own data. Each visitor counts once per entry per day: a marker keyed by an
// HMAC of their IP address, the entry and the day (so no IP address is stored) is written with
// onlyIfNew, and only a write that creates it adds to the count. The count itself is updated
// with onlyIfMatch on its ETag and retried, so kudos sent at the same moment aren't lost.
import { createHmac } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { XP_IDS } from '../../data/xp.mjs'

const MAX_BODY = 1024
const MAX_TRIES = 6
const COUNTS = 'counts'
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

// Only known entries, with whole non-negative counts: whatever else the stored document holds
const cleanCounts = data => {
  const counts = {}
  for (const id of XP_IDS) {
    const n = data && typeof data === 'object' && Object.hasOwn(data, id) ? data[id] : 0
    if (Number.isSafeInteger(n) && n > 0) counts[id] = n
  }
  return counts
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

export const handleKudos = async (req, { store, ip = '', secret = '', now = Date.now() }) => {
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
  if (typeof id !== 'string' || !XP_IDS.has(id)) return json({ error: 'Unknown entry' }, 404)

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
    secret: process.env.GITHUB_CLIENT_SECRET ?? ''
  })

export const config = { path: '/api/kudos' }
