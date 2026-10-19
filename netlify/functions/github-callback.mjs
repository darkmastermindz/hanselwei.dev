// GET /api/auth/github/callback: GitHub comes back here. Checks `state`, decides access
// from the verified emails, then sets the owner's session cookie or sends the visitor
// back with a fixed reason in the URL hash (never GitHub's own error text).
import { githubConfig, signInWithGitHub, STATE_COOKIE, stateCookie } from '../lib/oauth.mjs'
import { isOwner } from '../lib/owners.mjs'
import { createSession, readCookie, sessionCookie, sessionSecret } from '../lib/session.mjs'

const redirect = (location, cookies) => {
  const headers = new Headers({ location, 'cache-control': 'no-store' })
  for (const cookie of cookies) headers.append('set-cookie', cookie)
  return new Response(null, { status: 302, headers })
}

export default async req => {
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET' } })
  const github = githubConfig(process.env)
  const secret = sessionSecret(process.env)
  if (!github || !secret) return redirect('/#auth_error=failed', [stateCookie('', 0)])

  const url = new URL(req.url)
  const result = await signInWithGitHub({
    code: url.searchParams.get('code'),
    state: url.searchParams.get('state'),
    cookieState: readCookie(req, STATE_COOKIE),
    config: github,
    isOwner
  })
  const clearState = stateCookie('', 0)

  if (!result.ok) {
    console.info('[auth] sign-in not completed', { reason: result.reason, domain: result.domain ?? null, at: new Date().toISOString() })
    return redirect(`/#auth_error=${result.reason}`, [clearState])
  }
  const session = createSession({ email: result.email }, secret)
  return redirect('/', [clearState, sessionCookie(session)])
}

export const config = { path: '/api/auth/github/callback' }
