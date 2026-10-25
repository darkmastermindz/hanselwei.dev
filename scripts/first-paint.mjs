// Runs after `nuxt generate`, before scripts/build-csp.mjs: each page paints from its own HTML,
// and everything else starts loading once it has.
//
// - The part of the site-wide stylesheet (tachyons, Tailwind and daisyUI: about 145KB, mostly
//   unused on any one page) that the page's HTML uses goes into the page (Beasties). The whole
//   sheet still loads, for what only shows after a tap.
// - The stylesheets (that whole sheet, and the fonts), the app's JavaScript and Nuxt's prefetches
//   move into a <template>. A small script puts them back in the page the moment after its first
//   paint, so on a slow phone none of them hold the page up or take the bandwidth the page's own
//   image needs (the home page's Bitmoji, preloaded by components/Bitmoji.vue). The page reads
//   as usual meanwhile; the app takes over a frame later than it otherwise would.
// - Without JavaScript the stylesheets load from a <noscript> instead.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Beasties from 'beasties'
import render from 'dom-serializer'
import { cloneNode, Element, Text } from 'domhandler'
import { appendChild, findAll, findOne, prepend, removeElement } from 'domutils'
import { parseDocument } from 'htmlparser2'

const OUT = new URL('../.output/public/', import.meta.url)

const beasties = new Beasties({
  path: fileURLToPath(OUT),
  publicPath: '/',
  // The <link> stays as it is; afterPaint() moves it
  preload: false,
  // Other pages use the rest of the sheet, and it's what loads once the page is up
  pruneSource: false,
  // Nuxt already puts each page's component styles in the page; leave those and their order alone
  reduceInlineStyles: false,
  mergeStylesheets: false,
  fonts: false,
  logLevel: 'warn'
})

const TEMPLATE_ID = 'after-paint'
// requestAnimationFrame runs just before the first paint, and the timeout just after it. A tab
// opened in the background gets no frames, so the second timeout loads it all anyway. The tags go
// in before the first <style>, where the stylesheets were, so the cascade is the same.
export const LOADER = `(function(){var t=document.getElementById('${TEMPLATE_ID}'),d;function go(){if(d)return;d=1;var h=document.head;h.insertBefore(document.importNode(t.content,!0),h.querySelector('style'))}requestAnimationFrame(function(){setTimeout(go)});setTimeout(go,1e3)})()`

// Moves the head's stylesheets, module script, module preloads and prefetches into a template the
// LOADER brings back. <noscript> blocks are left as they are. Works on the parsed page (htmlparser2),
// written back out exactly as parsed apart from the moves.
const ROUND_TRIP = { decodeEntities: false }
const ORDER = ['stylesheet', 'modulepreload', 'module', 'prefetch']
const kind = el => {
  if (el.name === 'script') return el.attribs.type === 'module' && 'src' in el.attribs ? 'module' : null
  const rel = el.name === 'link' && (el.attribs.rel ?? '').toLowerCase()
  return ORDER.includes(rel) ? rel : null
}
const inNoscript = el => {
  for (let up = el.parent; up; up = up.parent) if (up.name === 'noscript') return true
  return false
}

export const afterPaint = html => {
  const doc = parseDocument(html, ROUND_TRIP)
  const head = findOne(el => el.name === 'head', doc.children)
  const body = findOne(el => el.name === 'body', doc.children)
  if (!head || !body) return html
  const tags = findAll(el => kind(el) && !inNoscript(el), head.children).sort(
    (a, b) => ORDER.indexOf(kind(a)) - ORDER.indexOf(kind(b))
  )
  if (!tags.length) return html
  const sheets = tags.filter(el => kind(el) === 'stylesheet')
  // Beasties puts a sheet's first-paint part in a <style> just before its <link>
  const critical = sheets.map(el => el.prev).filter((prev, i) => prev?.name === 'style' && sheets[i].attribs.href?.startsWith('/_nuxt/'))
  tags.forEach(removeElement)
  critical.forEach(removeElement)
  // The site-wide sheet comes before the components' own styles, as it did as a <link> (they
  // override it); the loader puts the full sheets back in the same place
  const firstStyle = findOne(el => el.name === 'style', head.children)
  critical.forEach(style => (firstStyle ? prepend(firstStyle, style) : appendChild(head, style)))
  if (sheets.length) appendChild(head, new Element('noscript', {}, sheets.map(el => cloneNode(el))))
  appendChild(body, new Element('template', { id: TEMPLATE_ID }, tags))
  appendChild(body, new Element('script', {}, [new Text(LOADER)]))
  return render(doc, ROUND_TRIP)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = (await readdir(OUT, { recursive: true })).filter(name => name.endsWith('.html'))
  for (const name of pages) {
    const file = new URL(name, OUT)
    const html = (await beasties.process(await readFile(file, 'utf8'))).replace(' data-beasties-container', '')
    await writeFile(file, afterPaint(html))
  }
  console.log(`[first-paint] ${pages.length} page(s) paint from their own HTML and CSS first`)
}
