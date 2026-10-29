// I'm Feeling Lucky (utils/lucky.mjs): blog slugs (some mirrored from dev.to) become a path to go
// to, and config.toml [lucky] search_engine_id goes into a script URL. Neither may lead off the
// site or load anything else; facts and definitions stay plain text for Vue to escape.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { luckyConfig, luckyPool, googleSearchUrl } from '../../utils/lucky.mjs'
import { buildCsp } from '../../scripts/lib/csp.mjs'
import { BAD_SEARCH_ENGINE_IDS, LUCKY_SLUGS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

test('hostile slugs never become a path', () => {
  const pool = luckyPool({ posts: LUCKY_SLUGS.map(slug => ({ slug, title: 'x' })) })
  assert.deepEqual(pool.post, [])
})

test('every path is a post on this site', () => {
  const pool = luckyPool({ posts: [{ slug: 'hello-world', title: 'Hi' }, { slug: 'my_post2', title: 'x' }] })
  for (const { path } of pool.post) assert.match(path, /^\/blog\/[a-z0-9_-]+$/i)
})

test('markup in a title, fact or definition is kept as text, not dropped into HTML', () => {
  for (const payload of XSS_HTML) {
    const pool = luckyPool({ posts: [{ slug: 'ok', title: payload }], facts: [{ text: payload }], glossary: { x: { term: payload, short: payload } } })
    // Plain strings for {{ }} interpolation; the pool builds no HTML of its own
    for (const item of [...pool.post, ...pool.fact, ...pool.term]) for (const value of Object.values(item)) assert.equal(typeof value, 'string')
  }
})

test('prototype keys in the glossary or facts do nothing', () => {
  for (const key of PROTOTYPE_KEYS) {
    const pool = luckyPool({ glossary: JSON.parse(`{"${key}": {"term": "T", "short": "S"}}`), facts: [JSON.parse(`{"${key}": 1, "text": "A fact."}`)] })
    assert.equal({}.polluted, undefined)
    assert.equal(pool.fact.length, 1)
  }
})

test('the search link always goes to Google with the query encoded', () => {
  for (const payload of [...XSS_HTML, '&btnI=1', '#x', 'a b']) {
    const url = new URL(googleSearchUrl(payload))
    assert.equal(url.origin, 'https://www.google.com')
    assert.equal(url.searchParams.get('q'), payload)
    assert.deepEqual([...url.searchParams.keys()], ['q'])
  }
})

test('a hostile search engine ID fails the build and is never used', () => {
  for (const id of BAD_SEARCH_ENGINE_IDS) {
    const { config, problems } = luckyConfig({ lucky: { search_engine_id: id } })
    assert.equal(problems.length, 1, String(id))
    assert.equal(config.searchEngineId, '')
  }
  assert.deepEqual(luckyConfig({ lucky: { search_engine_id: 'a1b2c3d4e5f6g7h8i' } }), { config: { searchEngineId: 'a1b2c3d4e5f6g7h8i' }, problems: [] })
  assert.deepEqual(luckyConfig({ lucky: { search_engine_id: '012345678901234567890:abcdefghijk' } }).problems, [])
  assert.deepEqual(luckyConfig({}), { config: { searchEngineId: '' }, problems: [] })
})

test("Google's search is only allowed by the CSP when a search engine is set", () => {
  const off = buildCsp()
  assert.ok(!off.includes('google.com'))
  assert.match(off, /frame-src 'none'/)
  const on = buildCsp({ googleSearch: true })
  assert.match(on, /script-src 'self' https:\/\/scripts\.simpleanalyticscdn\.com https:\/\/cse\.google\.com https:\/\/www\.google\.com/)
  assert.match(on, /frame-src https:\/\/cse\.google\.com https:\/\/www\.google\.com https:\/\/syndicatedsearch\.goog/)
  assert.match(on, /frame-ancestors 'none'/, 'still never framed itself')
  assert.ok(!/unsafe-eval/.test(on))
})
