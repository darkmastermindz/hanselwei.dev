// The auth routes: methods, cookies, origins, and what a signed-out or non-owner visitor gets
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import login from '../../netlify/functions/github-login.mjs'
import callback from '../../netlify/functions/github-callback.mjs'
import me from '../../netlify/functions/me.mjs'
import refresh from '../../netlify/functions/auth-refresh.mjs'
import logout from '../../netlify/functions/auth-logout.mjs'
import { createSession } from '../../netlify/lib/session.mjs'
import { STATE_COOKIE } from '../../netlify/lib/oauth.mjs'

const SECRET = 'a'.repeat(48)
const STATE = 'S'.repeat(43)
const OWNER = 'hello@hanselwei.dev'
const SITE = 'https://www.hanselwei.dev'
const ENV = { GITHUB_CLIENT_ID: 'client-id', GITHUB_CLIENT_SECRET: 'client-secret', SESSION_SECRET: SECRET }
const realFetch = globalThis.fetch
const realInfo = console.info

beforeEach(() => {
  Object.assign(process.env, ENV)
  console.info = () => {}
})
afterEach(() => {
  for (const key of Object.keys(ENV)) delete process.env[key]
  globalThis.fetch = realFetch
  console.info = realInfo
})

const req = (path, { method = 'GET', cookie, origin, host } = {}) =>
  new Request(`${host ?? SITE}${path}`, {
    method,
    headers: { ...(cookie && { cookie }), ...(origin && { origin }) }
  })
const ownerSession = (email = OWNER) => `hw_session=${createSession({ email }, SECRET)}`

test('sign-in starts only with GET, and goes to GitHub with a fresh state cookie', async () => {
  const res = await login(req('/api/auth/github'))
  assert.equal(res.status, 302)
  const location = new URL(res.headers.get('location'))
  assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize')
  assert.equal(location.searchParams.get('client_id'), 'client-id')
  assert.equal(location.searchParams.get('redirect_uri'), `${SITE}/api/auth/github/callback`)
  assert.ok(location.searchParams.get('state').length >= 43)
  const cookie = res.headers.get('set-cookie')
  for (const part of ['hw_oauth_state=', 'Path=/api/auth', 'Max-Age=600', 'HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(cookie.includes(part), part)
  assert.equal((await login(req('/api/auth/github'))).headers.get('location') === res.headers.get('location'), false)
})

test('sign-in ignores where the request says it came from, and any return address', async () => {
  const res = await login(req('/api/auth/github?return_to=https://evil.example&redirect_uri=https://evil.example', { host: 'https://evil.example' }))
  const location = res.headers.get('location')
  assert.ok(!location.includes('evil.example'))
  assert.ok(location.includes(encodeURIComponent(`${SITE}/api/auth/github/callback`)))
})

test('sign-in without GitHub configured is a generic 503, not a crash', async () => {
  delete process.env.GITHUB_CLIENT_ID
  const res = await login(req('/api/auth/github'))
  assert.equal(res.status, 503)
  assert.equal(await res.text(), '')
})

test('the callback signs the owner in and clears the state cookie', async () => {
  globalThis.fetch = async url => {
    if (url.includes('access_token')) return Response.json({ access_token: 'gho_x' })
    return Response.json([{ email: OWNER, verified: true }])
  }
  const res = await callback(req(`/api/auth/github/callback?code=abc&state=${STATE}`, { cookie: `${STATE_COOKIE}=${STATE}` }))
  assert.equal(res.status, 302)
  assert.equal(res.headers.get('location'), '/')
  const cookies = res.headers.getSetCookie()
  assert.ok(cookies.some(c => c.startsWith(`${STATE_COOKIE}=;`) && c.includes('Max-Age=0')))
  const session = cookies.find(c => c.startsWith('hw_session='))
  for (const part of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(session.includes(part), part)
})

test('the callback sends a denied visitor back with only the fixed reason', async () => {
  globalThis.fetch = async url => (url.includes('access_token') ? Response.json({ access_token: 'gho_x' }) : Response.json([{ email: 'x@example.com', verified: true }]))
  const res = await callback(req(`/api/auth/github/callback?code=abc&state=${STATE}`, { cookie: `${STATE_COOKIE}=${STATE}` }))
  assert.equal(res.headers.get('location'), '/#auth_error=denied')
  assert.equal(res.headers.getSetCookie().some(c => c.startsWith('hw_session=') && !c.includes('Max-Age=0')), false)
})

test('the callback never reflects GitHub text or the token', async () => {
  globalThis.fetch = async () => new Response('<script>alert(1)</script> gho_x', { status: 500 })
  const res = await callback(req(`/api/auth/github/callback?code=abc&state=${STATE}`, { cookie: `${STATE_COOKIE}=${STATE}` }))
  assert.equal(res.headers.get('location'), '/#auth_error=failed')
  assert.equal(JSON.stringify([...res.headers.entries()]).includes('script'), false)
})

test('the callback refuses a missing state cookie without calling GitHub', async () => {
  let called = false
  globalThis.fetch = async () => {
    called = true
    return Response.json([])
  }
  const res = await callback(req(`/api/auth/github/callback?code=abc&state=${STATE}`))
  assert.equal(res.headers.get('location'), '/#auth_error=failed')
  assert.equal(called, false)
})

test('the callback logs only the outcome and the email domain, never the token', async () => {
  const logged = []
  console.info = (...args) => logged.push(JSON.stringify(args))
  globalThis.fetch = async url => (url.includes('access_token') ? Response.json({ access_token: 'gho_secret' }) : Response.json([{ email: 'x@example.com', verified: true }]))
  await callback(req(`/api/auth/github/callback?code=abc&state=${STATE}`, { cookie: `${STATE_COOKIE}=${STATE}` }))
  assert.equal(logged.length, 1)
  assert.ok(logged[0].includes('example.com'))
  assert.equal(logged[0].includes('gho_secret'), false)
})

test('/api/me answers 401 signed out, 403 for a non-owner, 200 for the owner, and only GET', async () => {
  assert.equal((await me(req('/api/me'))).status, 401)
  assert.equal((await me(req('/api/me', { cookie: 'hw_session=forged.value' }))).status, 401)
  assert.equal((await me(req('/api/me', { cookie: `hw_session=${createSession({ email: 'x@example.com' }, SECRET)}` }))).status, 403)
  const ok = await me(req('/api/me', { cookie: ownerSession() }))
  assert.equal(ok.status, 200)
  assert.equal(ok.headers.get('cache-control'), 'private, no-store')
  assert.equal(ok.headers.get('x-robots-tag'), 'noindex')
  assert.deepEqual(await ok.json(), { email: OWNER, name: '', owner: true })
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) assert.equal((await me(req('/api/me', { method, cookie: ownerSession() }))).status, 405, method)
})

test('/api/me is a 503 when the session secret is missing', async () => {
  delete process.env.SESSION_SECRET
  assert.equal((await me(req('/api/me', { cookie: ownerSession() }))).status, 503)
})

test('refresh and logout only accept POST from this site', async () => {
  for (const fn of [refresh, logout]) {
    assert.equal((await fn(req('/api/auth/x'))).status, 405)
    assert.equal((await fn(req('/api/auth/x', { method: 'POST', origin: 'https://evil.example' }))).status, 403)
    assert.equal((await fn(req('/api/auth/x', { method: 'POST' }))).status, 403) // no Origin at all
  }
})

test('refresh renews an owner session, and clears a bad one', async () => {
  const ok = await refresh(req('/api/auth/refresh', { method: 'POST', origin: SITE, cookie: ownerSession() }))
  assert.equal(ok.status, 204)
  assert.ok(ok.headers.get('set-cookie').startsWith('hw_session='))
  const bad = await refresh(req('/api/auth/refresh', { method: 'POST', origin: SITE, cookie: 'hw_session=nope' }))
  assert.equal(bad.status, 401)
  assert.ok(bad.headers.get('set-cookie').includes('Max-Age=0'))
  const other = await refresh(req('/api/auth/refresh', { method: 'POST', origin: SITE, cookie: `hw_session=${createSession({ email: 'x@example.com' }, SECRET)}` }))
  assert.equal(other.status, 401)
})

test('logout clears the session cookie', async () => {
  const res = await logout(req('/api/auth/logout', { method: 'POST', origin: SITE, cookie: ownerSession() }))
  assert.equal(res.status, 204)
  assert.ok(res.headers.get('set-cookie').includes('Max-Age=0'))
})
