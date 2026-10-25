// Sharing a post (utils/share.js, components/ShareButton.vue): the share sheet where there is
// one, else the link is copied
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shareLink } from '../../utils/share.js'

const link = { title: 'Hello World!', url: 'https://www.hanselwei.dev/blog/hello-world' }
const clipboard = () => {
  const copied = []
  return { copied, writeText: async text => void copied.push(text) }
}

test('the share sheet gets the title and link when the device has one', async () => {
  const shared = []
  const cb = clipboard()
  assert.equal(await shareLink(link, { share: async data => void shared.push(data), clipboard: cb }), 'shared')
  assert.deepEqual(shared, [link])
  assert.deepEqual(cb.copied, [])
})

test('closing the share sheet is not an error, and copies nothing', async () => {
  const cb = clipboard()
  const abort = Object.assign(new Error('closed'), { name: 'AbortError' })
  assert.equal(await shareLink(link, { share: async () => { throw abort }, clipboard: cb }), 'cancelled')
  assert.deepEqual(cb.copied, [])
})

test('without a share sheet, or when it refuses, the link is copied', async () => {
  const cb = clipboard()
  assert.equal(await shareLink(link, { clipboard: cb }), 'copied')
  const refused = Object.assign(new Error('no'), { name: 'NotAllowedError' })
  assert.equal(await shareLink(link, { share: async () => { throw refused }, clipboard: cb }), 'copied')
  assert.deepEqual(cb.copied, [link.url, link.url])
})

test('when nothing works it says so instead of throwing', async () => {
  assert.equal(await shareLink(link, {}), 'failed')
  assert.equal(await shareLink(link, undefined), 'failed')
  assert.equal(await shareLink(link, { clipboard: { writeText: async () => { throw new Error('denied') } } }), 'failed')
})
