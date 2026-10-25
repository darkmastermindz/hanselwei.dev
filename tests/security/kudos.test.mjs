// Kudos on the About card's XP entries (netlify/functions/kudos.mjs): only known entries count,
// once per visitor per entry per day, hostile bodies and stored data can't add keys or crash it,
// and kudos sent at the same moment are all counted
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cachedPostExists, handleKudos } from '../../netlify/functions/kudos.mjs'
import { XP_IDS } from '../../data/xp.mjs'
import { KUDOS_BODIES, KUDOS_POST_IDS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

// An in-memory stand-in for a Netlify Blobs store, with its conditional writes
const memoryStore = () => {
  const blobs = new Map()
  let version = 0
  const put = (key, text, { onlyIfNew, onlyIfMatch } = {}) => {
    const current = blobs.get(key)
    if (onlyIfNew && current) return { modified: false }
    if (onlyIfMatch && current?.etag !== onlyIfMatch) return { modified: false }
    const etag = `"${++version}"`
    blobs.set(key, { text, etag })
    return { modified: true, etag }
  }
  const read = (key, type) => {
    const blob = blobs.get(key)
    if (!blob) return null
    return type === 'json' ? JSON.parse(blob.text) : blob.text
  }
  return {
    blobs,
    get: async (key, { type } = {}) => read(key, type),
    getWithMetadata: async (key, { type } = {}) => (blobs.has(key) ? { data: read(key, type), etag: blobs.get(key).etag, metadata: {} } : null),
    set: async (key, text, options) => put(key, String(text), options),
    setJSON: async (key, value, options) => put(key, JSON.stringify(value), options),
    delete: async key => void blobs.delete(key)
  }
}

const ID = 'education-ytt200'
const post = (body, headers = {}) => new Request('https://www.hanselwei.dev/api/kudos', { method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers }, body })
const get = () => new Request('https://www.hanselwei.dev/api/kudos')

test('every XP entry has a unique id, and the ids stay the same shape', () => {
  assert.ok(XP_IDS.has(ID))
  for (const id of XP_IDS) assert.match(id, /^(education|work|volunteer|achievement)-[a-z0-9]+(?:-[a-z0-9]+)*$/, id)
})

test('a kudos counts once per visitor per entry per day', async () => {
  const store = memoryStore()
  const send = (ip, now = Date.UTC(2026, 9, 25, 12)) => handleKudos(post(JSON.stringify({ id: ID })), { store, ip, secret: 's', now })
  assert.deepEqual(await (await send('1.1.1.1')).json(), { id: ID, count: 1, counted: true })
  assert.deepEqual(await (await send('1.1.1.1')).json(), { id: ID, count: 1, counted: false })
  assert.deepEqual(await (await send('2.2.2.2')).json(), { id: ID, count: 2, counted: true })
  assert.deepEqual(await (await send('1.1.1.1', Date.UTC(2026, 9, 26, 1))).json(), { id: ID, count: 3, counted: true })
  assert.deepEqual(await (await handleKudos(get(), { store })).json(), { counts: { [ID]: 3 } })
  // The markers don't hold anyone's IP address
  for (const key of store.blobs.keys()) assert.doesNotMatch(key, /\d+\.\d+\.\d+\.\d+/)
})

test('kudos sent at the same moment are all counted', async () => {
  const store = memoryStore()
  const results = await Promise.all(Array.from({ length: 5 }, (_, i) => handleKudos(post(JSON.stringify({ id: ID })), { store, ip: `10.0.0.${i}` })))
  assert.ok(results.every(r => r.status === 200))
  assert.equal((await store.get('counts', { type: 'json' }))[ID], 5)
})

test('hostile bodies and unknown ids are refused and never stored', async () => {
  const store = memoryStore()
  const postExists = async () => assert.fail('a hostile id should never be looked up')
  for (const body of [...KUDOS_BODIES, ...XSS_HTML.map(id => JSON.stringify({ id })), ...PROTOTYPE_KEYS.map(id => JSON.stringify({ id }))]) {
    const res = await handleKudos(post(body), { store, ip: '1.1.1.1', postExists })
    assert.ok([400, 404].includes(res.status), `${body.slice(0, 50)} -> ${res.status}`)
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8')
    await res.json()
  }
  assert.equal(store.blobs.size, 0)
  assert.equal((await handleKudos(post('x'.repeat(2000)), { store })).status, 413)
})

test('only the site\'s own pages can send kudos, and only by GET or POST', async () => {
  const store = memoryStore()
  for (const site of ['cross-site', 'same-site', 'none']) {
    assert.equal((await handleKudos(post(JSON.stringify({ id: ID }), { 'sec-fetch-site': site }), { store })).status, 403, site)
  }
  for (const method of ['PUT', 'DELETE', 'PATCH']) {
    assert.equal((await handleKudos(new Request('https://www.hanselwei.dev/api/kudos', { method }), { store })).status, 405, method)
  }
  assert.equal(store.blobs.size, 0)
})

test('stored counts are cleaned: unknown keys, prototype keys and non-counts are dropped', async () => {
  const store = memoryStore()
  store.blobs.set('counts', { etag: '"x"', text: JSON.stringify({ [ID]: 2, 'education-unknown': 9, __proto__: { polluted: 1 }, constructor: 5, 'achievement-around-the-crown-10k': -1, 'work-career-break-apr-2024': '3', 'achievement-mlh-hacknc-2018': 1.5 }) })
  const { counts } = await (await handleKudos(get(), { store })).json()
  assert.deepEqual(counts, { [ID]: 2 })
  assert.equal({}.polluted, undefined)
})

test('a post gets kudos once the site is found to have it; a made-up one never does', async () => {
  const store = memoryStore()
  const asked = []
  const postExists = async slug => (asked.push(slug), slug === 'hello-world')
  const send = id => handleKudos(post(JSON.stringify({ id })), { store, ip: '1.1.1.1', postExists })
  assert.deepEqual(await (await send('post-hello-world')).json(), { id: 'post-hello-world', count: 1, counted: true })
  assert.equal((await send('post-not-a-post')).status, 404)
  assert.deepEqual(asked, ['hello-world', 'not-a-post'])
  assert.deepEqual(await (await handleKudos(get(), { store })).json(), { counts: { 'post-hello-world': 1 } })
  // Nothing for the made-up post: no count, no marker
  assert.equal([...store.blobs.keys()].filter(k => k.startsWith('seen/')).length, 1)
})

test('hostile post ids are refused before the site is asked about them', async () => {
  const store = memoryStore()
  const postExists = async slug => assert.fail(`looked up ${JSON.stringify(slug)}`)
  for (const id of KUDOS_POST_IDS) {
    const res = await handleKudos(post(JSON.stringify({ id })), { store, ip: '1.1.1.1', postExists })
    assert.equal(res.status, 404, JSON.stringify(id).slice(0, 60))
  }
  assert.equal(store.blobs.size, 0)
})

test('whether a post exists is asked once, then kept for ten minutes', async () => {
  let calls = 0
  const check = async slug => (calls++, slug === 'kept-post')
  const t = Date.UTC(2026, 9, 25)
  assert.equal(await cachedPostExists('kept-post', 'https://x.example', t, check), true)
  assert.equal(await cachedPostExists('kept-post', 'https://x.example', t + 60_000, check), true)
  assert.equal(calls, 1)
  assert.equal(await cachedPostExists('kept-post', 'https://x.example', t + 11 * 60_000, check), true)
  assert.equal(calls, 2)
})

test('stored post counts keep only plain slugs', async () => {
  const store = memoryStore()
  store.blobs.set('counts', { etag: '"x"', text: JSON.stringify({ 'post-hello-world': 3, 'post-../counts': 5, 'post-Hello': 2, 'post-': 1, 'post-x': 0 }) })
  assert.deepEqual((await (await handleKudos(get(), { store })).json()).counts, { 'post-hello-world': 3 })
})
