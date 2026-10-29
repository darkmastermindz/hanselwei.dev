// Liquid Glass refraction: an SVG filter that bends the page behind `liquid-glass` and `liquid-glass-clear`
// (backdrop-filter: url(#liquid-glass)). Low-frequency noise nudges the blurred backdrop a few
// pixels, so it reads as thick, slightly uneven glass.
//
// Only Chromium browsers draw an SVG filter in backdrop-filter; Safari and Firefox would drop the
// whole blur with it, so they keep the frosted blur alone. Chromium is the browser that reports
// itself through navigator.userAgentData.

export const FILTER_ID = 'liquid-glass'
export const REFRACT_ATTRIBUTE = 'data-glass-refract'

const SVG = 'http://www.w3.org/2000/svg'

export const canRefract = ({ userAgentData } = {}) =>
  Array.isArray(userAgentData?.brands) && userAgentData.brands.some(b => b?.brand === 'Chromium')

const element = (doc, name, attrs) => {
  const el = doc.createElementNS(SVG, name)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  return el
}

// Adds the filter to the page and marks <html> with `data-glass-refract`, where the browser can draw
// it. Call once in the browser; calling again does nothing more. Returns whether it refracts.
export function installRefraction(doc = globalThis.document, nav = globalThis.navigator) {
  const on = canRefract(nav)
  doc.documentElement.toggleAttribute(REFRACT_ATTRIBUTE, on)
  if (!on || doc.getElementById(FILTER_ID)) return on

  const svg = element(doc, 'svg', { width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false' })
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  const filter = element(doc, 'filter', {
    id: FILTER_ID,
    x: '0',
    y: '0',
    width: '100%',
    height: '100%',
    'color-interpolation-filters': 'sRGB'
  })
  filter.append(
    element(doc, 'feTurbulence', { type: 'fractalNoise', baseFrequency: '0.008 0.02', numOctaves: '2', seed: '7', result: 'noise' }),
    element(doc, 'feGaussianBlur', { in: 'noise', stdDeviation: '2', result: 'soft' }),
    element(doc, 'feDisplacementMap', { in: 'SourceGraphic', in2: 'soft', scale: '14', xChannelSelector: 'R', yChannelSelector: 'G' })
  )
  svg.append(filter)
  doc.body.append(svg)
  return on
}
