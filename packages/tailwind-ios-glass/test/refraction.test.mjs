import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canRefract, installRefraction, lensMap, radiusPx } from '../refraction.mjs'

const chromium = { userAgentData: { brands: [{ brand: 'Not A Brand' }, { brand: 'Chromium' }, { brand: 'Google Chrome' }] } }

test('Chromium browsers refract', () => {
  assert.equal(canRefract(chromium), true)
})

test('Safari, Firefox and anything unknown keep the plain frosted blur', () => {
  assert.equal(canRefract({}), false) // no userAgentData (Safari, Firefox)
  assert.equal(canRefract(), false)
  assert.equal(canRefract({ userAgentData: {} }), false)
  assert.equal(canRefract({ userAgentData: { brands: 'Chromium' } }), false)
  assert.equal(canRefract({ userAgentData: { brands: [null, { brand: 'Firefox' }] } }), false)
})

const pixel = (data, width, x, y) => [...data.slice((y * width + x) * 4, (y * width + x) * 4 + 4)]

test('the lens bends the edge outward along its normal and leaves the middle clear', () => {
  const w = 100
  const h = 60
  const map = lensMap(w, h, 0, 10)
  assert.deepEqual(pixel(map, w, 50, 30), [128, 128, 128, 255]) // middle
  const [lr, lg] = pixel(map, w, 0, 30) // left edge: samples further left
  const [rr] = pixel(map, w, w - 1, 30) // right edge: further right
  const [, tg] = pixel(map, w, 50, 0) // top: further up
  const [, bg] = pixel(map, w, 50, h - 1) // bottom: further down
  assert.ok(lr < 20 && lg === 128, `left ${lr},${lg}`)
  assert.ok(rr > 236)
  assert.ok(tg < 20)
  assert.ok(bg > 236)
})

test('the bend fades out across the bezel', () => {
  const w = 100
  const map = lensMap(w, 40, 0, 10)
  const pulls = [0, 3, 6, 9, 12].map(x => 128 - pixel(map, w, x, 20)[0])
  for (let i = 1; i < pulls.length; i++) assert.ok(pulls[i] <= pulls[i - 1], pulls.join(' '))
  assert.equal(pulls.at(-1), 0) // past the bezel: no bend
})

test('rounded corners bend along the diagonal', () => {
  const w = 80
  const map = lensMap(w, 80, 20, 10)
  const [r, g] = pixel(map, w, 7, 7) // in the top-left corner's curve
  assert.ok(r < 128 && g < 128 && Math.abs(r - g) <= 1, `${r},${g}`)
})

test('border radii in pixels or percent of the shorter side', () => {
  assert.equal(radiusPx('12px', 100, 40), 12)
  assert.equal(radiusPx('50%', 100, 40), 20)
  assert.equal(radiusPx('', 100, 40), 0)
})

// Just enough of a browser for installRefraction
const fakeBrowser = () => {
  const attrs = new Set()
  const byId = new Map()
  const node = (name, extra = {}) => {
    const el = {
      name,
      attrs: {},
      children: [],
      props: {},
      isConnected: true,
      style: {
        setProperty: (k, v) => (el.props[k] = v),
        removeProperty: k => delete el.props[k]
      },
      setAttribute(key, value) {
        el.attrs[key] = value
        if (key === 'id') byId.set(value, el)
      },
      append(...kids) {
        el.children.push(...kids)
      },
      remove() {},
      ...extra
    }
    return el
  }
  const glass = node('nav', { offsetWidth: 300, offsetHeight: 60 })
  const doc = {
    documentElement: { toggleAttribute: (a, on) => (on ? attrs.add(a) : attrs.delete(a)) },
    body: node('body'),
    attrs,
    createElementNS: (_ns, name) => node(name),
    createElement: () => ({ getContext: () => ({ putImageData() {} }), toDataURL: () => 'data:image/png;base64,AAAA' }),
    getElementById: id => byId.get(id) ?? null,
    querySelectorAll: () => [glass]
  }
  const win = {
    getComputedStyle: () => ({ borderTopLeftRadius: '12px', getPropertyValue: () => '' }),
    ImageData: class {},
    ResizeObserver: class {
      observe() {}
      unobserve() {}
    },
    MutationObserver: class {
      observe() {}
    },
    requestAnimationFrame: fn => fn()
  }
  return { doc, win, glass }
}

test('each glass element gets a lens filter sized to it, in Chromium', () => {
  const { doc, win, glass } = fakeBrowser()
  assert.equal(installRefraction(doc, chromium, win), true)
  assert.equal(installRefraction(doc, chromium, win), true) // once only
  assert.ok(doc.attrs.has('data-glass-refract'))
  const [container] = doc.body.children
  assert.equal(doc.body.children.length, 1)
  const [filter] = container.children
  assert.equal(glass.props['--glass-lens'], `url(#${filter.attrs.id})`)
  assert.equal(filter.attrs.width, '300')
  assert.equal(filter.attrs.height, '60')
  const [image, displace] = filter.children
  assert.equal(image.name, 'feImage')
  assert.equal(image.attrs.href, 'data:image/png;base64,AAAA')
  assert.equal(displace.name, 'feDisplacementMap')
  assert.equal(displace.attrs.scale, '36')
})

test('adds nothing elsewhere', () => {
  const { doc, win, glass } = fakeBrowser()
  assert.equal(installRefraction(doc, {}, win), false)
  assert.equal(doc.attrs.has('data-glass-refract'), false)
  assert.equal(doc.body.children.length, 0)
  assert.equal(glass.props['--glass-lens'], undefined)
})
