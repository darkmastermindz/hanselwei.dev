// Apple's two kinds of material (Human Interface Guidelines, Materials) as Tailwind classes.
//
// - Liquid Glass (`liquid-glass`, `liquid-glass-clear`) is for controls and navigation that float above
//   content: headers, tab bars, toolbars. The regular variant blurs and darkens what's behind it so
//   text stays legible, and its edge catches the light. The clear variant is for floating over
//   photos and video; add `liquid-glass-dim` (35% black, as Apple suggests) over bright content.
//   With refraction installed (./refraction.mjs) its edge bends what's behind it like the rim of a
//   lens (--glass-lens), where the browser can.
//   For controls: `liquid-glass-prominent` tints the glass with an accent colour (SwiftUI's
//   `.glassProminent` button style) and `liquid-glass-interactive` responds to a press (`.interactive()`).
// - `liquid-glass-edge` is a glass bezel: a ring of glass around the element's own edge, over its
//   content (a photo, an avatar, a coin), which shows through frosted and catches the light. Like
//   tinted or stained glass, its colour deepens towards the outer edge, where the bevel makes the
//   glass thicker and light passes through more of it, and the very edge glows in the glass's own
//   colour (light caught inside the glass comes out there). Reflections off the surface stay white:
//   that light never goes through the glass.
// - Standard materials (`material-ultra-thin`, `material-thin`, `material`, `material-thick`) are
//   frosted glass for the content layer. Apple says not to use Liquid Glass there. Thicker is more
//   opaque: better for text.
//
// Apple doesn't publish the numbers: blur and tint are matched by eye, and the 180% saturation is
// what UIKit's blur is commonly reported to use. Every value is a CSS variable you can override.
//
// Reduce Transparency, Increase Contrast and browsers without backdrop-filter get opaque surfaces,
// as Apple's materials do.
//
// The glass is a ::before layer behind the element's content rather than a backdrop-filter on the
// element itself, which would pin the element's fixed-position children to it. The element gets
// `position: relative` and `isolation: isolate`; a position of its own (`sticky`, `fixed`) wins.

const DEFAULTS = {
  // Tints, as space-separated RGB channels. The defaults suit a dark page.
  materialTint: '28 28 30',
  glassTint: '42 50 60',
  // iOS's systemBlue, for `liquid-glass-prominent`; set --glass-accent on an element to change it
  accent: '0 122 255'
}

const opaque = {
  '--material-ultra-thin-alpha': '1',
  '--material-thin-alpha': '1',
  '--material-alpha': '1',
  '--material-thick-alpha': '1',
  '--glass-alpha': '1',
  '--glass-clear-alpha': '1',
  '--glass-prominent-alpha': '1',
  '--glass-edge-alpha': '1'
}

const REDUCED = '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)'
const NO_BACKDROP = '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))'

const surface = (filter, background, rim = 'none') => ({
  '--glass-layer-filter': filter,
  '--glass-layer-bg': background,
  '--glass-layer-rim': rim,
  position: 'relative',
  isolation: 'isolate',
  '&::before': {
    content: "''",
    position: 'absolute',
    inset: '0',
    zIndex: '-1',
    borderRadius: 'inherit',
    background: 'var(--glass-layer-bg)',
    '-webkit-backdrop-filter': 'var(--glass-layer-filter)',
    backdropFilter: 'var(--glass-layer-filter)',
    boxShadow: 'var(--glass-layer-rim)',
    pointerEvents: 'none'
  },
  // No blur or lens at all, on the element itself so its own variables can't undo it
  [REDUCED]: { '--glass-layer-filter': 'none' }
})

function iosGlass(options = {}) {
  const { materialTint, glassTint, accent } = { ...DEFAULTS, ...options }

  return {
    handler({ addBase, addComponents, addUtilities }) {
      addBase({
        ':root': {
          '--material-tint': materialTint,
          '--material-ultra-thin-filter': 'blur(12px) saturate(180%)',
          '--material-ultra-thin-alpha': '0.4',
          '--material-thin-filter': 'blur(16px) saturate(180%)',
          '--material-thin-alpha': '0.55',
          '--material-filter': 'blur(24px) saturate(180%)',
          '--material-alpha': '0.7',
          '--material-thick-filter': 'blur(30px) saturate(180%)',
          '--material-thick-alpha': '0.85',

          '--glass-tint': glassTint,
          '--glass-filter': 'blur(10px) saturate(180%) brightness(0.9)',
          '--glass-alpha': '0.55',
          '--glass-clear-filter': 'blur(3px) saturate(150%)',
          '--glass-clear-alpha': '0.12',
          // The lit rim: a bright top edge and a faint bottom one
          '--glass-specular': 'inset 0 1px 0 rgb(255 255 255 / 0.22), inset 0 -1px 0 rgb(255 255 255 / 0.06)',
          '--glass-accent': accent,
          '--glass-prominent-alpha': '0.7',

          // The bezel: its width, tint and how much of the content under it shows
          '--glass-edge-width': '6px',
          '--glass-edge-tint': glassTint,
          '--glass-edge-alpha': '0.35',
          '--glass-edge-filter': 'blur(4px) saturate(180%)',
          // How much the colour deepens at the outer edge (0: not at all, 1: to black)
          '--glass-edge-depth': '0.45'
        },
        [REDUCED]: {
          ':root': {
            ...opaque,
            '--material-ultra-thin-filter': 'none',
            '--material-thin-filter': 'none',
            '--material-filter': 'none',
            '--material-thick-filter': 'none',
            '--glass-filter': 'none',
            '--glass-clear-filter': 'none',
            '--glass-edge-filter': 'none'
          }
        },
        [NO_BACKDROP]: {
          ':root': opaque
        }
      })

      addComponents({
        // --glass-lens: the element's own lens filter, from ./refraction.mjs
        '.liquid-glass': surface('var(--glass-lens,) var(--glass-filter)', 'rgb(var(--glass-tint) / var(--glass-alpha))', 'var(--glass-specular)'),
        '.liquid-glass-clear': surface(
          'var(--glass-lens,) var(--glass-clear-filter)',
          'rgb(var(--glass-tint) / var(--glass-clear-alpha))',
          'var(--glass-specular)'
        ),
        '.material-ultra-thin': surface(
          'var(--material-ultra-thin-filter)',
          'rgb(var(--material-tint) / var(--material-ultra-thin-alpha))'
        ),
        '.material-thin': surface('var(--material-thin-filter)', 'rgb(var(--material-tint) / var(--material-thin-alpha))'),
        '.material': surface('var(--material-filter)', 'rgb(var(--material-tint) / var(--material-alpha))'),
        '.material-thick': surface('var(--material-thick-filter)', 'rgb(var(--material-tint) / var(--material-thick-alpha))'),
        '.liquid-glass-edge': {
          position: 'relative',
          isolation: 'isolate',
          // A ring, cut from a full layer with a mask, over the content (and under nothing)
          '&::after': {
            content: "''",
            position: 'absolute',
            inset: '0',
            boxSizing: 'border-box',
            padding: 'var(--glass-edge-width)',
            borderRadius: 'inherit',
            // Light catches the top left and, more faintly, the bottom right
            background:
              'linear-gradient(150deg, rgb(255 255 255 / 0.5), transparent 30%, transparent 70%, rgb(255 255 255 / 0.22)), rgb(var(--glass-edge-tint) / var(--glass-edge-alpha))',
            '-webkit-backdrop-filter': 'var(--glass-edge-filter)',
            backdropFilter: 'var(--glass-edge-filter)',
            // The edge's own glow, in its colour, then the colour deepening inwards from it
            boxShadow:
              'inset 0 0 0 1px color-mix(in srgb, rgb(var(--glass-edge-tint)) 60%, white), ' +
              'inset 0 0 calc(var(--glass-edge-width) * 0.9) color-mix(in srgb, rgb(var(--glass-edge-tint)), black calc(var(--glass-edge-depth) * 100%))',
            '-webkit-mask': 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            '-webkit-mask-composite': 'xor',
            mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
            pointerEvents: 'none'
          },
          // Opaque on the ring itself, so an element's own --glass-edge-alpha can't undo it
          [REDUCED]: {
            '&::after': { '--glass-edge-alpha': '1', '--glass-edge-filter': 'none' }
          },
          [NO_BACKDROP]: {
            '&::after': { '--glass-edge-alpha': '1' }
          }
        }
      })

      addUtilities({
        // Add to `liquid-glass`: the glass takes the accent colour, like a prominent glass button
        '.liquid-glass-prominent': {
          '--glass-layer-bg': 'rgb(var(--glass-accent) / var(--glass-prominent-alpha))'
        },
        // Add to a `liquid-glass` control: it swells a little and lights up while pressed, on a
        // springy curve (--glass-press-easing and --glass-press-duration: a site with its own
        // springs sets them to those)
        '.liquid-glass-interactive': {
          transition:
            'transform var(--glass-press-duration, 0.25s) var(--glass-press-easing, cubic-bezier(0.2, 0.8, 0.3, 1.2)), ' +
            'filter var(--glass-press-duration, 0.25s) ease',
          '&:active': { transform: 'scale(1.04)', filter: 'brightness(1.15)' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'filter var(--glass-press-duration, 0.25s) ease',
            '&:active': { transform: 'none' }
          }
        },
        // Clear glass over bright content: Apple's 35% dimming layer under the glass
        '.liquid-glass-dim': {
          '--glass-layer-bg':
            'linear-gradient(rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.35)), rgb(var(--glass-tint) / var(--glass-clear-alpha))'
        },
        // The scroll edge effect under a top bar: instead of a hard line, content fades and blurs as
        // it slides under the glass
        '.liquid-glass-scroll-edge::after': {
          content: "''",
          position: 'absolute',
          top: '100%',
          right: '0',
          left: '0',
          height: '0.75rem',
          background: 'linear-gradient(rgb(var(--glass-tint) / var(--glass-alpha)), transparent)',
          '-webkit-backdrop-filter': 'blur(4px)',
          backdropFilter: 'blur(4px)',
          '-webkit-mask-image': 'linear-gradient(#000, transparent)',
          maskImage: 'linear-gradient(#000, transparent)',
          pointerEvents: 'none'
        }
      })
    }
  }
}

module.exports = iosGlass
