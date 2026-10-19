import { test } from 'node:test'
import assert from 'node:assert/strict'
import { opensXp } from '../../utils/aboutCard.js'
import { renderMarkdown } from '../../server/utils/blog.js'

test('/#xp opens the About card on XP', () => {
  assert.equal(opensXp('#xp'), true)
  assert.equal(opensXp('#XP'), true)
})

test('other hashes keep the usual opening tab', () => {
  for (const hash of ['', '#', '#xpx', '#x', '#skills', '#hobbies', '#auth_error=denied', 'xp', ' #xp']) {
    assert.equal(opensXp(hash), false, hash)
  }
})

test('the Bio page link to XP stays a same-tab site link', () => {
  const html = renderMarkdown('Find it under [XP](/#xp).')
  assert.match(html, /<a href="\/#xp">XP<\/a>/)
  assert.doesNotMatch(html, /target=/)
})
