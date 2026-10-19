// GET /api/me -> the signed-in owner, checked on every request from the session cookie.
// 401 when signed out, 403 when the session belongs to someone who isn't an owner.
import { isOwner } from '../lib/owners.mjs'
import { readCookie, readSession, SESSION_COOKIE, sessionSecret } from '../lib/session.mjs'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
      allow: 'GET'
    }
  })

export default async req => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const secret = sessionSecret(process.env)
  if (!secret) return json({ error: 'Sign-in isn\'t available' }, 503)

  const session = readSession(readCookie(req, SESSION_COOKIE), secret)
  if (!session) return json({ error: 'Not signed in' }, 401)
  if (!isOwner(session.email)) return json({ error: 'Not allowed' }, 403)
  return json({ email: session.email, name: session.name, owner: true })
}

export const config = { path: '/api/me' }
