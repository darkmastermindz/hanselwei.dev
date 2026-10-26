// GitHub Actions' own sign-in (OIDC): a workflow run asks GitHub for a short-lived token that
// names its repository, workflow and branch, signed with GitHub's keys. The Gear updates workflow
// shows one to /api/gear/pending (netlify/functions/gear-pending.mjs), so it needs no stored secret.
//
// Only RS256 is accepted, with a key from GitHub's published set (fetched and kept for an hour;
// fetched again, at most once a minute, for a key it doesn't know yet). The token must be from
// GitHub, for our audience, and the claims must match exactly what's expected.
import { createPublicKey, verify } from 'node:crypto'

export const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com'
const JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`
const KEYS_TTL_MS = 60 * 60_000
const REFETCH_MS = 60_000
const LEEWAY_S = 60
const MAX_TOKEN = 8192

let cached = { keys: null, at: 0, tried: 0 }
const fetchKeys = async () => {
  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error(`GitHub's keys: ${res.status}`)
  const { keys } = await res.json()
  return Array.isArray(keys) ? keys : []
}
// The key with this id from GitHub's set, or null
export const githubKey = async (kid, now = Date.now(), load = fetchKeys) => {
  const find = () => cached.keys?.find(k => k?.kid === kid && k.kty === 'RSA') ?? null
  if (cached.keys && now - cached.at < KEYS_TTL_MS && (find() || now - cached.tried < REFETCH_MS)) return find()
  cached.tried = now
  try {
    cached = { keys: await load(), at: now, tried: now }
  } catch {
    if (!cached.keys) return null
  }
  return find()
}

const part = text => {
  try {
    return JSON.parse(Buffer.from(text, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

// The token's claims when it's genuine and matches `expect` (each named claim equal exactly),
// otherwise null. getKey(kid) gives the JWK to check it with (githubKey, or a stand-in in tests).
export const verifyGithubOidc = async (token, { audience, expect = {}, now = Date.now(), getKey = kid => githubKey(kid, now) }) => {
  if (typeof token !== 'string' || token.length > MAX_TOKEN) return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) return null
  const header = part(parts[0])
  const claims = part(parts[1])
  if (!header || !claims || typeof claims !== 'object' || header.alg !== 'RS256' || typeof header.kid !== 'string') return null

  const jwk = await getKey(header.kid)
  if (!jwk) return null
  let ok = false
  try {
    ok = verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'))
  } catch {
    return null
  }
  if (!ok) return null

  const t = Math.floor(now / 1000)
  if (claims.iss !== GITHUB_OIDC_ISSUER) return null
  if (Array.isArray(claims.aud) ? !claims.aud.includes(audience) : claims.aud !== audience) return null
  if (!Number.isInteger(claims.exp) || claims.exp + LEEWAY_S < t) return null
  if (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf - LEEWAY_S > t)) return null
  if (!Number.isInteger(claims.iat) || claims.iat - LEEWAY_S > t) return null
  for (const [name, value] of Object.entries(expect)) if (claims[name] !== value) return null
  return claims
}
