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
| `material-ultra-thin` | `.ultraThinMaterial` | Content-layer surfaces where the background should stay visible |
| `material-thin` | `.thinMaterial` | |
| `material` | `.regularMaterial` | The default for content: cards, sheets |
| `material-thick` | `.thickMaterial` | Content surfaces with a lot of small text |

Apple's rules of thumb: keep Liquid Glass to the navigation layer, use it sparingly, and don't stack
glass on glass. Thicker materials are more opaque, which helps text.

```html
<nav class="liquid-glass liquid-glass-scroll-edge sticky top-0">…</nav>
<section class="material rounded-2xl p-4">…</section>
```

## How it works

Each class draws the glass on a `::before` layer behind the element's content: a tint plus
`backdrop-filter: blur() saturate()`. Liquid Glass also gets a lit rim. The element gets
`position: relative` and `isolation: isolate`; give it `sticky` or `fixed` and that wins. A
`backdrop-filter` on the element itself would turn it into the containing block for its own
`position: fixed` children, which is why the glass is a layer instead.

With `installRefraction()`, Chromium browsers also refract what's behind `liquid-glass` and `liquid-glass-clear`
through an SVG filter (`feTurbulence` + `feDisplacementMap` in `backdrop-filter: url(#liquid-glass)`).
Safari and Firefox don't draw SVG filters in `backdrop-filter` (they would drop the whole blur), so
they keep the frosted blur. It marks `<html data-glass-refract>`.

## Accessibility

Like Apple's materials, every surface turns opaque with **Reduce Transparency**
(`prefers-reduced-transparency`) or **Increase Contrast** (`prefers-contrast: more`), and in
browsers without `backdrop-filter`.

## Tuning

Options set the tints, as space-separated RGB channels (the defaults suit a dark page):

```js
require('tailwind-ios-glass')({ materialTint: '28 28 30', glassTint: '42 50 60' })
```

Everything else is a CSS variable on `:root`: `--material-filter`, `--material-alpha`,
`--material-thin-filter`, `--glass-filter`, `--glass-alpha`, `--glass-specular`, and so on.

Apple doesn't publish the blur radii or tints. These are matched by eye. The 180% saturation is what
UIKit's blur is commonly reported to use.

## Limits

The refraction is a noise texture. Real Liquid Glass bends light most at its edges (lensing), which
would need a displacement map sized to each element.

## Tests

`npm test` (Node's built-in test runner; needs `tailwindcss` and `postcss` installed).
