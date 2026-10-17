// The Netlify Identity event functions are the server-side lock: only allow-listed
// emails (exact, case-insensitive match) may sign up or log in.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import identity from '../../netlify/functions/identity.mjs'
import me from '../../netlify/functions/me.mjs'
import { isOwner, ownerEmails } from '../../netlify/lib/owners.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

const owner = ownerEmails()[0]

const event = email => {
  let denied = false
  return { user: { email, appMetadata: { roles: ['admin'] } }, deny: () => ((denied = true), 'denied'), get denied() { return denied } }
}

const LOOKALIKES = [
  ` ${owner}`,
  `${owner} `,
  `${owner}.evil.example`,
  `x${owner}`,
  `${owner}\u0000`,
  owner.replace('@', '@@'),
  owner.replace('.', '․'), // one dot leader, looks like "."
  ...XSS_HTML,
  ...JS_BREAKOUTS,
  ...PROTOTYPE_KEYS,
  '',
  null,
  undefined,
  42,
  {},
  [owner]
]

test('anyone not on the list is denied at signup, validation and login', () => {
  for (const email of LOOKALIKES) {
    assert.equal(isOwner(email), false, JSON.stringify(email))
    for (const hook of ['userValidate', 'userSignup', 'userLogin']) {
      const e = event(email)
      identity[hook](e)
      assert.equal(e.denied, true, `${hook} ${JSON.stringify(email)}`)
    }
  }
})

test('the owner is let in, case-insensitively, and gets the owner role', () => {
  for (const email of [owner, owner.toUpperCase()]) {
    for (const hook of ['userValidate', 'userLogin']) {
      const e = event(email)
      identity[hook](e)
      assert.equal(e.denied, false, hook)
    }
    const e = event(email)
    const result = identity.userSignup(e)
    assert.equal(e.denied, false)
    assert.deepEqual(result.user.appMetadata.roles.sort(), ['admin', 'owner'])
  }
})

test('/api/me only answers GET, and never to a signed-out request', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    const res = await me(new Request('https://www.hanselwei.dev/api/me', { method }))
    assert.equal(res.status, 405, method)
  }
  const res = await me(new Request('https://www.hanselwei.dev/api/me'))
  assert.equal(res.status, 401)
  assert.equal(res.headers.get('cache-control'), 'private, no-store')
})
