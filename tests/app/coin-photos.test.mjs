// The coin's photos (utils/coinFaces.mjs): on Netlify they go through its Image CDN, resized to
// the coin and sent as WebP/AVIF; elsewhere they load straight from GitHub and Gravatar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COIN_FACES, COIN_SIZES, PHOTO_WIDTHS, cdnUrl, photoSources } from '../../utils/coinFaces.mjs'

test('without the CDN, a photo is just its source', () => {
  for (const face of COIN_FACES) assert.deepEqual(photoSources(face.src), { src: face.src })
})

test('through the CDN, a photo comes in each width, for the coin size', () => {
  const [github] = COIN_FACES
  const { src, srcset, sizes } = photoSources(github.src, true)
  assert.equal(src, `/.netlify/images?url=${encodeURIComponent(github.src)}&w=480`)
  assert.deepEqual(srcset.split(', '), PHOTO_WIDTHS.map(w => `${cdnUrl(github.src, w)} ${w}w`))
  assert.equal(sizes, COIN_SIZES)
  // The source URL is one query value: its own ? and & can't spill into the CDN's parameters
  const params = new URL(src, 'https://hanselwei.dev').searchParams
  assert.equal(params.get('url'), github.src)
  assert.deepEqual([...params.keys()], ['url', 'w'])
})

test('sources are big enough for the largest width', () => {
  for (const face of COIN_FACES) assert.match(face.src, /[?&](s|size)=720(&|$)/)
})
