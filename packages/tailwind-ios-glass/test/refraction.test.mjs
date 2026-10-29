import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FILTER_ID, canRefract, installRefraction } from '../refraction.mjs'

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

// Just enough of a document for installRefraction
const fakeDocument = () => {
  const attrs = new Set()
  const byId = new Map()
  const node = name => {
    const el = {
      name,
      attrs: {},
      children: [],
      style: {},
      setAttribute(key, value) {
        el.attrs[key] = value
        if (key === 'id') byId.set(value, el)
      },
      append(...kids) {
        el.children.push(...kids)
      }
    }
    return el
  }
  return {
    documentElement: { toggleAttribute: (a, on) => (on ? attrs.add(a) : attrs.delete(a)) },
    body: node('body'),
    attrs,
    createElementNS: (_ns, name) => node(name),
    getElementById: id => byId.get(id) ?? null
  }
}

test('installs the filter once and marks the page in Chromium', () => {
  const doc = fakeDocument()
  assert.equal(installRefraction(doc, chromium), true)
  assert.equal(installRefraction(doc, chromium), true)
  assert.ok(doc.attrs.has('data-glass-refract'))
  assert.equal(doc.body.children.length, 1)
  const [filter] = doc.body.children[0].children
  assert.equal(filter.attrs.id, FILTER_ID)
  assert.deepEqual(filter.children.map(c => c.name), ['feTurbulence', 'feGaussianBlur', 'feDisplacementMap'])
})

test('adds nothing elsewhere', () => {
  const doc = fakeDocument()
  assert.equal(installRefraction(doc, {}), false)
  assert.equal(doc.attrs.has('data-glass-refract'), false)
  assert.equal(doc.body.children.length, 0)
})
