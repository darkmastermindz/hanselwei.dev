// scripts/first-paint.mjs: pages paint from their own HTML first, and the stylesheets and the
// app's JavaScript come back in once they have
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { afterPaint, LOADER } from '../../scripts/first-paint.mjs'

const page = `<!DOCTYPE html><html><head><title>t</title>
<link rel="stylesheet" href="https://fonts.example/a.css">
<style>.a{color:red}</style>
<style>.critical{color:blue}</style><link rel="stylesheet" href="/_nuxt/entry.css" crossorigin>
<link rel="preload" as="image" href="/_nuxt/b.svg" fetchpriority="high">
<link rel="modulepreload" as="script" crossorigin href="/_nuxt/e.js">
<script type="module" src="/_nuxt/e.js" crossorigin></script>
<link rel="prefetch" as="script" crossorigin href="/_nuxt/x.js">
<noscript><link rel="stylesheet" href="/kept.css"></noscript>
<link rel="icon" href="/favicon.ico">
</head><body><div id="__nuxt">hi</div><script>window.inline=1</script></body></html>`

const out = afterPaint(page)
const head = out.slice(0, out.indexOf('</head>'))
const template = out.slice(out.indexOf('<template'), out.indexOf('</template>'))

test('nothing in the head waits on a stylesheet or script download', () => {
  const live = head.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
  assert.doesNotMatch(live, /<link[^>]*rel="(stylesheet|modulepreload|prefetch)"/)
  assert.doesNotMatch(head, /<script[^>]*type="module"/)
})

test('the page keeps its inline styles, the image preload and its icons', () => {
  assert.match(head, /<style>\.a\{color:red\}<\/style>/)
  assert.match(head, /rel="preload" as="image"/)
  assert.match(head, /rel="icon"/)
})

test('everything moved comes back after the first paint, stylesheets first', () => {
  const order = ['fonts.example/a.css', '/_nuxt/entry.css', 'rel="modulepreload"', 'type="module"', 'rel="prefetch"'].map(s => template.indexOf(s))
  assert.ok(order.every(i => i >= 0), 'all moved')
  assert.deepEqual([...order].sort((a, b) => a - b), order)
  assert.ok(out.includes(`<script>${LOADER}</script></body>`))
})

test("the site-wide sheet's first-paint part keeps its place before the components' styles", () => {
  assert.ok(head.indexOf('.critical{color:blue}') >= 0)
  assert.ok(head.indexOf('.critical{color:blue}') < head.indexOf('.a{color:red}'))
  assert.match(LOADER, /insertBefore\(.*querySelector\('style'\)\)/)
})

test('without JavaScript the stylesheets still load, and existing <noscript> blocks stay', () => {
  assert.match(head, /<noscript><link rel="stylesheet" href="https:\/\/fonts\.example\/a\.css"><link rel="stylesheet" href="\/_nuxt\/entry\.css" crossorigin><\/noscript>/)
  assert.match(head, /<noscript><link rel="stylesheet" href="\/kept.css"><\/noscript>/)
})

test('a page with nothing to move is left alone', () => {
  const plain = '<html><head><title>t</title></head><body>x</body></html>'
  assert.equal(afterPaint(plain), plain)
})
