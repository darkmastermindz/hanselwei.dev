// GitHub signs the person in; these tests check that only a verified owner email gets a
// session, and that nothing about GitHub's replies or the token leaks to the visitor.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signInWithGitHub, verifiedEmails, stateMatches, authorizeUrl, REDIRECT_URI } from '../../netlify/lib/oauth.mjs'
import { isOwner } from '../../netlify/lib/owners.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

const config = { clientId: 'client-id', clientSecret: 'client-secret' }
const STATE = 'S'.repeat(43)
const OWNER = 'hello@hanselwei.dev'

// A stand-in for GitHub's two endpoints
const github = ({ emails = [], tokenBody, tokenStatus = 200, emailsStatus = 200, calls = [] } = {}) => async (url, init) => {
  calls.push({ url, init })
  if (url === 'https://github.com/login/oauth/access_token') {
    return new Response(JSON.stringify(tokenBody ?? { access_token: 'gho_secret_token' }), { status: tokenStatus })
  }
  if (url === 'https://api.github.com/user/emails') {
    return new Response(JSON.stringify(emails), { status: emailsStatus })
  }
  throw new Error(`unexpected request to ${url}`)
}

const run = (overrides = {}, state = STATE, extra = {}) =>
  signInWithGitHub({ code: 'abc123', state, cookieState: STATE, config, isOwner, fetchImpl: github(overrides), ...extra })

test('the owner with a verified email gets in', async () => {
  const result = await run({ emails: [{ email: OWNER, verified: true, primary: true }] })
  assert.deepEqual(result, { ok: true, email: OWNER })
})

test('the owner email matches case-insensitively, and an unverified copy of it does not count', async () => {
  assert.equal((await run({ emails: [{ email: 'HELLO@hanselwei.dev', verified: true }] })).ok, true)
  assert.equal((await run({ emails: [{ email: OWNER, verified: false }] })).ok, false)
  assert.equal((await run({ emails: [{ email: OWNER }] })).ok, false) // no verified flag at all
})

test('everyone else is denied, including lookalike addresses', async () => {
  const lookalikes = [
    'hello@hanselwei.dev.evil.example',
    'hello+x@hanselwei.dev',
    'hellohanselwei.dev@example.com',
    'xhello@hanselwei.dev',
    `${OWNER}\u0000`,
    ' hello@hanselwei.dev',
    ...XSS_HTML,
    ...JS_BREAKOUTS,
    ...PROTOTYPE_KEYS
  ]
  for (const email of lookalikes) {
    const result = await run({ emails: [{ email, verified: true }] })
    assert.equal(result.ok, false, JSON.stringify(email))
    assert.equal(result.reason, 'denied', JSON.stringify(email))
  }
  const stranger = await run({ emails: [{ email: 'someone@example.com', verified: true }] })
  assert.deepEqual(stranger, { ok: false, reason: 'denied', domain: 'example.com' }) // the domain is all that's logged
})

test('an owner email among several accounts still counts, and extra non-owner emails do not', async () => {
  const result = await run({ emails: [{ email: 'a@example.com', verified: true }, { email: OWNER, verified: true }] })
  assert.equal(result.ok, true)
})

test('GitHub errors become the generic failure, with no GitHub text', async () => {
  const cases = [
    { tokenStatus: 500 },
    { tokenBody: { error: 'bad_verification_code', error_description: '<script>alert(1)</script>' } },
    { tokenBody: { access_token: '' } },
    { emailsStatus: 403, emails: { message: 'Resource not accessible <img src=x onerror=alert(1)>' } }
  ]
  for (const overrides of cases) {
    const result = await run(overrides)
    assert.deepEqual(result, { ok: false, reason: 'failed' }, JSON.stringify(overrides).slice(0, 80))
  }
})

test('a network error is a generic failure, not a crash', async () => {
  const result = await signInWithGitHub({
    code: 'abc123',
    state: STATE,
    cookieState: STATE,
    config,
    isOwner,
    fetchImpl: async () => {
      throw new Error('socket hang up')
    }
  })
  assert.deepEqual(result, { ok: false, reason: 'failed' })
})

test('a missing, mismatched, short or equal-but-empty state is rejected before any request', async () => {
  const calls = []
  const cases = [
    { state: STATE, cookieState: undefined },
    { state: STATE, cookieState: 'T'.repeat(43) },
    { state: 'short', cookieState: 'short' },
    { state: '', cookieState: '' },
    { state: null, cookieState: STATE }
  ]
  for (const { state, cookieState } of cases) {
    const result = await signInWithGitHub({ code: 'abc123', state, cookieState, config, isOwner, fetchImpl: github({ calls, emails: [{ email: OWNER, verified: true }] }) })
    assert.deepEqual(result, { ok: false, reason: 'failed' })
  }
  assert.equal(calls.length, 0)
})

test('a missing, empty or oversized code is rejected', async () => {
  for (const code of [null, '', 'x'.repeat(513), ['abc'], { toString: () => 'abc' }]) {
    const result = await signInWithGitHub({ code, state: STATE, cookieState: STATE, config, isOwner, fetchImpl: github({ emails: [{ email: OWNER, verified: true }] }) })
    assert.deepEqual(result, { ok: false, reason: 'failed' }, String(code).slice(0, 20))
  }
})

test('the token is sent once to GitHub and never returned', async () => {
  const calls = []
  const result = await run({ emails: [{ email: OWNER, verified: true }], calls })
  assert.equal(JSON.stringify(result).includes('gho_secret_token'), false)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].init.headers.authorization, 'Bearer gho_secret_token')
})

test('the login URL is fixed: our client, our callback, emails scope, and the state', () => {
  const url = new URL(authorizeUrl({ clientId: 'client-id', state: STATE }))
  assert.equal(url.origin + url.pathname, 'https://github.com/login/oauth/authorize')
  assert.equal(url.searchParams.get('redirect_uri'), 'https://www.hanselwei.dev/api/auth/github/callback')
  assert.equal(url.searchParams.get('scope'), 'user:email')
  assert.equal(url.searchParams.get('state'), STATE)
  assert.equal(REDIRECT_URI, 'https://www.hanselwei.dev/api/auth/github/callback')
})

test('state comparisons need the same long value', () => {
  assert.equal(stateMatches(STATE, STATE), true)
  assert.equal(stateMatches(STATE, `${STATE}x`), false)
  assert.equal(stateMatches(undefined, undefined), false)
})

test('only verified entries count', () => {
  assert.deepEqual(verifiedEmails([{ email: 'a@x.example', verified: true }, { email: 'b@x.example' }, null, { verified: true }]), ['a@x.example'])
  assert.deepEqual(verifiedEmails({ message: 'nope' }), [])
})
