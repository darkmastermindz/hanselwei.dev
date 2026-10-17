// The owner's session cookie: only the server can make one, and nothing it reads from a
// browser is trusted without the signature.
import { test } from 'node:test'
import { createHmac } from 'node:crypto'
import assert from 'node:assert/strict'
import { clearSessionCookie, createSession, readCookie, readSession, SESSION_COOKIE, sessionCookie, sessionSecret, SESSION_MAX_AGE } from '../../netlify/lib/session.mjs'
import { PROTOTYPE_KEYS, XSS_HTML, JS_BREAKOUTS } from './payloads.mjs'

const SECRET = 'a'.repeat(48)
const NOW = Date.UTC(2026, 9, 17, 12)
const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const iat = Math.floor(NOW / 1000)

test('a session round-trips for its email, and only for one hour', () => {
  const token = createSession({ email: 'hello@hanselwei.dev', name: 'Hansel' }, SECRET, NOW)
  assert.deepEqual(readSession(token, SECRET, NOW + 1000), { email: 'hello@hanselwei.dev', name: 'Hansel' })
  assert.equal(readSession(token, SECRET, NOW + (SESSION_MAX_AGE - 1) * 1000) !== null, true)
  assert.equal(readSession(token, SECRET, NOW + SESSION_MAX_AGE * 1000), null) // exactly one hour: expired
})

test('a tampered payload, a wrong secret or a forged signature is rejected', () => {
  const token = createSession({ email: 'hello@hanselwei.dev' }, SECRET, NOW)
  const [, signature] = token.split('.')
  const forged = `${b64({ email: 'hello@hanselwei.dev.evil.example', iat, exp: iat + 3000 })}.${signature}`
  assert.equal(readSession(forged, SECRET, NOW), null)
  assert.equal(readSession(token, 'b'.repeat(48), NOW), null)
  assert.equal(readSession(`${token.split('.')[0]}.AAAA`, SECRET, NOW), null)
})

test('unsigned and "alg: none" tokens are rejected', () => {
  const body = b64({ email: 'hello@hanselwei.dev', iat, exp: iat + 3000 })
  assert.equal(readSession(`${b64({ alg: 'none' })}.${body}.`, SECRET, NOW), null)
  assert.equal(readSession(`${body}.`, SECRET, NOW), null)
  assert.equal(readSession(body, SECRET, NOW), null)
})

test('future-dated and oversize sessions are rejected', () => {
  const future = createSession({ email: 'hello@hanselwei.dev' }, SECRET, NOW + 2 * 60 * 60 * 1000)
  assert.equal(readSession(future, SECRET, NOW), null)
  const long = `${b64({ email: 'hello@hanselwei.dev', iat, exp: iat + 10 * SESSION_MAX_AGE })}`
  const sig = createHmac('sha256', SECRET).update(long).digest('base64url')
  assert.equal(readSession(`${long}.${sig}`, SECRET, NOW), null)
})

test('hostile or malformed cookie values are rejected without throwing', () => {
  for (const value of [undefined, null, '', 42, {}, ...PROTOTYPE_KEYS, ...XSS_HTML, ...JS_BREAKOUTS, 'a'.repeat(10_000)]) {
    assert.equal(readSession(value, SECRET, NOW), null, String(value).slice(0, 40))
  }
})

test('a secret must be long enough to use', () => {
  assert.equal(sessionSecret({ SESSION_SECRET: 'short' }), null)
  assert.equal(sessionSecret({}), null)
  assert.equal(sessionSecret({ SESSION_SECRET: SECRET }), SECRET)
})

test('the cookie is HttpOnly, Secure, SameSite=Lax, site-wide, and an hour long', () => {
  const cookie = sessionCookie('x')
  for (const part of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSION_MAX_AGE}`]) assert.ok(cookie.includes(part), part)
  assert.ok(clearSessionCookie().includes('Max-Age=0'))
  assert.ok(clearSessionCookie().startsWith(`${SESSION_COOKIE}=;`))
})

test('reading a cookie finds the exact name only', () => {
  const req = new Request('https://www.hanselwei.dev/', { headers: { cookie: 'hw_session2=no; hw_session=yes; other=1' } })
  assert.equal(readCookie(req, SESSION_COOKIE), 'yes')
  assert.equal(readCookie(new Request('https://www.hanselwei.dev/'), SESSION_COOKIE), null)
})
