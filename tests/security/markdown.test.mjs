// Blog posts (repo markdown + dev.to posts mirrored at build time) are rendered to HTML
// and injected with v-html, so the renderer must never let executable markup through.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../../server/utils/blog.js'
import { XSS_HTML, XSS_MARKDOWN, REDOS } from './payloads.mjs'
import { assertSafeHtml } from './safe-html.mjs'

test('raw HTML injection in markdown is neutralised', () => {
  for (const payload of XSS_HTML) {
    assertSafeHtml(renderMarkdown(payload), payload)
    assertSafeHtml(renderMarkdown(`Intro paragraph\n\n${payload}\n\nOutro`), payload)
  }
})

test('markdown links and images cannot carry script URLs or attributes', () => {
  for (const payload of XSS_MARKDOWN) assertSafeHtml(renderMarkdown(payload), payload)
})

test('ordinary markdown still renders', () => {
  const html = renderMarkdown('# Title\n\nSome **bold** text, a [link](https://dev.to/hansel) and ![pic](https://example.com/a.png)\n\n```js\nconst a = 1 < 2\n```')
  assert.match(html, /<h1[^>]*>Title<\/h1>/)
  assert.match(html, /<strong>bold<\/strong>/)
  assert.match(html, /<a href="https:\/\/dev\.to\/hansel"[^>]*target="_blank"[^>]*rel="noopener[^"]*"/)
  assert.match(html, /<img src="https:\/\/example\.com\/a\.png"/)
  assert.match(html, /const a = 1 &lt; 2/)
})

test('rendering a huge input finishes quickly', () => {
  const started = performance.now()
  renderMarkdown(REDOS)
  assert.ok(performance.now() - started < 2000, 'markdown rendering took too long')
})
