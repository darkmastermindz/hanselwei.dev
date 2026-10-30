// SwiftUI-style springs (utils/spring.mjs): the solver must start at rest or at the given
// velocity, end at 1, overshoot only when it has bounce, and the checked-in CSS presets must
// match what the solver gives (run `node scripts/build-springs.mjs` after changing either).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SPRINGS, settleTime, springAt, springCss, springEasing, springPhysics } from '../../utils/spring.mjs'

const stopsOf = easing => easing.slice('linear('.length, -1).split(', ').map(Number)
const slopeAt0 = (physics, velocity) => springAt(1e-6, physics, velocity)[0] / 1e-6

test('Spring(duration:bounce:) maps to the same stiffness and damping SwiftUI uses', () => {
  const { stiffness, damping, mass } = springPhysics({ duration: 0.5, bounce: 0.3 })
  assert.equal(mass, 1)
  assert.ok(Math.abs(stiffness - (4 * Math.PI) ** 2) < 1e-9)
  assert.ok(Math.abs(damping - 4 * Math.PI * 0.7 / 0.5) < 1e-9)
})

test('every kind of spring starts at 0 with the given velocity and comes to rest at 1', () => {
  for (const bounce of [-0.4, 0, 0.15, 0.3, 0.7]) {
    const physics = springPhysics({ duration: 0.5, bounce })
    for (const velocity of [0, 2, 8]) {
      const [x0, v0] = springAt(0, physics, velocity)
      assert.ok(Math.abs(x0) < 1e-12, `bounce ${bounce} starts at 0`)
      assert.ok(Math.abs(v0 - velocity) < 1e-9, `bounce ${bounce} starts at velocity ${velocity}`)
      assert.ok(Math.abs(slopeAt0(physics, velocity) - velocity) < 1e-3, `bounce ${bounce} velocity matches the curve`)
      const [x, v] = springAt(5, physics, velocity)
      assert.ok(Math.abs(x - 1) < 1e-6 && Math.abs(v) < 1e-6, `bounce ${bounce} settles`)
    }
  }
})

test('only a spring with bounce overshoots, and more bounce overshoots more', () => {
  const peak = bounce => Math.max(...stopsOf(springEasing({ duration: 0.5, bounce }).easing))
  assert.equal(peak(0), 1)
  assert.equal(peak(-0.3), 1)
  assert.ok(peak(0.15) > 1)
  assert.ok(peak(0.3) > peak(0.15))
})

test('the easing runs from 0 to 1 for as long as the spring takes to settle', () => {
  for (const spring of Object.values(SPRINGS)) {
    const { easing, seconds } = springEasing(spring)
    const stops = stopsOf(easing)
    assert.equal(stops[0], 0)
    assert.equal(stops.at(-1), 1)
    assert.ok(stops.every(Number.isFinite))
    assert.ok(seconds >= spring.duration && seconds < 3, `${seconds}s for ${JSON.stringify(spring)}`)
    assert.equal(seconds, Number(settleTime(springPhysics(spring)).toFixed(4)))
  }
})

test('a fling carries into the spring: a faster start gets further in the first frames', () => {
  const early = velocity => stopsOf(springEasing({ duration: 0.8, bounce: 0.2, velocity }).easing)[1]
  assert.ok(early(10) > early(4))
  assert.ok(early(4) > early(0))
})

test('assets/css/springs.css is up to date with utils/spring.mjs', async () => {
  const css = await readFile(new URL('../../assets/css/springs.css', import.meta.url), 'utf8')
  assert.equal(css, springCss(), 'run `node scripts/build-springs.mjs`')
})
