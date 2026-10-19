// In plain-English mode the About card offers a Google Translate link in the visitor's own
// language, detected from the browser. English readers don't get one.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { languageName, translateTarget, translateUrl } from '../../utils/translate.js'

test('uses the browser\'s preferred language', () => {
  assert.equal(translateTarget(['es-MX', 'en-US']), 'es')
  assert.equal(translateTarget(['fr']), 'fr')
  assert.equal(translateTarget(['ja-JP']), 'ja')
  assert.equal(translateTarget('de-DE'), 'de') // navigator.language, when that's all there is
  assert.equal(translateTarget(['fil-PH']), 'fil')
})

test('English readers get no link, even with other languages listed after', () => {
  for (const tag of ['en', 'en-US', 'en-GB', 'EN-au']) assert.equal(translateTarget([tag, 'es']), null)
  assert.equal(translateTarget([]), null)
  assert.equal(translateTarget(undefined), null)
})

test('Chinese goes to Simplified or Traditional by region or script', () => {
  assert.equal(translateTarget(['zh-CN']), 'zh-CN')
  assert.equal(translateTarget(['zh']), 'zh-CN')
  assert.equal(translateTarget(['zh-Hans-SG']), 'zh-CN')
  assert.equal(translateTarget(['zh-TW']), 'zh-TW')
  assert.equal(translateTarget(['zh-HK']), 'zh-TW')
  assert.equal(translateTarget(['zh-Hant']), 'zh-TW')
})

test('the language is named in its own language', () => {
  assert.equal(languageName('es'), 'español')
  assert.equal(languageName('fr'), 'français')
  assert.equal(languageName('ja'), '日本語')
  assert.ok(languageName('zh-TW').length > 0)
})

test('the link carries the card text, tidied, from English into that language', () => {
  const url = new URL(translateUrl('  I am a\n  Senior   Developer ', 'es'))
  assert.equal(url.searchParams.get('text'), 'I am a Senior Developer')
  assert.equal(url.searchParams.get('sl'), 'en')
  assert.equal(url.searchParams.get('tl'), 'es')
  assert.equal(new URL(translateUrl('', 'es')).searchParams.has('text'), false)
})
