// Gear list edits are only kept for a signed-in owner (/api/gear/submit), and still nothing in them
// is trusted until it is signed by an owner (netlify/lib/gearToken.mjs) and checked
// (utils/gearEdits.mjs)
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { applyOps, describeOp, LIMITS, serializeList, validateOps } from '../../utils/gearEdits.mjs'
import { createGearToken, GEAR_TOKEN_MAX_AGE, gearKey, readGearToken } from '../../netlify/lib/gearToken.mjs'
import { handleSubmit } from '../../netlify/functions/gear-submit.mjs'
import gearVerify from '../../netlify/functions/gear-verify.mjs'
import { createSession, sessionSecret } from '../../netlify/lib/session.mjs'
import { GEAR_TEXT, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

const KEY = 'g'.repeat(48)
const NOW = Date.UTC(2026, 9, 25, 12)
const item = (name = 'Rope') => ({ name, section: 'Climbing', category: 'Ropes' })
const base = { title: 'T', emoji: '🧪', description: '', sections: ['Climbing'], items: [{ id: 'rope', section: 'Climbing', category: 'Ropes', name: 'Rope', qty: 1, tags: [], status: 'owned' }] }

test('item text is kept as plain text, one line, cut to size', () => {
  for (const name of [...GEAR_TEXT, ...XSS_HTML]) {
    const { ops, error } = validateOps([{ op: 'add', item: { ...item(name), brand: name, notes: name, tags: [name] } }])
    if (error) continue // a name that is nothing but stripped characters
    const it = ops[0].item
    for (const value of [it.name, it.brand, it.notes, ...it.tags].filter(Boolean)) {
      assert.doesNotMatch(value, /[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/, JSON.stringify(name))
    }
    assert.ok(it.name.length <= LIMITS.name && (it.notes ?? '').length <= LIMITS.notes)
  }
})

test('the stored file stays valid JSON whatever the text, and is the same every time', () => {
  const { ops } = validateOps(GEAR_TEXT.map(name => ({ op: 'add', item: item(name) })).filter(o => validateOps([o]).ops))
  const once = serializeList(applyOps(base, ops).list)
  assert.equal(serializeList(applyOps(base, ops).list), once)
  assert.doesNotThrow(() => JSON.parse(once))
})

test('ids, operations, quantities and statuses outside what is allowed are rejected or fall back', () => {
  for (const id of ['__proto__', '__defineGetter__', '../outdoor', 'ROPE', 'rope--x', '', 'a'.repeat(200), null, {}]) {
    assert.ok(validateOps([{ op: 'remove', id }]).error, String(id))
  }
  // Ids are only ever compared, never used as keys: one shaped like "constructor" finds nothing
  for (const id of PROTOTYPE_KEYS.filter(key => validateOps([{ op: 'remove', id: key }]).ops)) {
    const { list, skipped } = applyOps(base, validateOps([{ op: 'remove', id }]).ops)
    assert.equal(list.items.length, 1, id)
    assert.equal(skipped.length, 1, id)
  }
  assert.ok(validateOps([{ op: 'delete', id: 'rope' }]).error)
  assert.ok(validateOps([{ op: '__proto__' }]).error)
  assert.ok(validateOps('not a list').error)
  assert.ok(validateOps([]).error)
  assert.ok(validateOps(Array.from({ length: LIMITS.ops + 1 }, () => ({ op: 'remove', id: 'rope' }))).error)
  for (const qty of [-1, 1.5, 1e9, 'NaN', '__proto__', null]) {
    assert.equal(validateOps([{ op: 'add', item: { ...item(), qty } }]).ops[0].item.qty, 1, String(qty))
  }
  assert.equal(validateOps([{ op: 'add', item: { ...item(), status: 'constructor' } }]).ops[0].item.status, 'owned')
  const tags = Array.from({ length: 100 }, (_, i) => `t${i}`)
  assert.equal(validateOps([{ op: 'add', item: { ...item(), tags } }]).ops[0].item.tags.length, LIMITS.tags)
})

test('only the known item fields are kept (no __proto__ or extra keys reach the file)', () => {
  const sneaky = JSON.parse('{"name":"Rope","section":"Climbing","category":"Ropes","__proto__":{"admin":true},"script":"x"}')
  const { ops } = validateOps([{ op: 'add', item: sneaky }])
  assert.deepEqual(Object.keys(ops[0].item), ['section', 'category', 'name', 'qty', 'tags', 'status'])
  assert.equal({}.admin, undefined)
})

test('change descriptions defuse @mentions and code spans before GitHub renders them', () => {
  const line = describeOp({ op: 'add', item: { name: '@everyone `x`', section: 'S', category: 'C', qty: 1 } })
  assert.doesNotMatch(line, /@everyone/)
  assert.doesNotMatch(line, /`/)
})

const sign = (opts = {}, key = KEY, now = NOW) => createGearToken({ email: 'hello@hanselwei.dev', list: 'camera', opsText: '[1]', ...opts }, key, now)

test('a gear token is good only for its list and its exact changes, for 15 minutes', () => {
  const token = sign()
  assert.deepEqual(readGearToken(token, { list: 'camera', opsText: '[1]' }, KEY, NOW + 1000), { email: 'hello@hanselwei.dev', list: 'camera' })
  assert.equal(readGearToken(token, { list: 'outdoor', opsText: '[1]' }, KEY, NOW), null)
  assert.equal(readGearToken(token, { list: 'camera', opsText: '[2]' }, KEY, NOW), null)
  assert.equal(readGearToken(token, { list: 'camera', opsText: '[1]' }, 'h'.repeat(48), NOW), null)
  assert.equal(readGearToken(token, { list: 'camera', opsText: '[1]' }, KEY, NOW + (GEAR_TOKEN_MAX_AGE + 1) * 1000), null)
  assert.equal(readGearToken(sign({}, KEY, NOW + 10 * 60 * 1000), { list: 'camera', opsText: '[1]' }, KEY, NOW), null) // from the future
})

test('forged, unsigned and malformed gear tokens are rejected, and short keys are refused', () => {
  const [, signature] = sign().split('.')
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const iat = Math.floor(NOW / 1000)
  const forged = `${b64({ email: 'hello@hanselwei.dev', list: 'outdoor', digest: 'x', iat, exp: iat + 60 })}.${signature}`
  for (const token of [forged, sign().split('.')[0], `${sign()}.x`, '', 'a.b', null, 42, 'x'.repeat(5000)]) {
    assert.equal(readGearToken(token, { list: 'camera', opsText: '[1]' }, KEY, NOW), null, String(token).slice(0, 20))
  }
  assert.equal(gearKey({ GITHUB_CLIENT_SECRET: 'short' }), null)
  assert.equal(gearKey({}), null)
})

test('the edit key comes from the sign-in secret, but is its own key (not the secret, not the session key)', () => {
  const env = { GITHUB_CLIENT_SECRET: 'client-secret-of-sufficient-length' }
  const key = gearKey(env)
  assert.equal(key, gearKey({ ...env }))
  assert.notEqual(key, env.GITHUB_CLIENT_SECRET)
  assert.notEqual(key, sessionSecret(env))
  assert.notEqual(key, gearKey({ GITHUB_CLIENT_SECRET: 'another-secret-of-sufficient-length' }))
  // A session cookie's signature can't pass as an edit token's
  const session = createSession({ email: 'hello@hanselwei.dev' }, sessionSecret(env), NOW)
  assert.equal(readGearToken(session, { list: 'camera', opsText: '[1]' }, key, NOW), null)
})

// /api/gear/submit and /api/gear/verify
const ENV = { GITHUB_CLIENT_SECRET: 'client-secret-of-sufficient-length' }
const SITE_KEY = gearKey(ENV)
const SITE = 'https://www.hanselwei.dev'
beforeEach(() => Object.assign(process.env, ENV))
afterEach(() => {
  for (const key of Object.keys(ENV)) delete process.env[key]
})
// A stand-in for the "gear-edits" Netlify Blobs store
const memoryStore = () => {
  const blobs = new Map()
  return { blobs, setJSON: async (key, value) => void blobs.set(key, JSON.stringify(value)) }
}
let store = memoryStore()
beforeEach(() => (store = memoryStore()))
const call = ({ method = 'POST', email = 'hello@hanselwei.dev', origin = SITE, body = { list: 'camera', ops: [{ op: 'remove', id: 'x-t5' }] } } = {}) =>
  handleSubmit(
    new Request(`${SITE}/api/gear/submit`, {
      method,
      headers: {
        ...(origin && { origin }),
        ...(email && { cookie: `hw_session=${createSession({ email }, sessionSecret(ENV))}` }),
        'content-type': 'application/json'
      },
      ...(method === 'POST' && { body: typeof body === 'string' ? body : JSON.stringify(body) })
    }),
    { store }
  )

test('submit keeps edits only for a signed-in owner, from this site', async () => {
  assert.equal((await call({ method: 'GET' })).status, 405)
  assert.equal((await call({ origin: 'https://evil.example' })).status, 403)
  assert.equal((await call({ origin: null })).status, 403)
  assert.equal((await call({ email: null })).status, 401)
  assert.equal((await call({ email: 'someone@example.com' })).status, 403)
  delete process.env.GITHUB_CLIENT_SECRET
  assert.equal((await call()).status, 503)
  assert.equal(store.blobs.size, 0, 'nothing kept')
})

test('submit refuses unknown lists, bad changes and bad bodies, and keeps nothing for them', async () => {
  for (const list of [...PROTOTYPE_KEYS, '../camera', 'Camera']) assert.equal((await call({ body: { list, ops: [{ op: 'remove', id: 'x' }] } })).status, 404, list)
  assert.equal((await call({ body: { list: 'camera', ops: [{ op: 'nuke' }] } })).status, 422)
  assert.equal((await call({ body: '{not json' })).status, 400)
  assert.equal((await call({ body: 'x'.repeat(300 * 1024) })).status, 413)
  assert.equal(store.blobs.size, 0)
})

test('what submit keeps is the checked changes, signed for exactly them, under a pending/ key', async () => {
  const res = await call({ body: { list: 'camera', ops: [{ op: 'add', item: { ...item('<b>Lens</b>\nx'), extra: 1 } }] } })
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('cache-control'), 'private, no-store')
  const { key } = await res.json()
  assert.match(key, /^pending\/\d{4}-\d\d-\d\dT[\d-]+Z-[0-9a-f]{12}$/)
  const kept = JSON.parse(store.blobs.get(key))
  assert.deepEqual(Object.keys(kept).sort(), ['at', 'list', 'ops', 'token'])
  assert.equal(JSON.parse(kept.ops)[0].item.name, '<b>Lens</b> x')
  assert.ok(readGearToken(kept.token, { list: 'camera', opsText: kept.ops }, SITE_KEY, Date.parse(kept.at)))
  assert.equal(readGearToken(kept.token, { list: 'camera', opsText: kept.ops.replace('Lens', 'Lens2') }, SITE_KEY), null)
  // And the site's own check agrees
  assert.equal((await verify(kept)).status, 200)
})

const verify = (body, method = 'POST') =>
  gearVerify(new Request(`${SITE}/api/gear/verify`, { method, ...(method === 'POST' && { body: typeof body === 'string' ? body : JSON.stringify(body) }) }))
const submission = (over = {}, { email = 'hello@hanselwei.dev', signAt = Date.now(), signFor } = {}) => {
  const ops = '[{"op":"remove","id":"x-t5"}]'
  const token = createGearToken({ email, list: 'camera', opsText: signFor ?? ops }, SITE_KEY, signAt)
  return { list: 'camera', ops, token, at: new Date(signAt + 1000).toISOString(), ...over }
}

test('verify says yes only to an owner\'s token for exactly that list and those changes, sent in time', async () => {
  assert.equal((await verify(submission())).status, 200)
  assert.equal((await verify(submission({}, { email: 'someone@example.com' }))).status, 403)
  assert.equal((await verify(submission({}, { signFor: '[]' }))).status, 403)
  assert.equal((await verify(submission({ list: 'outdoor' }))).status, 403)
  assert.equal((await verify(submission({ ops: '[{"op":"remove","id":"other"}]' }))).status, 403)
  const old = Date.now() - 60 * 60 * 1000
  assert.equal((await verify(submission({}, { signAt: old }))).status, 200) // sent in time, checked later
  assert.equal((await verify(submission({ at: new Date().toISOString() }, { signAt: old }))).status, 403) // sent too late
})

test('verify refuses tokens signed with any other key, and bad requests', async () => {
  const forged = createGearToken({ email: 'hello@hanselwei.dev', list: 'camera', opsText: '[]' }, 'k'.repeat(48), Date.now())
  assert.equal((await verify({ ...submission(), ops: '[]', token: forged })).status, 403)
  for (const list of PROTOTYPE_KEYS) assert.equal((await verify(submission({ list }))).status, 403, list)
  assert.equal((await verify(submission({ at: 'never' }))).status, 403)
  assert.equal((await verify(submission({ at: new Date(Date.now() + 3600_000).toISOString() }))).status, 403)
  assert.equal((await verify(submission({ ops: [1] }))).status, 403)
  assert.equal((await verify('{nope')).status, 400)
  assert.equal((await verify('x'.repeat(400 * 1024))).status, 413)
  assert.equal((await verify(undefined, 'GET')).status, 405)
  delete process.env.GITHUB_CLIENT_SECRET
  assert.equal((await verify(submission())).status, 503)
})
