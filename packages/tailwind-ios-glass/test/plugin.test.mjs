import { test } from 'node:test'
import assert from 'node:assert/strict'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import iosGlass from '../index.js'

const build = async (html, options) => {
  const config = { content: [{ raw: html }], corePlugins: { preflight: false }, plugins: [iosGlass(options)] }
  const { css } = await postcss([tailwindcss(config)]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined })
  return css
}

test('each class draws its glass on a layer behind the content', async () => {
  const css = await build('<div class="liquid-glass material-thin"></div>')
  assert.match(css, /\.liquid-glass::before[^{]*\{[^}]*backdrop-filter: var\(--glass-layer-filter\)/)
  assert.match(css, /\.liquid-glass \{[^}]*--glass-layer-filter: var\(--glass-filter\)/)
  assert.match(css, /\.material-thin \{[^}]*--glass-layer-bg: rgb\(var\(--material-tint\) \/ var\(--material-thin-alpha\)\)/)
  assert.match(css, /z-index: -1/)
})

test('only the classes a page uses are emitted', async () => {
  const css = await build('<div class="material"></div>')
  assert.doesNotMatch(css, /\.material-thick|\.liquid-glass\b/)
  assert.doesNotMatch(css, /\.liquid-glass-scroll-edge/)
})

test('tints come from the options', async () => {
  const css = await build('<div class="liquid-glass"></div>', { materialTint: '35 38 42', glassTint: '1 2 3' })
  assert.match(css, /--material-tint: 35 38 42/)
  assert.match(css, /--glass-tint: 1 2 3/)
})

test('refraction is switched on by the html attribute, and accessibility settings make it opaque', async () => {
  const css = await build('<div class="liquid-glass"></div>')
  assert.match(css, /:root\[data-glass-refract\] \{[^}]*--glass-filter: url\(#liquid-glass\)/)
  assert.match(css, /prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)[\s\S]*--glass-filter: none/)
  assert.match(css, /@supports not \(\(backdrop-filter: blur\(1px\)\)/)
})

test('the dimming layer and scroll edge are utilities', async () => {
  const css = await build('<div class="liquid-glass-clear liquid-glass-dim liquid-glass-scroll-edge"></div>')
  assert.match(css, /\.liquid-glass-dim \{[^}]*rgb\(0 0 0 \/ 0\.35\)/)
  assert.match(css, /\.liquid-glass-scroll-edge::after \{[^}]*mask-image/)
})

test('the edge is a masked ring of glass over the content', async () => {
  const css = await build('<div class="liquid-glass-edge"></div>')
  assert.match(css, /\.liquid-glass-edge::after \{[^}]*padding: var\(--glass-edge-width\)[^}]*backdrop-filter: var\(--glass-edge-filter\)/)
  assert.match(css, /mask: linear-gradient\(#000 0 0\) content-box exclude/)
  // On the ring itself, so an element's own alpha can't undo it
  assert.match(css, /prefers-contrast: more\) \{\s*\.liquid-glass-edge::after \{[^}]*--glass-edge-alpha: 1/)
})

test('prominent glass takes the accent, and interactive glass responds to a press', async () => {
  const css = await build('<a class="liquid-glass liquid-glass-prominent liquid-glass-interactive"></a>', { accent: '0 180 137' })
  assert.match(css, /--glass-accent: 0 180 137/)
  assert.match(css, /\.liquid-glass-prominent \{[^}]*--glass-layer-bg: rgb\(var\(--glass-accent\)/)
  assert.match(css, /\.liquid-glass-interactive:active \{[^}]*transform: scale\(1\.04\)/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.liquid-glass-interactive:active \{[^}]*transform: none/)
})
