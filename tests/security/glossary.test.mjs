// Glossary terms in rendered markdown (server/utils/glossaryHtml.js) run after the sanitizer, so
// they must not let anything through it: they only wrap text, and add only their own <abbr> and
// hidden <span>. Their links pass safeUrl, and ids from markup only match real entries.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { glossary, glossaryEntry } from '../../data/glossary.js'
import { glossaryHtml } from '../../server/utils/glossaryHtml.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

const tags = html => [...html.matchAll(/<([a-z][a-z0-9]*)\b/gi)].map(m => m[1].toLowerCase())

test('every glossary link is safe to use as an href', () => {
  for (const [id, entry] of Object.entries(glossary)) assert.equal(safeUrl(entry.href), entry.href, id)
})

test('ids from markup only match real entries', () => {
  for (const key of PROTOTYPE_KEYS) assert.equal(glossaryEntry(key), null, key)
  assert.equal(glossaryEntry(undefined), null)
})

test('marking terms adds only an abbr and a hidden span, and keeps the rest byte for byte', () => {
  const html = '<p>I won at an MLH event &amp; worked at <strong>TIAA</strong>.</p><p>More MLH.</p>'
  const out = glossaryHtml(html, { idPrefix: 'x' })
  assert.equal(
    out,
    '<p>I won at an <abbr class="term" data-term="mlh" tabindex="0" aria-describedby="x-mlh-1">MLH</abbr><span id="x-mlh-1" hidden>' +
      glossary.mlh.short +
      '</span> event &amp; worked at <strong><abbr class="term" data-term="tiaa" tabindex="0" aria-describedby="x-tiaa-2">TIAA</abbr><span id="x-tiaa-2" hidden>' +
      glossary.tiaa.short +
      '</span></strong>.</p><p>More MLH.</p>'
  )
})

test('links, code and headings are left alone', () => {
  const html = '<h2>MLH</h2><p><a href="https://mlh.io">MLH</a> <code>AWS</code></p><pre>SUP</pre>'
  assert.equal(glossaryHtml(html), html)
})

test('escaped markup in the text stays escaped, and nothing new can sneak in', () => {
  for (const payload of XSS_HTML) {
    const escaped = payload.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<p>MLH ${escaped} AWS</p>`
    const out = glossaryHtml(html)
    assert.deepEqual([...new Set(tags(out))].sort(), ['abbr', 'p', 'span'], payload)
    assert.ok(out.includes(escaped), payload)
  }
})

test('nothing in, nothing out', () => {
  assert.equal(glossaryHtml(''), '')
  assert.equal(glossaryHtml(null), '')
})
