// The About me text comes from the GitHub profile bio at build time. The bio is checked
// before the page uses it: text only, line breaks kept, a size limit, and nothing broken.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_PROFILE, parseProfile } from '../../utils/profile.mjs'

test('a GitHub bio becomes its non-empty lines', () => {
  const bio = 'print(👋🗺)\r\n- I <3 emerging tech\r\n\r\n- @CCI_UNCC 🎓\'19 \r\n'
  assert.deepEqual(parseProfile({ bio }), { lines: ['print(👋🗺)', '- I <3 emerging tech', "- @CCI_UNCC 🎓'19"] })
})

test('no bio means no lines, so the About tab stays hidden', () => {
  assert.deepEqual(parseProfile({ bio: null }), EMPTY_PROFILE)
  assert.deepEqual(parseProfile({ bio: '' }), EMPTY_PROFILE)
  assert.deepEqual(parseProfile({}), EMPTY_PROFILE)
})

test('a bio that is not text, or not an object, is refused', () => {
  assert.equal(parseProfile(null), null)
  assert.equal(parseProfile('bio'), null)
  assert.equal(parseProfile({ bio: 42 }), null)
  assert.equal(parseProfile({ bio: ['a'] }), null)
})

test('a bio over the size limit is refused, and only ten lines are kept', () => {
  assert.equal(parseProfile({ bio: 'x'.repeat(1001) }), null)
  assert.equal(parseProfile({ bio: 'a\n'.repeat(50) }).lines.length, 10)
})
