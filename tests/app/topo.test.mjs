// The topographic background is built from a seeded field at the screen's size. It must be
// deterministic, stay inside the screen, keep a similar density on phones and desktops, stay a
// reasonable size, and draw in with overlapping levels.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BACKGROUND_DEFAULTS } from '../../utils/background.mjs'
import { buildTopo, densityOrder, INDEX_EVERY, LEVEL_COUNT, levelProgress, START_MS, trailOpacity } from '../../utils/topo.mjs'

const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }
const phone = buildTopo(PHONE)
const desktop = buildTopo(DESKTOP)

const numbersIn = d => d.match(/-?\d+(\.\d+)?/g).map(Number)
const totalLength = topo => topo.levels.reduce((sum, level) => sum + level.length, 0)

test('the same screen size always gives the same pattern', () => {
  assert.deepEqual(buildTopo(PHONE), phone)
})

test('there is one level per contour, every 5th an index line, and each one has lines', () => {
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

test('a large screen stays a reasonable size at the default settings', () => {
  const big = buildTopo({ width: 2560, height: 1440 })
  const chars = [...big.levels, ...big.trails].reduce((sum, { d }) => sum + d.length, 0)
  assert.ok(chars < 600_000, `${chars} characters of path data`)
})

test('the settings change the pattern: contours, feature size, index lines and trails', () => {
  const denser = buildTopo({ ...PHONE, featureSize: 120 })
  assert.ok(totalLength(denser) > totalLength(phone) * 1.3, 'smaller features give more line')

  const more = buildTopo({ ...PHONE, contours: 50 })
  assert.equal(more.levels.length, 50)

  const plain = buildTopo({ ...PHONE, indexEvery: 0, trails: 0 })
  assert.equal(plain.levels.filter(level => level.index).length, 0)
  assert.deepEqual(plain.trails, [])

  const everyThird = buildTopo({ ...PHONE, indexEvery: 3 })
  assert.equal(everyThird.levels.filter(level => level.index).length, Math.floor(LEVEL_COUNT / 3))
})

test('there are a few dashed trails', () => {
  assert.ok(phone.trails.length >= 1 && phone.trails.length <= 3)
  for (const { d } of phone.trails) assert.match(d, /^M\d+ \d+/)
})

const DRAW_MS = BACKGROUND_DEFAULTS.drawSeconds * 1000
const plan = { count: LEVEL_COUNT, startCount: BACKGROUND_DEFAULTS.startContours, drawMs: DRAW_MS }
const shown = elapsed => [...Array(LEVEL_COUNT).keys()].filter(rank => levelProgress(elapsed, rank, plan) > 0).length

test('density order: every level once, starting with evenly spaced heights', () => {
  for (const [count, start] of [[28, 8], [14, 4], [8, 1], [60, 60], [10, 3]]) {
    const order = densityOrder(count, start)
    assert.deepEqual([...order].sort((a, b) => a - b), [...Array(count).keys()], `${count}/${start}`)
    // the starting set is spread out: neighbours in height are never more than one step apart
    // from an even spacing
    const first = order.slice(0, start).sort((a, b) => a - b)
    for (let i = 1; i < first.length; i++) {
      const gap = first[i] - first[i - 1]
      assert.ok(Math.abs(gap - count / start) <= 1, `${count}/${start}: gap ${gap}`)
    }
  }
})

test('density order: each new level fills the widest gap left', () => {
  const order = densityOrder(28, 8)
  for (let n = 8; n < order.length; n++) {
    const chosen = order.slice(0, n)
    const gapTo = k => Math.min(...chosen.map(c => Math.abs(k - c)))
    const widest = Math.max(...[...Array(28).keys()].filter(k => !chosen.includes(k)).map(gapTo))
    assert.equal(gapTo(order[n]), widest)
  }
})

test('the starting pattern draws in the first seconds, then density grows to the configured peak', () => {
  assert.equal(shown(0), 0)
  // the starting set, and only it, is under way right away and finished by START_MS
  assert.equal(shown(500), plan.startCount)
  for (let rank = 0; rank < plan.startCount; rank++) assert.equal(levelProgress(START_MS, rank, plan), 1)
  // more and more contours show as the visitor stays...
  const counts = [START_MS, DRAW_MS * 0.25, DRAW_MS * 0.5, DRAW_MS * 0.75].map(shown)
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i] > counts[i - 1], `${counts}`)
  assert.ok(counts[0] < LEVEL_COUNT / 2)
  // ...up to every configured contour, fully drawn, at drawMs
  for (let rank = 0; rank < LEVEL_COUNT; rank++) assert.equal(levelProgress(DRAW_MS, rank, plan), 1)
  assert.equal(levelProgress(Infinity, LEVEL_COUNT - 1, plan), 1)
})

test('levels never go backwards, and a few grow at once', () => {
  for (let rank = 0; rank < LEVEL_COUNT; rank++) {
    let previous = 0
    for (let step = 0; step <= 200; step++) {
      const value = levelProgress((step / 200) * DRAW_MS, rank, plan)
      assert.ok(value >= previous && value <= 1)
      previous = value
    }
  }
  const growing = [...Array(LEVEL_COUNT).keys()].filter(rank => {
    const value = levelProgress(DRAW_MS / 2, rank, plan)
    return value > 0 && value < 1
  })
  assert.ok(growing.length >= 2, `${growing.length} levels growing at once`)
})

test('a short or zero draw time still ends complete', () => {
  for (const drawMs of [0, 1000, 5000]) {
    for (let rank = 0; rank < LEVEL_COUNT; rank++) assert.equal(levelProgress(drawMs, rank, { ...plan, drawMs }), 1)
  }
  assert.equal(levelProgress(0, 0, { ...plan, drawMs: 0 }), 1)
  const all = { count: 8, startCount: 8, drawMs: DRAW_MS }
  assert.equal(levelProgress(START_MS, 7, all), 1)
})

test('trails fade in at the end of the drawing', () => {
  assert.equal(trailOpacity(0, DRAW_MS), 0)
  assert.equal(trailOpacity(DRAW_MS * 0.5, DRAW_MS), 0)
  assert.ok(trailOpacity(DRAW_MS - 1000, DRAW_MS) > 0)
  assert.equal(trailOpacity(DRAW_MS, DRAW_MS), 1)
  assert.equal(trailOpacity(0, 0), 1)
})

test('each level knows its longest line and its place in the draw order', () => {
  for (const level of phone.levels) {
    assert.ok(level.longest >= 0 && level.longest <= level.length + 1e-9)
  }
  const orders = phone.levels.map(level => level.order).sort((a, b) => a - b)
  assert.deepEqual(orders, [...Array(phone.levels.length).keys()])
  assert.equal(phone.startCount, BACKGROUND_DEFAULTS.startContours)
  assert.equal(buildTopo({ width: 390, height: 844, startContours: 99 }).startCount, LEVEL_COUNT)
})
