// The proof that a gear edit came from the owner (README "Editing gear lists"). /api/gear/submit,
// which only answers a signed-in owner, signs exactly the changes it keeps, and the "Gear updates"
// workflow (scripts/gear-updates.mjs) has each one checked by /api/gear/verify before it applies
// it: an edit that reached the store any other way is never applied.
//
// The token is an HMAC-SHA256 over { email, list, digest, iat, exp }, where digest is the SHA-256
// of the changes as submitted. Its key comes from the sign-in's own secret (GITHUB_CLIENT_SECRET,
// HKDF with its own label, like the session key in session.mjs), so there's no separate key to set
// up: only the site's functions can sign or check one.
import { createHash, createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

export const GEAR_TOKEN_MAX_AGE = 15 * 60 // seconds from signing to it being kept (signed and kept together)
const MIN_CLIENT_SECRET = 16 // as for the session (session.mjs)

// Derived from GITHUB_CLIENT_SECRET; changing that secret voids edits sent but not yet applied
export const gearKey = env =>
  typeof env.GITHUB_CLIENT_SECRET === 'string' && env.GITHUB_CLIENT_SECRET.length >= MIN_CLIENT_SECRET
    ? Buffer.from(hkdfSync('sha256', env.GITHUB_CLIENT_SECRET, '', 'hanselwei.dev gear edits v1', 32)).toString('base64url')
    : null

// The changes exactly as they're kept (the stored "ops" text)
export const opsDigest = opsText => createHash('sha256').update(String(opsText), 'utf8').digest('hex')

const sign = (payload, key) => createHmac('sha256', key).update(`gear-edit v1.${payload}`).digest('base64url')

const same = (a, b) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const createGearToken = ({ email, list, opsText }, key, now = Date.now()) => {
  const iat = Math.floor(now / 1000)
  const payload = Buffer.from(JSON.stringify({ email, list, digest: opsDigest(opsText), iat, exp: iat + GEAR_TOKEN_MAX_AGE })).toString('base64url')
  return `${payload}.${sign(payload, key)}`
}

// { email, list } when the token is genuine, unexpired at `at` (when the edit was kept),
// and was signed for exactly this list and these changes; otherwise null
export const readGearToken = (token, { list, opsText }, key, at = Date.now()) => {
  if (typeof token !== 'string' || token.length > 2048 || !key) return null
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [payload, signature] = parts
  if (!same(sign(payload, key), signature)) return null

  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  const t = Math.floor(at / 1000)
  if (typeof data?.email !== 'string' || typeof data.list !== 'string' || typeof data.digest !== 'string') return null
  if (!Number.isInteger(data.iat) || !Number.isInteger(data.exp)) return null
  if (data.iat > t + 60 || data.exp < t || data.exp - data.iat > GEAR_TOKEN_MAX_AGE) return null
  if (data.list !== list || !same(data.digest, opsDigest(opsText))) return null
  return { email: data.email, list: data.list }
}
