// Facts from a study link to the study (components/AboutCard.vue shows "Read the study ↗"):
// every study fact has a source, and every source is a safe https link
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hobbyFacts } from '../../data/hobbyFacts.mjs'
import { safeUrl } from '../../utils/safeUrl.js'

test('every fact that cites a study links to it', () => {
  const studies = hobbyFacts.filter(f => f.type === 'fact' && /(?<!-)\bstudy\b|\batlas\b/i.test(f.text))
  assert.ok(studies.length >= 3)
  for (const f of studies) assert.ok(f.source, `${f.id} names a study but has no source`)
})

test('every source is an https link that passes safeUrl', () => {
  for (const f of hobbyFacts.filter(f => 'source' in f)) {
    assert.equal(safeUrl(f.source), f.source, f.id)
    assert.equal(new URL(f.source).protocol, 'https:', f.id)
  }
})

test('facts without a study carry no source key', () => {
  for (const f of hobbyFacts.filter(f => f.type === 'quote')) assert.equal('source' in f, false, f.id)
})
