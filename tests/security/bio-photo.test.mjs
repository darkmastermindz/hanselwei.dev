// The Bio photo (/api/bio-photo) goes only to the site's own page, never cached or indexed, and
// the public repo holds it only encrypted.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { allowPhotoRequest, decryptPhoto, encryptPhoto, PHOTO_HEADERS } from '../../netlify/lib/bioPhoto.mjs'
import sealed from '../../netlify/lib/bioPhoto.sealed.mjs'
import handler from '../../netlify/functions/bio-photo.mjs'
import { JS_BREAKOUTS, UNSAFE_URLS, XSS_HTML } from './payloads.mjs'

const URL_ = 'https://www.hanselwei.dev/api/bio-photo'
const fetchFromPage = { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' }
// A plain lookup, so header values a real request could never carry (newlines) still get tested
const allowed = headers => allowPhotoRequest({ get: name => (Object.hasOwn(headers, name) ? headers[name] : null) }, URL_)

test("the site's own script fetch is allowed", () => {
  assert.equal(allowed(fetchFromPage), true)
  assert.equal(allowed({ ...fetchFromPage, 'sec-fetch-mode': 'same-origin' }), true)
})

test('direct visits, new tabs, <img> embeds and other sites are refused', () => {
  assert.equal(allowed({ 'sec-fetch-site': 'none', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' }), false)
  assert.equal(allowed({ 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' }), false)
  assert.equal(allowed({ 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'image' }), false)
  assert.equal(allowed({ ...fetchFromPage, 'sec-fetch-site': 'cross-site' }), false)
  assert.equal(allowed({ ...fetchFromPage, 'sec-fetch-site': 'same-site' }), false)
  assert.equal(allowed({}), false) // curl, scrapers
})

test('without fetch metadata, only a referrer from this site counts', () => {
  assert.equal(allowed({ referer: 'https://www.hanselwei.dev/bio' }), true)
  for (const referer of ['https://evil.example/bio', 'https://www.hanselwei.dev.evil.example/', 'http://www.hanselwei.dev/bio', '', ...UNSAFE_URLS, ...XSS_HTML, ...JS_BREAKOUTS]) {
    assert.equal(allowed({ referer }), false, referer)
  }
})

test('the repo copy is ciphertext only, and needs the right key', () => {
  assert.notEqual(Buffer.from(sealed.data, 'base64').subarray(0, 2).toString('hex'), 'ffd8') // not a JPEG
  for (const key of [undefined, '', 'short', randomBytes(32).toString('base64'), randomBytes(16).toString('base64'), ...JS_BREAKOUTS]) {
    assert.equal(decryptPhoto(sealed, key), null)
  }
})

test('encryption round-trips, and tampering is detected', () => {
  const key = randomBytes(32).toString('base64')
  const bytes = Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9])
  const box = encryptPhoto(bytes, key)
  assert.deepEqual(decryptPhoto(box, key), bytes)
  const flipped = Buffer.from(box.data, 'base64')
  flipped[0] ^= 1
  assert.equal(decryptPhoto({ ...box, data: flipped.toString('base64') }, key), null)
  assert.equal(decryptPhoto({ ...box, tag: Buffer.alloc(16).toString('base64') }, key), null)
  assert.throws(() => encryptPhoto(bytes, 'short'))
})

test('the function refuses outsiders, and never lets the photo be cached or used for AI', async () => {
  const saved = process.env.BIO_PHOTO_KEY
  process.env.BIO_PHOTO_KEY = randomBytes(32).toString('base64') // not the real key
  try {
    const direct = await handler(new Request(URL_, { headers: { 'sec-fetch-site': 'none', 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' } }))
    assert.equal(direct.status, 403)
    const post = await handler(new Request(URL_, { method: 'POST', headers: fetchFromPage }))
    assert.equal(post.status, 405)
    const wrongKey = await handler(new Request(URL_, { headers: fetchFromPage }))
    assert.equal(wrongKey.status, 404)
    for (const response of [direct, post, wrongKey]) {
      for (const [name, value] of Object.entries(PHOTO_HEADERS)) assert.equal(response.headers.get(name), value)
    }
    assert.match(PHOTO_HEADERS['x-robots-tag'], /noai/)
    assert.match(PHOTO_HEADERS['x-robots-tag'], /noimageai/)
    assert.match(PHOTO_HEADERS['cache-control'], /no-store/)
  } finally {
    if (saved === undefined) delete process.env.BIO_PHOTO_KEY
    else process.env.BIO_PHOTO_KEY = saved
  }
})
