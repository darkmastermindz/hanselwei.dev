// The GitHub profile README is outside input shown on the Bio page. It is rendered with
// renderMarkdown like a blog post, so markup and script URLs must come out neutralised.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../../server/utils/blog.js'
import { parseReadme } from '../../utils/readme.mjs'
import { HOSTILE_README } from './payloads.mjs'
import { assertSafeHtml } from './safe-html.mjs'

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

test('hostile READMEs never throw, and what is kept is free of control characters', () => {
  for (const payload of HOSTILE_README) {
    const readme = parseReadme(payload)
    if (readme === null) continue
    assert.doesNotMatch(readme, CONTROL, JSON.stringify(payload))
  }
})

test('hostile READMEs render to safe HTML on the Bio page', () => {
  for (const payload of HOSTILE_README) {
    const readme = parseReadme(payload)
    if (readme === null) continue
    assertSafeHtml(renderMarkdown(readme), payload)
  }
})
