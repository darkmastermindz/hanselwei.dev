// A post without a description gets one from its body: plain text, keeping hyphens and
// parentheses, with markdown links reduced to their text.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { excerptOf, toPost } from '../../server/utils/blog.js'
import { REDOS } from '../security/payloads.mjs'

test('hyphens and parentheses survive, link syntax and markdown marks do not', () => {
  assert.equal(
    excerptOf('This is my newsletter-style feed. One-off write-ups are under [Posts](/blog) (see **below**).'),
    'This is my newsletter-style feed. One-off write-ups are under Posts (see below).'
  )
  assert.equal(excerptOf('# Title\n\n> quote with `code` and _emphasis_\n\n![a photo](/x.png)'), 'Title quote with code and emphasis a photo')
})

test('it is capped at 160 characters on one line', () => {
  const excerpt = excerptOf(`${'word '.repeat(100)}\n\nmore`)
  assert.ok(excerpt.length <= 160)
  assert.doesNotMatch(excerpt, /\n/)
})

test('only used when the post has no description of its own', () => {
  assert.equal(toPost('x.md', '---\ndescription: "Mine"\n---\n\nBody text').description, 'Mine')
  assert.equal(toPost('x.md', '---\ntitle: "x"\n---\n\nA one-off [link](/a).').description, 'A one-off link.')
})

test('long hostile input stays fast', () => {
  const started = performance.now()
  excerptOf(`[${REDOS}`)
  excerptOf(`[a](${REDOS}`)
  assert.ok(performance.now() - started < 500)
})

test('every post gets glossary terms, like the bio, unless it opts out', () => {
  assert.equal(toPost('x.md', '---\ntitle: "x"\n---\n\nBody').glossary, true)
  assert.equal(toPost('devto:x.md', 'No front matter at all').glossary, true)
  assert.equal(toPost('x.md', '---\nglossary: true\n---\n\nBody').glossary, true)
  assert.equal(toPost('x.md', '---\nglossary: false\n---\n\nBody').glossary, false)
})
