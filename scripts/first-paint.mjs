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
// LOADER brings back. <noscript> blocks are left as they are.
export const afterPaint = html => {
  const headEnd = html.indexOf('</head>')
  const bodyEnd = html.lastIndexOf('</body>')
  if (headEnd < 0 || bodyEnd < 0) return html
  const noscripts = []
  let head = html.slice(0, headEnd).replace(/<noscript>[\s\S]*?<\/noscript>/gi, block => `\0${noscripts.push(block) - 1}\0`)
  const moved = { stylesheet: [], modulepreload: [], script: [], prefetch: [] }
  // Beasties puts a sheet's first-paint part in a <style> just before its <link>
  const critical = []
  head = head.replace(
    /(<style\b[^>]*>(?:(?!<\/style>)[\s\S])*<\/style>)?(<link\b[^>]*\brel="(stylesheet|modulepreload|prefetch)"[^>]*>)/gi,
    (_, style = '', tag, rel) => {
      rel = rel.toLowerCase()
      moved[rel].push(tag)
      if (!style || rel !== 'stylesheet' || !tag.includes('href="/_nuxt/')) return style
      critical.push(style)
      return ''
    }
  )
  // The site-wide sheet comes before the components' own styles, as it did as a <link> (they
  // override it); the loader puts the full sheets back in the same place
  if (critical.length) {
    const at = head.search(/<style\b/i)
    head = at < 0 ? head + critical.join('') : head.slice(0, at) + critical.join('') + head.slice(at)
  }
  head = head.replace(/<script\b[^>]*\btype="module"[^>]*\bsrc="[^"]*"[^>]*><\/script>/gi, tag => {
    moved.script.push(tag)
    return ''
  })
  head = head.replace(/\0(\d+)\0/g, (_, i) => noscripts[i])
  const tags = [...moved.stylesheet, ...moved.modulepreload, ...moved.script, ...moved.prefetch]
  if (!tags.length) return html
  const noscript = moved.stylesheet.length ? `<noscript>${moved.stylesheet.join('')}</noscript>` : ''
  const body = html.slice(headEnd, bodyEnd)
  return `${head}${noscript}${body}<template id="${TEMPLATE_ID}">${tags.join('')}</template><script>${LOADER}</script>${html.slice(bodyEnd)}`
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
