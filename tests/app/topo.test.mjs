// The topographic background is built from a seeded field, so it must be deterministic (the
// server and the browser draw the same lines), stay inside its viewBox, and fill in in stages.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTopoPaths, levelProgress, TOPO_HEIGHT, TOPO_LEVELS, TOPO_PATHS, TOPO_WIDTH } from '../../utils/topo.mjs'

test('the same field always gives the same lines', () => {
  assert.deepEqual(buildTopoPaths(), TOPO_PATHS)
})

test('there is one path per contour level, and each one has lines', () => {
  assert.equal(TOPO_PATHS.length, TOPO_LEVELS.length)
  for (const { d } of TOPO_PATHS) assert.match(d, /^M-?[\d.]+ -?[\d.]+L/)
})

test('every point sits inside the viewBox', () => {
  for (const { d } of TOPO_PATHS) {
    const numbers = d.match(/-?\d+(\.\d+)?/g).map(Number)
    for (let i = 0; i < numbers.length; i += 2) {
      assert.ok(numbers[i] >= 0 && numbers[i] <= TOPO_WIDTH, `x ${numbers[i]}`)
      assert.ok(numbers[i + 1] >= 0 && numbers[i + 1] <= TOPO_HEIGHT, `y ${numbers[i + 1]}`)
    }
  }
})

test('nothing is drawn at the start, and everything once the pattern is complete', () => {
  for (let i = 0; i < TOPO_LEVELS.length; i++) {
    assert.equal(levelProgress(0, i), 0)
    assert.equal(levelProgress(1, i), 1)
  }
})

test('levels fill in one after another, and never go backwards', () => {
  let previous = 0
  for (let step = 0; step <= 100; step++) {
    const drawn = step / 100
    const first = levelProgress(drawn, 0)
    assert.ok(first >= previous, 'the first level never shrinks')
    previous = first
  }
  // Halfway through, the first few levels are full and the last ones are still empty
  assert.equal(levelProgress(0.5, 0), 1)
  assert.equal(levelProgress(0.5, TOPO_LEVELS.length - 1), 0)
})

test('every level reports a positive length for the dash to draw along', () => {
  for (const { length } of TOPO_PATHS) assert.ok(length > 0, `length ${length}`)
})
