// Liquid Glass refraction bends the page behind the header through an SVG filter
// (`backdrop-filter: url(#liquid-glass)`, components/GlassFilter.vue). Only Chromium browsers draw an
// SVG filter in backdrop-filter; Safari and Firefox would drop the whole blur with it, so they get
// the frosted blur alone. Chromium is the browser that reports itself through userAgentData.
export const canRefract = ({ userAgentData } = {}) =>
  Array.isArray(userAgentData?.brands) && userAgentData.brands.some(b => b?.brand === 'Chromium')
