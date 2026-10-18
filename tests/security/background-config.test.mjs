// config.toml [background] is written into a generated module at build time
// (scripts/build-background.mjs). Only known settings with checked values may get through:
// anything else is a build error, never code or an unexpected key in the module.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BACKGROUND_DEFAULTS, backgroundModule, buildBackgroundConfig } from '../../utils/background.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

test('no [background] section means the defaults', () => {
  assert.deepEqual(buildBackgroundConfig({}), { config: BACKGROUND_DEFAULTS, problems: [] })
  assert.deepEqual(buildBackgroundConfig(), { config: BACKGROUND_DEFAULTS, problems: [] })
})

test('valid settings are used, in their own names', () => {
  const { config, problems } = buildBackgroundConfig({
    background: { enabled: false, data_saver: 'skip', contours: 50, start_contours: 12, feature_size: 120, index_every: 0, trails: 0, draw_seconds: 0 }
  })
  assert.deepEqual(problems, [])
  assert.deepEqual(config, {
    enabled: false,
    dataSaver: 'skip',
    contours: 50,
    startContours: 12,
    featureSize: 120,
    indexEvery: 0,
    trails: 0,
    drawSeconds: 0
  })
})

test('out-of-range, fractional and wrongly typed values fail the build', () => {
  const bad = [
    { contours: 7 },
    { contours: 61 },
    { contours: 36.5 },
    { contours: '36' },
    { start_contours: 0 },
    { start_contours: 61 },
    { start_contours: 29 },
    { feature_size: 0 },
    { feature_size: Infinity },
    { feature_size: Number.NaN },
    { index_every: -1 },
    { trails: 7 },
    { draw_seconds: 601 },
    { enabled: 'yes' },
    { enabled: 1 },
    { data_saver: 'auto' },
    { data_saver: true },
    { data_saver: 'SPARSE' }
  ]
  for (const background of bad) {
    const { config, problems } = buildBackgroundConfig({ background })
    assert.equal(problems.length, 1, JSON.stringify(background))
    assert.deepEqual(config, BACKGROUND_DEFAULTS, 'a bad value never replaces the default')
  }
})

test('a starting pattern bigger than the peak fails the build', () => {
  const { config, problems } = buildBackgroundConfig({ background: { contours: 8, start_contours: 9 } })
  assert.equal(problems.length, 1)
  assert.ok(config.startContours <= config.contours)
})

test('unknown or hostile keys fail the build and never reach the module', () => {
  for (const key of [...PROTOTYPE_KEYS, ...JS_BREAKOUTS, 'speed', 'featureSize']) {
    // A computed key makes an own property, even for "__proto__" (as a parsed TOML key would be)
    const { config, problems } = buildBackgroundConfig({ background: { [key]: 1 } })
    assert.ok(problems.length >= 1, key)
    assert.deepEqual(Object.keys(config).sort(), Object.keys(BACKGROUND_DEFAULTS).sort())
  }
})

test('hostile values are refused, so the generated module only holds numbers, booleans and a known mode', () => {
  for (const payload of [...JS_BREAKOUTS, ...XSS_HTML]) {
    for (const key of ['enabled', 'data_saver', 'contours', 'start_contours', 'feature_size', 'index_every', 'trails', 'draw_seconds']) {
      const { config, problems } = buildBackgroundConfig({ background: { [key]: payload } })
      assert.equal(problems.length, 1)
      const source = backgroundModule(config)
      assert.doesNotMatch(source, /<|process|pwned|\$\{/, 'nothing from the payload in the module')
    }
  }
})

test('a [background] that is not a table fails the build', () => {
  for (const background of ['on', 42, ['contours', 36]]) {
    const { config, problems } = buildBackgroundConfig({ background })
    assert.equal(problems.length, 1)
    assert.deepEqual(config, BACKGROUND_DEFAULTS)
  }
})

test('the generated module is plain data', async () => {
  const source = backgroundModule(BACKGROUND_DEFAULTS)
  const loaded = await import(`data:text/javascript,${encodeURIComponent(source)}`)
  assert.deepEqual(loaded.default, BACKGROUND_DEFAULTS)
})
