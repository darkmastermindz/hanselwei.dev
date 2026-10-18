// The topographic background is skipped when the browser asks to save data (config.toml
// [background] respect_data_saver). wantsLessData reads what the browser reports.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BACKGROUND_DEFAULTS, wantsLessData } from '../../utils/background.mjs'

test('Data Saver / Lite mode means less data', () => {
  assert.equal(wantsLessData({ saveData: true }), true)
})

test('prefers-reduced-data means less data', () => {
  assert.equal(wantsLessData({ reducedData: true }), true)
})

test('a 2G or slower connection means less data', () => {
  assert.equal(wantsLessData({ effectiveType: '2g' }), true)
  assert.equal(wantsLessData({ effectiveType: 'slow-2g' }), true)
})

test('normal connections, and browsers that report nothing, get the background', () => {
  assert.equal(wantsLessData({ effectiveType: '4g' }), false)
  assert.equal(wantsLessData({ effectiveType: '3g', saveData: false }), false)
  assert.equal(wantsLessData({}), false)
  assert.equal(wantsLessData(), false)
  assert.equal(wantsLessData({ saveData: undefined, effectiveType: undefined }), false)
})

test('respecting data saving is on by default', () => {
  assert.equal(BACKGROUND_DEFAULTS.respectDataSaver, true)
})
