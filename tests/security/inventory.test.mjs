// The gear inventory is served at /api/inventory/:list?section=&category=&tag=&status=&q=
// and drives /gear/:list. Arbitrary path and query values must never crash it, reach
// object prototypes, or be reflected unescaped.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import handler from '../../netlify/functions/inventory.mjs'
import { hasInventory, queryInventory } from '../../data/inventory.mjs'
import { PROTOTYPE_KEYS, XSS_HTML, JS_BREAKOUTS, REDOS } from './payloads.mjs'

const call = async (list, params = {}) => {
  const url = new URL(`https://www.hanselwei.dev/api/inventory${list === undefined ? '' : `/${encodeURIComponent(list)}`}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return handler(new Request(url), { params: list === undefined ? {} : { list } })
}

test('prototype keys are not inventory lists', async () => {
  for (const key of PROTOTYPE_KEYS) {
    assert.equal(hasInventory(key), false, key)
    assert.equal(queryInventory(key), null, key)
    const res = await call(key)
    assert.equal(res.status, 404, `${key} -> ${res.status}`)
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8')
    await res.json() // valid JSON, not a crash page
  }
})

test('hostile list names and filters return JSON without crashing', async () => {
  for (const payload of [...XSS_HTML, ...JS_BREAKOUTS, REDOS]) {
    const res = await call(payload)
    assert.equal(res.status, 404)
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8')
    const body = await res.json()
    assert.equal(typeof body.error, 'string')

    for (const key of ['section', 'category', 'tag', 'status', 'q']) {
      const filtered = await call('outdoor', { [key]: payload })
      assert.equal(filtered.status, 200, `${key}=${payload.slice(0, 40)}`)
      const data = await filtered.json()
      assert.ok(Array.isArray(data.items))
    }
  }
})

test('prototype keys as filter values match nothing and leak nothing', async () => {
  for (const key of PROTOTYPE_KEYS) {
    const data = await (await call('outdoor', { status: key, section: key })).json()
    assert.deepEqual(data.items, [])
  }
})

test('only GET and OPTIONS are allowed', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    const res = await handler(new Request('https://www.hanselwei.dev/api/inventory/outdoor', { method }), { params: { list: 'outdoor' } })
    assert.equal(res.status, 405, method)
  }
})
