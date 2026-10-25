// GET /api/me -> the signed-in owner, checked on every request from the session cookie.
// 204 (no content) for a visitor with no session cookie: every page load asks, and an error
// status would show up in every visitor's browser console. 401 for a session cookie that isn't
// valid (forged, tampered or expired), 403 when it belongs to someone who isn't an owner.
import { isOwner } from '../lib/owners.mjs'
import { readCookie, readSession, SESSION_COOKIE, sessionSecret } from '../lib/session.mjs'

const HEADERS = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex', allow: 'GET' }
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...HEADERS } })

export default async req => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const secret = sessionSecret(process.env)
  if (!secret) return json({ error: 'Sign-in isn\'t available' }, 503)

  const cookie = readCookie(req, SESSION_COOKIE)
  if (!cookie) return new Response(null, { status: 204, headers: HEADERS })
  const session = readSession(cookie, secret)
  if (!session) return json({ error: 'Not signed in' }, 401)
  if (!isOwner(session.email)) return json({ error: 'Not allowed' }, 403)
  return json({ email: session.email, name: session.name, owner: true })
}

export const config = { path: '/api/me' }
