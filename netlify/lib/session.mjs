// The owner's session: a signed cookie (HMAC-SHA256) holding the verified email and
// an expiry. The signing key is derived from the GitHub client secret (HKDF with its own
// label), so no extra variable has to be set, and the key itself is never the secret.
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'hw_session'
export const SESSION_MAX_AGE = 60 * 60 // seconds; the client renews it while in use

const sign = (payload, secret) => createHmac('sha256', secret).update(payload).digest('base64url')

const same = (a, b) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

const MIN_CLIENT_SECRET = 16

// Derived from GITHUB_CLIENT_SECRET; changing that secret signs everyone out
export const sessionSecret = env =>
  typeof env.GITHUB_CLIENT_SECRET === 'string' && env.GITHUB_CLIENT_SECRET.length >= MIN_CLIENT_SECRET
    ? Buffer.from(hkdfSync('sha256', env.GITHUB_CLIENT_SECRET, '', 'hanselwei.dev owner session v1', 32)).toString('base64url')
    : null

export const createSession = ({ email, name = '' }, secret, now = Date.now()) => {
  const iat = Math.floor(now / 1000)
  const payload = Buffer.from(JSON.stringify({ email, name, iat, exp: iat + SESSION_MAX_AGE })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

// Returns { email, name } for a valid, unexpired session, otherwise null
export const readSession = (token, secret, now = Date.now()) => {
  if (typeof token !== 'string' || !secret) return null
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [payload, signature] = parts
  if (!same(sign(payload, secret), signature)) return null

  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  const t = Math.floor(now / 1000)
  if (typeof data?.email !== 'string' || !Number.isInteger(data.iat) || !Number.isInteger(data.exp)) return null
  if (data.iat > t + 60 || data.exp <= t || data.exp - data.iat > SESSION_MAX_AGE) return null
  return { email: data.email, name: typeof data.name === 'string' ? data.name : '' }
}

export const sessionCookie = (value, maxAge = SESSION_MAX_AGE) =>
  `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`

export const clearSessionCookie = () => sessionCookie('', 0)

export const readCookie = (req, name) => {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const at = part.indexOf('=')
    if (at > 0 && part.slice(0, at).trim() === name) return part.slice(at + 1).trim()
  }
  return null
}
