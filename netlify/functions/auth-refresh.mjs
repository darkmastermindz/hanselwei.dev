// POST /api/auth/refresh: the browser calls this while the owner is active, which renews
// the session for another hour. Without a valid session it clears the cookie.
import { isOwner } from '../lib/owners.mjs'
import { clearSessionCookie, createSession, readCookie, readSession, SESSION_COOKIE, sessionCookie, sessionSecret } from '../lib/session.mjs'

const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin

export default async req => {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } })
  if (!sameOrigin(req)) return new Response(null, { status: 403 })
  const secret = sessionSecret(process.env)
  if (!secret) return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } })

  const session = readSession(readCookie(req, SESSION_COOKIE), secret)
  if (!session || !isOwner(session.email)) {
    return new Response(null, { status: 401, headers: { 'set-cookie': clearSessionCookie(), 'cache-control': 'no-store' } })
  }
  return new Response(null, {
    status: 204,
    headers: {
      'set-cookie': sessionCookie(createSession({ email: session.email, name: session.name }, secret)),
      'cache-control': 'no-store'
    }
  })
}

export const config = { path: '/api/auth/refresh' }
