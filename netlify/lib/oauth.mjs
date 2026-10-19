// Sign-in with GitHub (OAuth App). GitHub only confirms who the person is; the site
// decides access: the account must have a verified email on the owner allow-list.
import { randomBytes, timingSafeEqual } from 'node:crypto'

export const SITE = 'https://www.hanselwei.dev' // fixed, never taken from the request
export const CALLBACK_PATH = '/api/auth/github/callback'
export const REDIRECT_URI = `${SITE}${CALLBACK_PATH}`
export const STATE_COOKIE = 'hw_oauth_state'
const STATE_MAX_AGE = 600 // seconds to finish the GitHub sign-in

export const githubConfig = env =>
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }
    : null

export const newState = () => randomBytes(32).toString('base64url')

const same = (a, b) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

// Both values must be present, long enough and equal (constant-time compare)
export const stateMatches = (expected, received) =>
  typeof expected === 'string' && typeof received === 'string' && expected.length >= 32 && same(expected, received)

export const stateCookie = (value, maxAge = STATE_MAX_AGE) =>
  `${STATE_COOKIE}=${value}; Path=/api/auth; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`

export const authorizeUrl = ({ clientId, state }) =>
  `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: 'user:email',
    state
  })}`

// Only verified addresses count; GitHub's public profile email can be unverified
export const verifiedEmails = list =>
  Array.isArray(list)
    ? list.filter(entry => entry?.verified === true && typeof entry.email === 'string').map(entry => entry.email)
    : []

// Exchanges the code and checks the verified emails. Returns { ok, email } for an owner,
// or { ok: false, reason: 'denied' | 'failed', domain? }. GitHub's error text never leaves here.
export const signInWithGitHub = async ({
  code,
  state,
  cookieState,
  config,
  isOwner,
  fetchImpl = fetch
}) => {
  if (!stateMatches(cookieState, state) || typeof code !== 'string' || !code || code.length > 512) {
    return { ok: false, reason: 'failed' }
  }
  try {
    const tokenRes = await fetchImpl('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: REDIRECT_URI
      })
    })
    if (!tokenRes.ok) return { ok: false, reason: 'failed' }
    const token = (await tokenRes.json())?.access_token
    if (typeof token !== 'string' || !token) return { ok: false, reason: 'failed' }

    // The token is used for this one request and never stored
    const emailsRes = await fetchImpl('https://api.github.com/user/emails', {
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'user-agent': 'hanselwei.dev' }
    })
    if (!emailsRes.ok) return { ok: false, reason: 'failed' }
    const verified = verifiedEmails(await emailsRes.json())

    const owner = verified.find(email => isOwner(email))
    if (!owner) return { ok: false, reason: 'denied', domain: verified[0]?.split('@')[1] ?? null }
    return { ok: true, email: owner }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}
