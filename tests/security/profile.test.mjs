// The GitHub bio is outside input shown on the home page. It must stay plain text: markup
// is shown as text, control characters are dropped, and the About card never uses v-html.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MAX_BIO_CHARS, parseProfile } from '../../utils/profile.mjs'
import { HOSTILE_BIOS } from './payloads.mjs'

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

test('hostile bios never throw and never leave control characters or empty lines', () => {
  for (const bio of HOSTILE_BIOS) {
    const parsed = parseProfile({ bio })
    if (bio.length > MAX_BIO_CHARS) {
      assert.equal(parsed, null, 'oversize bio is refused')
      continue
    }
    assert.ok(Array.isArray(parsed.lines), bio)
    for (const line of parsed.lines) {
      assert.equal(typeof line, 'string')
      assert.doesNotMatch(line, CONTROL, JSON.stringify(bio))
      assert.notEqual(line, '')
    }
  }
})

test('markup in a bio stays as text, so the JSON view still round-trips', () => {
  for (const bio of HOSTILE_BIOS) {
    if (bio.length > MAX_BIO_CHARS) continue
    const { lines } = parseProfile({ bio })
    assert.deepEqual(JSON.parse(JSON.stringify(lines)), lines)
  }
})

test('the About card shows the bio as text, never with v-html', () => {
  const card = readFileSync(fileURLToPath(new URL('../../components/AboutCard.vue', import.meta.url)), 'utf8')
  assert.doesNotMatch(card, /v-html/)
})
