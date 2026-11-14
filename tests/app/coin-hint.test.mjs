// The coin's "you can tap me" nudge (utils/coinHint.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HINT_IDLE_MS, HINT_MAX_IDLE_MS, hintSteps, nextHintWait } from '../../utils/coinHint.mjs'

test('a nudge tilts left, then right, and ends exactly where it started', () => {
  for (const rest of [0, 180, 360, 1980]) {
    const steps = hintSteps(rest)
    assert.ok(steps[0].angle < rest, 'left first')
    assert.ok(steps[1].angle > rest, 'then right')
    assert.equal(steps.at(-1).angle, rest)
  }
})

test("a nudge never turns far enough to show the coin's other face", () => {
  for (const { angle } of hintSteps(0)) assert.ok(Math.abs(angle) < 45)
})

test('a nudge comes home on the same .smooth spring as the coin reset, in order', () => {
  const steps = hintSteps(0)
  assert.match(steps.at(-1).timing, /var\(--spring-smooth\)/)
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i].at > steps[i - 1].at)
})

test('left alone, each nudge waits twice as long as the last, up to a cap', () => {
  assert.equal(nextHintWait(HINT_IDLE_MS), HINT_IDLE_MS * 2)
  let wait = HINT_IDLE_MS
  for (let i = 0; i < 20; i++) wait = nextHintWait(wait)
  assert.equal(wait, HINT_MAX_IDLE_MS)
})
