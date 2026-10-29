import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canRefract } from '../../utils/glass.js'

test('Chromium browsers get the refracting glass', () => {
  const brands = [{ brand: 'Not A Brand', version: '99' }, { brand: 'Chromium', version: '142' }, { brand: 'Google Chrome', version: '142' }]
  assert.equal(canRefract({ userAgentData: { brands } }), true)
})

test('Safari, Firefox and anything unknown keep the plain frosted blur', () => {
  assert.equal(canRefract({}), false) // no userAgentData (Safari, Firefox)
  assert.equal(canRefract(), false)
  assert.equal(canRefract({ userAgentData: {} }), false)
  assert.equal(canRefract({ userAgentData: { brands: 'Chromium' } }), false)
  assert.equal(canRefract({ userAgentData: { brands: [null, { brand: 'Firefox' }] } }), false)
})
