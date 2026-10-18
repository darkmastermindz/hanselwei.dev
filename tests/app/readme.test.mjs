// The GitHub profile README is synced at build time. It is checked before the Bio page uses it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_README_CHARS, parseReadme } from '../../utils/readme.mjs'

test('README text is kept, including markdown and line breaks', () => {
  const readme = '# Hi 👋\r\n\r\n- I <3 emerging tech\n'
  assert.equal(parseReadme(readme), readme)
})

test('an empty README is kept as empty, so the Bio page hides the section', () => {
  assert.equal(parseReadme(''), '')
})

test('a README that is not text, or is too long, is refused', () => {
  assert.equal(parseReadme(null), null)
  assert.equal(parseReadme({ text: 'x' }), null)
  assert.equal(parseReadme('x'.repeat(MAX_README_CHARS + 1)), null)
  assert.equal(parseReadme('x'.repeat(MAX_README_CHARS)).length, MAX_README_CHARS)
})

test('control characters are removed, tabs and line breaks are kept', () => {
  assert.equal(parseReadme('a\u0000b\u001bc\td\ne'), 'abc\td\ne')
})
