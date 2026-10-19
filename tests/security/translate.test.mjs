// The About card's translate link is built from the browser's language (navigator.languages)
// and the card's text. Only a well-formed language tag may get through, and the link always
// goes to translate.google.com with everything else safely encoded.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeUrl } from '../../utils/safeUrl.js'
import { MAX_TEXT, translateTarget, translateUrl } from '../../utils/translate.js'
import { HOSTILE_LANGUAGES, JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

test('malformed or hostile language tags get no link', () => {
  for (const tag of [...HOSTILE_LANGUAGES, ...XSS_HTML, ...JS_BREAKOUTS, ...PROTOTYPE_KEYS, '', null, undefined, 42, {}, []]) {
    assert.equal(translateTarget([tag]), null, JSON.stringify(tag))
    assert.equal(translateTarget(tag), null, JSON.stringify(tag))
  }
})

test('the link always goes to Google Translate, with the text encoded', () => {
  for (const text of [...XSS_HTML, ...JS_BREAKOUTS, 'a&tl=xx&u=https://evil.example', '#frag', 'x'.repeat(MAX_TEXT * 2)]) {
    const href = translateUrl(text, 'es')
    assert.equal(safeUrl(href), href)
    const url = new URL(href)
    assert.equal(url.origin, 'https://translate.google.com')
    assert.equal(url.searchParams.get('tl'), 'es')
    assert.equal(url.searchParams.get('sl'), 'en')
    assert.equal(url.searchParams.getAll('tl').length, 1)
    assert.equal(url.hash, '')
    assert.ok(url.searchParams.get('text').length <= MAX_TEXT)
  }
})
