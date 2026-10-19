// The RSS feeds are XML built from post fields; nothing a post contains may break out of
// its element.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRss } from '../../server/utils/rss.js'
import { XML_INJECTION } from './payloads.mjs'

const post = overrides => ({ slug: 'ok', title: 'ok', description: 'ok', date: '2026-01-01T00:00:00Z', ...overrides })

test('post fields cannot inject XML into the feed', () => {
  for (const payload of XML_INJECTION) {
    for (const field of ['slug', 'title', 'description']) {
      const xml = buildRss({ title: 't', description: 'd', path: '/blog', posts: [post({ [field]: payload })] })
      assert.doesNotMatch(xml, /<script|<evil|<!DOCTYPE|<!ENTITY|]]>/i, `${field} broke out:\n${xml}`)
      // Every opened item element is closed exactly once
      assert.equal((xml.match(/<item>/g) ?? []).length, 1)
      assert.equal((xml.match(/<\/item>/g) ?? []).length, 1)
    }
  }
})

test('channel fields are escaped too', () => {
  const xml = buildRss({ title: '</title><evil/>', description: ']]><evil/>', path: '/blog', posts: [] })
  assert.doesNotMatch(xml, /<evil/)
})

test('the channel link and self link are escaped like everything else', () => {
  for (const payload of XML_INJECTION) {
    const xml = buildRss({ title: 't', description: 'd', path: '/blog', home: `/blog/${payload}`, self: `/${payload}`, posts: [] })
    assert.doesNotMatch(xml, /<script|<evil|<!DOCTYPE|<!ENTITY|]]>/i, xml)
    assert.equal((xml.match(/<channel>/g) ?? []).length, 1)
    assert.equal((xml.match(/<\/channel>/g) ?? []).length, 1)
  }
})

test('each feed links to its home page and to itself', () => {
  const xml = buildRss({ title: 't', description: 'd', path: '/blog', home: '/blog/feed', self: '/feed.xml', posts: [] })
  assert.match(xml, /<link>https:\/\/www\.hanselwei\.dev\/blog\/feed<\/link>/)
  assert.match(xml, /<atom:link href="https:\/\/www\.hanselwei\.dev\/feed\.xml" rel="self" type="application\/rss\+xml" \/>/)
  assert.match(xml, /xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/)
})
