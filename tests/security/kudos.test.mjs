// Kudos on the About card's XP entries (netlify/functions/kudos.mjs): only known entries count,
// once per visitor per entry per day, hostile bodies and stored data can't add keys or crash it,
// and kudos sent at the same moment are all counted
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleKudos, visitorNet } from '../../netlify/functions/kudos.mjs'
import { XP_IDS } from '../../data/xp.mjs'
import { KUDOS_BODIES, KUDOS_IPS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

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
    delete: async key => void blobs.delete(key),
    // Keys under a prefix, or (directories) the next path segment under it, as Netlify Blobs lists
    list: async ({ prefix = '', directories = false } = {}) => {
      const keys = [...blobs.keys()].filter(k => k.startsWith(prefix))
      if (!directories) return { blobs: keys.map(key => ({ key, etag: blobs.get(key).etag })), directories: [] }
      const dirs = new Set()
      const files = []
      for (const k of keys) {
        const rest = k.slice(prefix.length)
        if (rest.includes('/')) dirs.add(prefix + rest.slice(0, rest.indexOf('/')))
        else files.push({ key: k, etag: blobs.get(k).etag })
      }
      return { blobs: files, directories: [...dirs] }
    }
  }
}

const ID = 'education-ytt200'
const post = (body, headers = {}) => new Request('https://www.hanselwei.dev/api/kudos', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.hanselwei.dev', 'sec-fetch-site': 'same-origin', ...headers }, body })
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
  for (const body of [...KUDOS_BODIES, ...XSS_HTML.map(id => JSON.stringify({ id })), ...PROTOTYPE_KEYS.map(id => JSON.stringify({ id }))]) {
    const res = await handleKudos(post(body), { store, ip: '1.1.1.1' })
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

test('kudos only from the site itself: no Origin, or another one, is refused', async () => {
  const store = memoryStore()
  const send = headers => handleKudos(post(JSON.stringify({ id: ID }), headers), { store, ip: '1.1.1.1', origins: ['https://hansel.netlify.app'] })
  for (const origin of [undefined, 'null', 'https://evil.example', 'https://www.hanselwei.dev.evil.example', 'http://www.hanselwei.dev']) {
    const headers = { origin }
    if (origin === undefined) delete headers.origin
    const req = post(JSON.stringify({ id: ID }), headers)
    if (origin === undefined) req.headers.delete('origin')
    assert.equal((await handleKudos(req, { store, ip: '1.1.1.1' })).status, 403, String(origin))
  }
  assert.equal(store.blobs.size, 0)
  // The site's other address (the Netlify one) counts too
  assert.equal((await send({ origin: 'https://hansel.netlify.app' })).status, 200)
})

test('one connection counts once a day, whichever of its IPv6 addresses it uses', async () => {
  const store = memoryStore()
  const send = ip => handleKudos(post(JSON.stringify({ id: ID })), { store, ip, secret: 's', now: Date.UTC(2026, 9, 25, 12) })
  assert.equal((await (await send('2001:db8:abcd:12::1')).json()).counted, true)
  for (const ip of ['2001:db8:abcd:12::2', '2001:db8:abcd:12:ffff:1:2:3', '2001:0DB8:ABCD:0012:0:0:0:9']) assert.equal((await (await send(ip)).json()).counted, false, ip)
  assert.equal((await (await send('2001:db8:abcd:13::1')).json()).counted, true, 'another connection')
  assert.equal((await (await send('::ffff:1.2.3.4')).json()).counted, true)
  assert.equal((await (await send('1.2.3.4')).json()).counted, false, 'IPv4-mapped is the same address')
})

test('visitorNet never throws, and gives bounded text for anything', () => {
  for (const ip of KUDOS_IPS) {
    const net = visitorNet(ip)
    assert.equal(typeof net, 'string')
    assert.ok(net.length <= 64, JSON.stringify(ip).slice(0, 40))
  }
  assert.equal(visitorNet('2001:db8::1'), '2001:db8:0:0::/64')
  assert.equal(visitorNet('fe80::1%eth0'), 'fe80:0:0:0::/64')
  assert.equal(visitorNet('[2001:db8::1]'), '2001:db8:0:0::/64')
  assert.equal(visitorNet('203.0.113.9'), '203.0.113.9')
})

test("markers from before yesterday are swept as new kudos come in; yesterday's and today's stay", async () => {
  const store = memoryStore()
  const day = d => Date.UTC(2026, 9, d, 12)
  for (const [d, ip] of [[20, '1.1.1.1'], [21, '1.1.1.2'], [24, '1.1.1.3'], [25, '1.1.1.4']]) {
    store.blobs.set(`seen/2026-10-${d}/${ip}`, { text: '1', etag: '"x"' })
  }
  await handleKudos(post(JSON.stringify({ id: ID })), { store, ip: '9.9.9.9', now: day(25) })
  const seen = [...store.blobs.keys()].filter(k => k.startsWith('seen/')).map(k => k.split('/')[1]).sort()
  assert.deepEqual([...new Set(seen)], ['2026-10-24', '2026-10-25'])
})

