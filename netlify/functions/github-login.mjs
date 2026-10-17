// GET /api/auth/github: starts the GitHub sign-in with a one-time `state` value, kept in
// a short-lived cookie that the callback must match
import { authorizeUrl, githubConfig, newState, stateCookie } from '../lib/oauth.mjs'

export default async req => {
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET' } })
  const github = githubConfig(process.env)
  if (!github) return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } })

  const state = newState()
  return new Response(null, {
    status: 302,
    headers: {
      location: authorizeUrl({ clientId: github.clientId, state }),
      'set-cookie': stateCookie(state),
      'cache-control': 'no-store'
    }
  })
}

export const config = { path: '/api/auth/github' }
