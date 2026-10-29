// Liquid Glass refraction: the edge of the glass bends what's behind it, like the rim of a lens,
// and the middle stays clear. Each `liquid-glass` and `liquid-glass-clear` element gets its own SVG
// filter whose displacement map is drawn at the element's size and corner radius, and redrawn when
// it resizes. The element's --glass-lens is set to that filter, which the classes put in front of
// their blur (backdrop-filter: url(#…) blur(…)).
//
// The bend is strongest at the very edge and fades out across the bezel (--glass-lens-width, 16px
// by default); --glass-lens-strength (18px) is how far it reaches. Both are read from the element.
//
// Only Chromium browsers draw an SVG filter in backdrop-filter; Safari and Firefox would drop the
// whole blur with it, so they keep the frosted blur alone. Chromium is the browser that reports
// itself through navigator.userAgentData.

export const REFRACT_ATTRIBUTE = 'data-glass-refract'
export const SELECTOR = '.liquid-glass, .liquid-glass-clear'
const FILTER_PREFIX = 'liquid-glass-lens-'
const CONTAINER_ID = 'liquid-glass-lenses'
const MAX_MAP_SIZE = 600 // map pixels along the longer side; the browser scales it up smoothly

const SVG = 'http://www.w3.org/2000/svg'

export const canRefract = ({ userAgentData } = {}) =>
  Array.isArray(userAgentData?.brands) && userAgentData.brands.some(b => b?.brand === 'Chromium')

// The displacement map for a rounded rectangle (all sizes in map pixels), as RGBA bytes for
// feDisplacementMap: red moves sideways, green up and down, 128 doesn't move. Each pixel in the
// bezel samples from further out along the edge's normal, so what's just beyond the edge bends
// into the rim, the way a thick convex edge refracts it. The pull falls off as (1 - t)², t being
// how far into the bezel the pixel is.
export function lensMap(width, height, radius, bezel) {
  const data = new Uint8ClampedArray(width * height * 4)
  const halfW = width / 2
  const halfH = height / 2
  const r = Math.max(0, Math.min(radius, halfW, halfH))
  const b = Math.max(bezel, 1e-6)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW
      const py = y + 0.5 - halfH
      const qx = Math.abs(px) - (halfW - r)
      const qy = Math.abs(py) - (halfH - r)
      let inside, nx, ny
      if (qx > 0 && qy > 0) {
        // A corner: the normal points out from the corner's centre
        const len = Math.hypot(qx, qy)
        inside = r - len
        nx = (qx / len) * Math.sign(px)
        ny = (qy / len) * Math.sign(py)
      } else if (qx > qy) {
        inside = halfW - Math.abs(px)
        nx = Math.sign(px)
        ny = 0
      } else {
        inside = halfH - Math.abs(py)
        nx = 0
        ny = Math.sign(py)
      }
      const t = Math.min(Math.max(inside / b, 0), 1)
      const pull = (1 - t) ** 2
      const i = (y * width + x) * 4
      data[i] = Math.round(128 + 127 * nx * pull)
      data[i + 1] = Math.round(128 + 127 * ny * pull)
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }
  return data
}

// A border radius in pixels: "12px", or a percentage of the shorter side ("50%")
export const radiusPx = (value, width, height) => {
  const n = parseFloat(value) || 0
  return String(value).trim().endsWith('%') ? (n / 100) * Math.min(width, height) : n
}

const svgElement = (doc, name, attrs) => {
  const el = doc.createElementNS(SVG, name)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value))
  return el
}

const installed = new WeakSet()

// Marks <html> with `data-glass-refract` where the browser can draw the refraction, and from then
// on keeps a lens filter for every glass element on the page (added, resized or removed). Call once
// in the browser; calling again does nothing more. Returns whether it refracts.
export function installRefraction(doc = globalThis.document, nav = globalThis.navigator, win = globalThis) {
  const on = canRefract(nav)
  doc.documentElement.toggleAttribute(REFRACT_ATTRIBUTE, on)
  if (!on || installed.has(doc)) return on
  installed.add(doc)

  const container = svgElement(doc, 'svg', { id: CONTAINER_ID, width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' })
  container.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  doc.body.append(container)

  const lenses = new Map() // element → { filter, image, displace, key }
  let next = 0

  const draw = el => {
    const lens = lenses.get(el)
    const width = el.offsetWidth // offset sizes ignore transforms, such as a pressed button's scale
    const height = el.offsetHeight
    if (!lens || !width || !height) return
    const style = win.getComputedStyle(el)
    const radius = radiusPx(style.borderTopLeftRadius, width, height)
    const bezel = parseFloat(style.getPropertyValue('--glass-lens-width')) || 16
    const strength = parseFloat(style.getPropertyValue('--glass-lens-strength')) || 18
    const key = `${width}x${height} ${radius} ${bezel} ${strength}`
    if (lens.key === key) return
    lens.key = key

    const scale = Math.min(1, MAX_MAP_SIZE / Math.max(width, height))
    const mapW = Math.max(1, Math.ceil(width * scale))
    const mapH = Math.max(1, Math.ceil(height * scale))
    const canvas = doc.createElement('canvas')
    canvas.width = mapW
    canvas.height = mapH
    canvas.getContext('2d').putImageData(new win.ImageData(lensMap(mapW, mapH, radius * scale, bezel * scale), mapW, mapH), 0, 0)

    for (const node of [lens.filter, lens.image]) {
      node.setAttribute('width', String(width))
      node.setAttribute('height', String(height))
    }
    lens.image.setAttribute('href', canvas.toDataURL())
    lens.displace.setAttribute('scale', String(strength * 2)) // feDisplacementMap moves by scale × (value − 0.5)
  }

  const resizes = new win.ResizeObserver(entries => entries.forEach(entry => draw(entry.target)))

  const track = el => {
    const id = `${FILTER_PREFIX}${next++}`
    const filter = svgElement(doc, 'filter', {
      id,
      x: 0,
      y: 0,
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse',
      'color-interpolation-filters': 'sRGB'
    })
    const image = svgElement(doc, 'feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'lens' })
    const displace = svgElement(doc, 'feDisplacementMap', { in: 'SourceGraphic', in2: 'lens', xChannelSelector: 'R', yChannelSelector: 'G' })
    filter.append(image, displace)
    container.append(filter)
    lenses.set(el, { filter, image, displace, key: null })
    el.style.setProperty('--glass-lens', `url(#${id})`)
    resizes.observe(el)
    draw(el)
  }

  const untrack = el => {
    lenses.get(el).filter.remove()
    lenses.delete(el)
    el.style.removeProperty('--glass-lens')
    resizes.unobserve(el)
  }

  let pending = false
  const scan = () => {
    pending = false
    const glass = new Set(doc.querySelectorAll(SELECTOR))
    for (const el of [...lenses.keys()]) if (!glass.has(el) || !el.isConnected) untrack(el)
    for (const el of glass) if (!lenses.has(el)) track(el)
  }
  scan()
  new win.MutationObserver(() => {
    if (pending) return
    pending = true
    win.requestAnimationFrame(scan)
  }).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

  return on
}
