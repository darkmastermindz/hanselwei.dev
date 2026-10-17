// POST /api/auth/logout: clears the owner's session cookie
import { clearSessionCookie } from '../lib/session.mjs'

const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin

export default async req => {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } })
  if (!sameOrigin(req)) return new Response(null, { status: 403 })
  return new Response(null, { status: 204, headers: { 'set-cookie': clearSessionCookie(), 'cache-control': 'no-store' } })
}

export const config = { path: '/api/auth/logout' }
