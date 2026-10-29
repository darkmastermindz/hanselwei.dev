// Apple's two kinds of material (Human Interface Guidelines, Materials) as Tailwind classes.
//
// - Liquid Glass (`liquid-glass`, `liquid-glass-clear`) is for controls and navigation that float above
//   content: headers, tab bars, toolbars. The regular variant blurs and darkens what's behind it so
//   text stays legible, and its edge catches the light. The clear variant is for floating over
//   photos and video; add `liquid-glass-dim` (35% black, as Apple suggests) over bright content.
//   With refraction installed (./refraction.mjs) it also bends what's behind it, where the browser can.
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

const FILTER_ID = 'liquid-glass'

const DEFAULTS = {
  // Tints, as space-separated RGB channels. The defaults suit a dark page.
  materialTint: '28 28 30',
  glassTint: '42 50 60'
}

const opaque = {
  '--material-ultra-thin-alpha': '1',
  '--material-thin-alpha': '1',
  '--material-alpha': '1',
  '--material-thick-alpha': '1',
  '--glass-alpha': '1',
  '--glass-clear-alpha': '1'
}

// Set on <html> by ./refraction.mjs in browsers that draw an SVG filter in backdrop-filter. An
// attribute rather than a class, which Tailwind would drop from the base styles unless it saw the
// class in a template.
const REFRACT = ':root[data-glass-refract]'

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
  }
})

function iosGlass(options = {}) {
  const { materialTint, glassTint } = { ...DEFAULTS, ...options }

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
          '--glass-specular': 'inset 0 1px 0 rgb(255 255 255 / 0.22), inset 0 -1px 0 rgb(255 255 255 / 0.06)'
        },
        [REFRACT]: {
          '--glass-filter': `url(#${FILTER_ID}) blur(10px) saturate(180%) brightness(0.9)`,
          '--glass-clear-filter': `url(#${FILTER_ID}) blur(3px) saturate(150%)`
        },
        '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)': {
          [`:root, ${REFRACT}`]: {
            ...opaque,
            '--material-ultra-thin-filter': 'none',
            '--material-thin-filter': 'none',
            '--material-filter': 'none',
            '--material-thick-filter': 'none',
            '--glass-filter': 'none',
            '--glass-clear-filter': 'none'
          }
        },
        '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
          [`:root, ${REFRACT}`]: opaque
        }
      })

      addComponents({
        '.liquid-glass': surface('var(--glass-filter)', 'rgb(var(--glass-tint) / var(--glass-alpha))', 'var(--glass-specular)'),
        '.liquid-glass-clear': surface(
          'var(--glass-clear-filter)',
          'rgb(var(--glass-tint) / var(--glass-clear-alpha))',
          'var(--glass-specular)'
        ),
        '.material-ultra-thin': surface(
          'var(--material-ultra-thin-filter)',
          'rgb(var(--material-tint) / var(--material-ultra-thin-alpha))'
        ),
        '.material-thin': surface('var(--material-thin-filter)', 'rgb(var(--material-tint) / var(--material-thin-alpha))'),
        '.material': surface('var(--material-filter)', 'rgb(var(--material-tint) / var(--material-alpha))'),
        '.material-thick': surface('var(--material-thick-filter)', 'rgb(var(--material-tint) / var(--material-thick-alpha))')
      })

      addUtilities({
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
module.exports.FILTER_ID = FILTER_ID
