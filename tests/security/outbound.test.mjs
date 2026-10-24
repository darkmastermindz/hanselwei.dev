// The social link hand-off page (/out/<id>, pages/out/[id].vue) reads the id from the URL. Only
// the ids in utils/outbound.js lead anywhere, so it can't be used to send people elsewhere.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OUTBOUND, outboundFor, outPath } from '../../utils/outbound.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { OUTBOUND_IDS, PROTOTYPE_KEYS, UNSAFE_URLS, XSS_HTML } from './payloads.mjs'

test('only known ids lead anywhere', () => {
  for (const value of [...OUTBOUND_IDS, ...UNSAFE_URLS, ...XSS_HTML, ...PROTOTYPE_KEYS, null, undefined, 42, {}, ['mastodon']]) {
    assert.equal(outboundFor(value), null, JSON.stringify(value))
  }
})

test('every known link is an https address', () => {
  for (const [id, link] of Object.entries(OUTBOUND)) {
    assert.equal(outboundFor(id), link)
    assert.equal(safeUrl(link.href), link.href, id)
    assert.match(link.href, /^https:\/\//, id)
  }
})

test('hand-off paths stay on the site', () => {
  assert.equal(outPath('instagram-codes'), '/out/instagram-codes')
  assert.equal(outPath('../x?y=1'), '/out/..%2Fx%3Fy%3D1')
})
