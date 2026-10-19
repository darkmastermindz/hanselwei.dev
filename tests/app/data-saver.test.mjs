// When the browser asks to save data, config.toml [background] data_saver picks a lighter
// pattern ("sparse", the default), none ("skip"), or the full one ("full").
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BACKGROUND_DEFAULTS, LIGHT_CELL_PX, topoOptions, wantsLessData } from '../../utils/background.mjs'
import { buildTopo } from '../../utils/topo.mjs'

test('Data Saver / Lite mode, prefers-reduced-data and 2G all mean less data', () => {
  assert.equal(wantsLessData({ saveData: true }), true)
  assert.equal(wantsLessData({ reducedData: true }), true)
  assert.equal(wantsLessData({ effectiveType: '2g' }), true)
  assert.equal(wantsLessData({ effectiveType: 'slow-2g' }), true)
})

test('normal connections, and browsers that report nothing, get the full background', () => {
  assert.equal(wantsLessData({ effectiveType: '4g' }), false)
  assert.equal(wantsLessData({ effectiveType: '3g', saveData: false }), false)
  assert.equal(wantsLessData({}), false)
  assert.equal(wantsLessData(), false)
  assert.equal(wantsLessData({ saveData: undefined, effectiveType: undefined }), false)
})

test('without a data-saving hint, the configured pattern is used as is', () => {
  assert.deepEqual(topoOptions(BACKGROUND_DEFAULTS, false), {
    contours: BACKGROUND_DEFAULTS.contours,
    featureSize: BACKGROUND_DEFAULTS.featureSize,
    indexEvery: BACKGROUND_DEFAULTS.indexEvery,
    trails: BACKGROUND_DEFAULTS.trails
  })
})

test('"sparse" (the default) builds a lighter pattern when saving data', () => {
  assert.equal(BACKGROUND_DEFAULTS.dataSaver, 'sparse')
  const light = topoOptions(BACKGROUND_DEFAULTS, true)
  assert.equal(light.contours, Math.round(BACKGROUND_DEFAULTS.contours / 2))
  assert.ok(light.featureSize > BACKGROUND_DEFAULTS.featureSize)
  assert.equal(light.trails, 0)
  assert.equal(light.cellSize, LIGHT_CELL_PX)

  // ...and it really is much smaller
  const size = topo => [...topo.levels, ...topo.trails].reduce((sum, { d }) => sum + d.length, 0)
  const screen = { width: 390, height: 844 }
  const full = size(buildTopo({ ...screen, ...topoOptions(BACKGROUND_DEFAULTS, false) }))
  const lighter = size(buildTopo({ ...screen, ...light }))
  assert.ok(lighter < full / 2, `${lighter} vs ${full} characters`)
})

test('the light pattern keeps at least 8 contours and features no larger than 800px', () => {
  const light = topoOptions({ ...BACKGROUND_DEFAULTS, contours: 8, featureSize: 700 }, true)
  assert.equal(light.contours, 8)
  assert.equal(light.featureSize, 800)
})

test('"skip" draws nothing when saving data, "full" ignores the hint', () => {
  assert.equal(topoOptions({ ...BACKGROUND_DEFAULTS, dataSaver: 'skip' }, true), null)
  assert.ok(topoOptions({ ...BACKGROUND_DEFAULTS, dataSaver: 'skip' }, false))
  assert.deepEqual(topoOptions({ ...BACKGROUND_DEFAULTS, dataSaver: 'full' }, true), topoOptions(BACKGROUND_DEFAULTS, false))
})

test('a turned-off background draws nothing either way', () => {
  assert.equal(topoOptions({ ...BACKGROUND_DEFAULTS, enabled: false }, false), null)
  assert.equal(topoOptions({ ...BACKGROUND_DEFAULTS, enabled: false }, true), null)
})
