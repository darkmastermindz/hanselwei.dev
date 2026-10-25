// The proof that a gear edit came from the owner (README "Editing gear lists"). Netlify Forms
// take submissions from anyone, so the editor first asks /api/gear/token, which only answers a
// signed-in owner, to sign exactly these changes. The "Gear updates" workflow
// (scripts/gear-updates.mjs) has each submission checked by /api/gear/verify before it applies it.
//
// The token is an HMAC-SHA256 over { email, list, digest, iat, exp }, where digest is the SHA-256
// of the changes as submitted. Its key comes from the sign-in's own secret (GITHUB_CLIENT_SECRET,
// HKDF with its own label, like the session key in session.mjs), so there's no separate key to set
// up: only the site's functions can sign or check one.
import { createHash, createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

export const GEAR_TOKEN_MAX_AGE = 15 * 60 // seconds from signing to submitting the form
const MIN_CLIENT_SECRET = 16 // as for the session (session.mjs)

// Derived from GITHUB_CLIENT_SECRET; changing that secret voids edits sent but not yet applied
export const gearKey = env =>
  typeof env.GITHUB_CLIENT_SECRET === 'string' && env.GITHUB_CLIENT_SECRET.length >= MIN_CLIENT_SECRET
    ? Buffer.from(hkdfSync('sha256', env.GITHUB_CLIENT_SECRET, '', 'hanselwei.dev gear edits v1', 32)).toString('base64url')
    : null

// The changes exactly as they travel in the form's "ops" field
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

// { email, list } when the token is genuine, unexpired at `at` (when the form was submitted),
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
