// POST /api/gear/token { list, ops } -> { ops, token }: signs the owner's gear edits so the
// "Gear updates" workflow can trust them when they arrive through the Netlify Form
// (netlify/lib/gearToken.mjs, README "Editing gear lists"). Only for a signed-in owner, from this
// site. The changes come back checked and in their canonical form; the form sends exactly that
// text, which is what the token covers.
import { hasInventory } from '../../data/inventory.mjs'
import { validateOps } from '../../utils/gearEdits.mjs'
import { createGearToken, gearKey } from '../lib/gearToken.mjs'
import { isOwner } from '../lib/owners.mjs'
import { readCookie, readSession, SESSION_COOKIE, sessionSecret } from '../lib/session.mjs'

const MAX_BODY = 256 * 1024
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin

export default async req => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'POST' })
  if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403)

  const secret = sessionSecret(process.env)
  const key = gearKey(process.env)
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

  const opsText = JSON.stringify(checked.ops)
  return json({ ops: opsText, token: createGearToken({ email: session.email, list, opsText }, key) })
}

export const config = { path: '/api/gear/token' }
