// GET  /api/kudos       -> { counts: { [xpId]: n } }: kudos for the About card's XP entries
// POST /api/kudos { id } -> { id, count, counted }: one kudos for one entry (data/xp.mjs)
//
// The counts are one JSON document ("counts") in the "kudos" Netlify Blobs store, kept apart
// from the site's own data. Each visitor counts once per entry per day: a marker keyed by an
// HMAC of their network (an IPv4 address, or an IPv6 /64: one home or phone connection), the
// entry and the day (so no address is stored) is written with onlyIfNew, and only a write that
// creates it adds to the count. Markers older than yesterday are swept as new kudos come in. The count itself is updated
// with onlyIfMatch on its ETag and retried, so kudos sent at the same moment aren't lost.
import { createHmac } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { XP_IDS } from '../../data/xp.mjs'

const MAX_BODY = 1024
const MAX_TRIES = 6
const SWEEP_MAX = 300 // old markers deleted per counted kudos, at most
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

// The part of a visitor's address that names their connection: an IPv4 address as it is, an IPv6
// address's /64 (each home or phone gets a whole /64), anything else as given (cut to size)
export const visitorNet = ip => {
  if (typeof ip !== 'string') return ''
  let a = ip.trim().toLowerCase().replace(/%.*$/, '')
  if (a.startsWith('[') && a.endsWith(']')) a = a.slice(1, -1)
  const mapped = a.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) return mapped[1]
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(a)) return a
  const other = a.slice(0, 64)
  if (!a.includes(':') || !/^[0-9a-f:]+$/.test(a)) return other
  const halves = a.split('::')
  if (halves.length > 2) return other
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if ((halves.length === 1 && head.length !== 8) || missing < 0 || [...head, ...tail].some(g => !g || g.length > 4)) return other
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  return `${groups.slice(0, 4).map(g => parseInt(g, 16).toString(16)).join(':')}::/64`
}

// Markers from before yesterday aren't needed again: delete some on each counted kudos
const sweepOld = async (store, now) => {
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10)
  const { directories = [] } = await store.list({ prefix: 'seen/', directories: true })
  let left = SWEEP_MAX
  for (const dir of directories.sort()) {
    const day = dir.replace(/^seen\//, '').replace(/\/$/, '')
    if (!(day < yesterday) || left <= 0) continue
    const { blobs = [] } = await store.list({ prefix: `seen/${day}/` })
    for (const { key } of blobs.slice(0, left)) await store.delete(key)
    left -= Math.min(blobs.length, left)
  }
}

export const handleKudos = async (req, { store, ip = '', secret = '', now = Date.now(), origins = [] }) => {
  if (req.method === 'GET') {
    const current = await store.get(COUNTS, { type: 'json' })
    return json({ counts: cleanCounts(current) })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' })
  // Only from the site's own pages: browsers send Origin on every fetch POST
  const allowed = new Set([new URL(req.url).origin, ...origins])
  const site = req.headers.get('sec-fetch-site')
  if (!allowed.has(req.headers.get('origin')) || (site && site !== 'same-origin')) return json({ error: 'Forbidden' }, 403)

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
  const visitor = createHmac('sha256', `kudos:${secret}`).update(`${visitorNet(ip)}\n${id}\n${day}`).digest('hex')
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
  await sweepOld(store, now).catch(() => {})
  return json({ id, count, counted: true })
}

export default async (req, context) =>
  handleKudos(req, {
    store: getStore({ name: 'kudos', consistency: 'strong' }),
    ip: context?.ip ?? '',
    secret: process.env.GITHUB_CLIENT_SECRET ?? '',
    // The site's own addresses (the request's own origin is always allowed)
    origins: [process.env.URL, process.env.DEPLOY_URL, process.env.DEPLOY_PRIME_URL].filter(Boolean).map(u => new URL(u).origin)
  })

export const config = { path: '/api/kudos' }
