// Invite links put a token in the URL, and providers come from the Identity settings:
// neither may steer the sign-in redirect anywhere but our own Identity endpoint.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inviteAuthorizeUrl, isProvider } from '../../utils/authLinks.js'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, REDOS, UNSAFE_URLS, XSS_HTML } from './payloads.mjs'

test('only known providers are offered', () => {
  for (const id of [...PROTOTYPE_KEYS, 'email', 'evil', '', null, undefined, {}, 'GitHub']) assert.equal(isProvider(id), false, String(id))
  for (const id of ['github', 'google']) assert.equal(isProvider(id), true)
})

test('hostile invite tokens and providers make no link', () => {
  const tokens = [...XSS_HTML, ...JS_BREAKOUTS, ...UNSAFE_URLS, 'abc&provider=evil', 'abc#x', 'a b', '', REDOS, 'a'.repeat(513), null, undefined, 42]
  for (const token of tokens) assert.equal(inviteAuthorizeUrl('github', token), null, String(token).slice(0, 60))
  for (const provider of [...PROTOTYPE_KEYS, 'evil', 'javascript:alert(1)']) assert.equal(inviteAuthorizeUrl(provider, 'abc123'), null, provider)
})

test('a real invite becomes a same-origin Identity link', () => {
  const url = inviteAuthorizeUrl('github', 'Ab-9_xY')
  assert.equal(url, '/.netlify/identity/authorize?provider=github&invite_token=Ab-9_xY')
  const parsed = new URL(url, 'https://www.hanselwei.dev')
  assert.equal(parsed.origin, 'https://www.hanselwei.dev')
  assert.deepEqual([...parsed.searchParams.keys()], ['provider', 'invite_token'])
})
