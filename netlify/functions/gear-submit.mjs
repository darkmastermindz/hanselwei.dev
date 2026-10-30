// POST /api/gear/submit { list, ops } -> { ok, key }: sends the owner's gear edits for the "Gear
// updates" pull request (README "Editing gear lists"). Only for a signed-in owner, from this site.
// The changes are checked and put in their canonical form, signed (netlify/lib/gearToken.mjs) and
// kept in the "gear-edits" Netlify Blobs store under pending/<time>-<random> until the Gear updates
// workflow picks them up through /api/gear/pending (netlify/functions/gear-pending.mjs).
import { randomBytes } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { hasInventory } from '../../data/inventory.mjs'
import { validateOps } from '../../utils/gearEdits.mjs'
import { createGearToken, gearKey } from '../lib/gearToken.mjs'
import { isOwner } from '../lib/owners.mjs'
import { readCookie, readSession, SESSION_COOKIE, sessionSecret } from '../lib/session.mjs'

const MAX_BODY = 256 * 1024
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin

// Keys sort in the order the edits were sent: pending/2026-10-26T01-02-03-456Z-<12 hex>
export const pendingKey = (now = Date.now()) => `pending/${new Date(now).toISOString().replace(/[:.]/g, '-')}-${randomBytes(6).toString('hex')}`

export const handleSubmit = async (req, { store, env = process.env, now = Date.now() }) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'POST' })
  if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403)

  const secret = sessionSecret(env)
  const key = gearKey(env)
  if (!secret || !key) return json({ error: 'Editing isn\'t set up on this site' }, 503)

  const session = readSession(readCookie(req, SESSION_COOKIE), secret)
  if (!session) return json({ error: 'Not signed in' }, 401)
  if (!isOwner(session.email)) return json({ error: 'Not allowed' }, 403)

  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ error: 'Too many changes at once' }, 413)
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  const list = body?.list
  if (!hasInventory(list)) return json({ error: 'Unknown gear list' }, 404)
  const checked = validateOps(body.ops)
  if (checked.error) return json({ error: checked.error }, 422)

  // The token covers exactly this text, which is what's stored and later applied
  const ops = JSON.stringify(checked.ops)
  const token = createGearToken({ email: session.email, list, opsText: ops }, key, now)
  const saved = pendingKey(now)
  await store.setJSON(saved, { list, ops, token, at: new Date(now).toISOString() })
  return json({ ok: true, key: saved })
}

export default async req => handleSubmit(req, { store: getStore({ name: 'gear-edits', consistency: 'strong' }) })

export const config = { path: '/api/gear/submit' }
