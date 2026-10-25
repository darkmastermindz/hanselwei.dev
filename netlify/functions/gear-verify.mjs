// POST /api/gear/verify { list, ops, token, at } -> 200 { ok: true } or 403: whether a gear edit
// from the "gear-edit" Netlify Form was signed by a current owner, for exactly this list and these
// changes, and sent while its signature was good (`at`: when Netlify received it). The Gear updates
// workflow (scripts/gear-updates.mjs) asks this for every submission, so the key that signs edits
// (netlify/lib/gearToken.mjs, derived from the sign-in secret) never leaves Netlify.
// It only says yes or no; it signs nothing, and its answer can't be used to make a token.
import { hasInventory } from '../../data/inventory.mjs'
import { gearKey, readGearToken } from '../lib/gearToken.mjs'
import { isOwner } from '../lib/owners.mjs'

const MAX_BODY = 300 * 1024
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

export default async req => {
  if (req.method !== 'POST') return json({ ok: false }, 405, { allow: 'POST' })
  const key = gearKey(process.env)
  if (!key) return json({ ok: false, error: 'Editing isn\'t set up on this site' }, 503)

  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ ok: false }, 413)
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false }, 400)
  }
  const { list, ops, token } = body ?? {}
  const at = Date.parse(body?.at)
  if (!hasInventory(list) || typeof ops !== 'string' || !Number.isFinite(at) || at > Date.now() + 60_000) return json({ ok: false }, 403)

  const signer = readGearToken(token, { list, opsText: ops }, key, at)
  return signer && isOwner(signer.email) ? json({ ok: true }) : json({ ok: false }, 403)
}

export const config = { path: '/api/gear/verify' }
