# tailwind-ios-glass

Apple's glass as Tailwind CSS classes: **Liquid Glass** for navigation and controls, and the
**standard materials** (frosted glass) for content. It follows Apple's
[Materials guidelines](https://developer.apple.com/design/human-interface-guidelines/materials)
and SwiftUI's [`Material`](https://developer.apple.com/documentation/swiftui/material) and
[`glassEffect(_:in:)`](https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)).
No dependencies; Tailwind CSS 3 as a peer.

## Install

```js
// tailwind.config.js
module.exports = {
  plugins: [require('tailwind-ios-glass')()]
}
```

Optional refraction (Chromium browsers), once in the browser:

```js
import { installRefraction } from 'tailwind-ios-glass/refraction'
installRefraction()
```

## Classes

| Class | SwiftUI | Use it for |
| --- | --- | --- |
| `liquid-glass` | `.glassEffect(.regular)` | Headers, tab bars, toolbars: anything floating above content, above all with text |
| `liquid-glass-clear` | `.glassEffect(.clear)` | Controls floating over photos and video |
| `liquid-glass-dim` | — | Add to `liquid-glass-clear` over bright content: Apple's 35% dimming layer |
| `liquid-glass-scroll-edge` | scroll edge effect | Under a top bar: content fades and blurs as it slides under, instead of a hard line |
| `liquid-glass-prominent` | `.buttonStyle(.glassProminent)` | Add to `liquid-glass` on a primary button: the glass takes the accent colour (`--glass-accent`) |
| `liquid-glass-interactive` | `.glassEffect(.regular.interactive())` | Add to a `liquid-glass` control: it swells a little and lights up while pressed |
| `liquid-glass-edge` | — | A glass bezel: a ring of glass around the element's edge, over its own content (a photo, an avatar, a coin) |
| `material-ultra-thin` | `.ultraThinMaterial` | Content-layer surfaces where the background should stay visible |
| `material-thin` | `.thinMaterial` | |
| `material` | `.regularMaterial` | The default for content: cards, sheets |
| `material-thick` | `.thickMaterial` | Content surfaces with a lot of small text |

Apple's rules of thumb: keep Liquid Glass to the navigation layer, use it sparingly, and don't stack
glass on glass. Thicker materials are more opaque, which helps text.

```html
<nav class="liquid-glass liquid-glass-scroll-edge sticky top-0">…</nav>
<section class="material rounded-2xl p-4">…</section>
<a class="liquid-glass liquid-glass-prominent liquid-glass-interactive rounded-full px-5 py-2">Add contact</a>
<!-- The image runs under the ring; padding keeps anything else inside it -->
<div class="liquid-glass-edge rounded-full overflow-hidden [--glass-edge-width:8px]"><img src="avatar.jpg" alt=""></div>
```

`liquid-glass-interactive` springs on `--glass-press-easing` over `--glass-press-duration` (a
springy `cubic-bezier` over 0.25s by default); point them at your own springs if you have them. With
reduced motion it only lights up.

The bezel's width, tint and opacity are `--glass-edge-width`, `--glass-edge-tint` (RGB channels) and
`--glass-edge-alpha`. Set them on the element. Like tinted or stained glass, its colour deepens
towards the outer edge, where light passes through more glass (`--glass-edge-depth`, 0 to 1, default
0.45), and the very edge glows in the glass's own colour. Reflections off the surface stay white. For
something that turns (a spinning coin), `--glass-edge-light-angle` (default `150deg`, light from the
top left) and `--glass-edge-shine` (default `1`, how strongly the light glints) let the glint follow it.

## How it works

The surface classes draw the glass on a `::before` layer behind the element's content: a tint plus
`backdrop-filter: blur() saturate()`. Liquid Glass also gets a lit rim. The element gets
`position: relative` and `isolation: isolate`; give it `sticky` or `fixed` and that wins. A
`backdrop-filter` on the element itself would turn it into the containing block for its own
`position: fixed` children, which is why the glass is a layer instead. `liquid-glass-edge` draws its
ring on `::after`, above the content, cut out with a mask.

With `installRefraction()`, the edge of `liquid-glass` and `liquid-glass-clear` bends what's behind it
like the rim of a lens, and the middle stays clear. Each element gets its own SVG filter, a
`feDisplacementMap` whose map is drawn at the element's size and corner radius and redrawn when it
resizes. Elements added later are picked up, and removed ones let go. Each pixel in the bezel samples
from further out along the edge's normal, so content just beyond the edge bends into the rim. The
bend is strongest at the very edge and fades out across the bezel.

| Variable (on the element) | Default | |
| --- | --- | --- |
| `--glass-lens-width` | `16px` | How far in from the edge the glass bends |
| `--glass-lens-strength` | `18px` | How far the very edge reaches out |

Only Chromium browsers draw SVG filters in `backdrop-filter`; Safari and Firefox would drop the whole
blur, so they keep the frosted blur. `navigator.userAgentData`, which the check reads, only exists on
secure pages (HTTPS or localhost). It marks `<html data-glass-refract>`, and sets each element's
`--glass-lens` to its filter.

## Accessibility

Like Apple's materials, every surface turns opaque with **Reduce Transparency**
(`prefers-reduced-transparency`) or **Increase Contrast** (`prefers-contrast: more`), and in
browsers without `backdrop-filter`.

## Tuning

Options set the tints, as space-separated RGB channels (the defaults suit a dark page):

```js
require('tailwind-ios-glass')({ materialTint: '28 28 30', glassTint: '42 50 60', accent: '0 122 255' })
```

Everything else is a CSS variable on `:root`: `--material-filter`, `--material-alpha`,
`--material-thin-filter`, `--glass-filter`, `--glass-alpha`, `--glass-specular`, and so on.

Apple doesn't publish the blur radii or tints. These are matched by eye. The 180% saturation is what
UIKit's blur is commonly reported to use.

## Tests

`npm test` (Node's built-in test runner; needs `tailwindcss` and `postcss` installed).
