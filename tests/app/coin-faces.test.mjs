import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COIN_FACES, nextFace } from '../../utils/coinFaces.mjs'
import { safeUrl } from '../../utils/safeUrl.js'

test('the coin photos are https images on GitHub and Gravatar', () => {
  assert.deepEqual(COIN_FACES.map(face => face.id), ['github', 'gravatar'])
  for (const face of COIN_FACES) {
    assert.equal(safeUrl(face.src), face.src)
    assert.ok(face.src.startsWith('https://'))
  }
  assert.equal(new URL(COIN_FACES[0].src).hostname, 'avatars.githubusercontent.com')
  assert.equal(new URL(COIN_FACES[1].src).hostname, '1.gravatar.com')
})

test('from the Bitmoji, heads landings alternate GitHub and Gravatar', () => {
  const seen = []
  let face = -1
  for (let i = 0; i < 5; i++) seen.push((face = nextFace(face, 2)))
  assert.deepEqual(seen, [0, 1, 0, 1, 0])
})

test('a photo that failed to load is skipped, and with none left the Bitmoji stays', () => {
  assert.equal(nextFace(-1, 2, [0]), 1)
  assert.equal(nextFace(1, 2, [0]), 1)
  assert.equal(nextFace(-1, 2, [0, 1]), -1)
})
