// The topographic background is built from a seeded field at the screen's size. It must be
// deterministic, stay inside the screen, keep a similar density on phones and desktops, stay a
// reasonable size, and draw in with overlapping levels.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTopo, INDEX_EVERY, LEVEL_COUNT, levelProgress, trailOpacity } from '../../utils/topo.mjs'

const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }
const phone = buildTopo(PHONE)
const desktop = buildTopo(DESKTOP)

const numbersIn = d => d.match(/-?\d+(\.\d+)?/g).map(Number)
const totalLength = topo => topo.levels.reduce((sum, level) => sum + level.length, 0)

test('the same screen size always gives the same pattern', () => {
  assert.deepEqual(buildTopo(PHONE), phone)
})

test('there are 28 levels, every 5th an index line, and each one has lines', () => {
  assert.equal(phone.levels.length, LEVEL_COUNT)
  phone.levels.forEach((level, k) => {
    assert.equal(level.index, k % INDEX_EVERY === INDEX_EVERY - 1, `level ${k}`)
    assert.match(level.d, /^M\d+ \d+/, `level ${k} has lines`)
    assert.ok(level.length > 0)
  })
})

test('every point sits inside the screen', () => {
  for (const topo of [phone, desktop]) {
    for (const { d } of [...topo.levels, ...topo.trails]) {
      const numbers = numbersIn(d)
      for (let i = 0; i < numbers.length; i += 2) {
        assert.ok(numbers[i] >= 0 && numbers[i] <= topo.width, `x ${numbers[i]}`)
        assert.ok(numbers[i + 1] >= 0 && numbers[i + 1] <= topo.height, `y ${numbers[i + 1]}`)
      }
    }
  }
})

test('segments are joined into long smooth lines, not drawn one by one', () => {
  const all = phone.levels.map(level => level.d).join('')
  const moves = (all.match(/M/g) || []).length
  const curves = (all.match(/Q/g) || []).length
  assert.ok(curves > moves * 3, `${curves} curves for ${moves} lines`)
})

test('a phone and a desktop get a similar density of lines', () => {
  const perArea = topo => totalLength(topo) / (topo.width * topo.height)
  const ratio = perArea(phone) / perArea(desktop)
  assert.ok(ratio > 0.6 && ratio < 1.6, `density ratio ${ratio}`)
})

test('a large screen stays a reasonable size', () => {
  const big = buildTopo({ width: 2560, height: 1440 })
  const chars = [...big.levels, ...big.trails].reduce((sum, { d }) => sum + d.length, 0)
  assert.ok(chars < 450_000, `${chars} characters of path data`)
})

test('there are a few dashed trails', () => {
  assert.ok(phone.trails.length >= 1 && phone.trails.length <= 3)
  for (const { d } of phone.trails) assert.match(d, /^M\d+ \d+/)
})

test('nothing is drawn at the start, and everything at the end', () => {
  for (let i = 0; i < LEVEL_COUNT; i++) {
    assert.equal(levelProgress(0, i), 0)
    assert.equal(levelProgress(1, i), 1)
  }
  assert.equal(trailOpacity(0), 0)
  assert.equal(trailOpacity(0.8), 0)
  assert.equal(trailOpacity(1), 1)
})

test('levels overlap as they draw, and never go backwards', () => {
  const growing = [...Array(LEVEL_COUNT).keys()].filter(i => levelProgress(0.5, i) > 0 && levelProgress(0.5, i) < 1)
  assert.ok(growing.length >= 3, `${growing.length} levels drawing at once`)
  for (let i = 0; i < LEVEL_COUNT; i++) {
    let previous = 0
    for (let step = 0; step <= 50; step++) {
      const value = levelProgress(step / 50, i)
      assert.ok(value >= previous)
      previous = value
    }
  }
})
