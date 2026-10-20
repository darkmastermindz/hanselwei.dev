// A game controller drives the same navigation as the keyboard: D-pad or left stick to move,
// A to activate, B to go back, bumpers for tabs / years, right stick to scroll.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buttonsDown, isController, padActivity, padSnapshot, pressesFor, REPEAT_DELAY_MS, REPEAT_EVERY_MS, stickScroll } from '../../utils/gamepad.js'

const pad = ({ down = [], axes = [0, 0, 0, 0] } = {}) => ({
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i), value: down.includes(i) ? 1 : 0 })),
  axes,
  mapping: 'standard'
})

test('buttons map to intents on the standard layout', () => {
  assert.deepEqual([...buttonsDown(pad({ down: [0] }))], ['activate'])
  assert.deepEqual([...buttonsDown(pad({ down: [1] }))], ['back'])
  assert.deepEqual([...buttonsDown(pad({ down: [4, 5] }))].sort(), ['next', 'prev'])
  assert.deepEqual([...buttonsDown(pad({ down: [12, 15] }))].sort(), ['right', 'up'])
  assert.deepEqual([...buttonsDown(pad({ down: [2, 3, 9] }))], []) // unused buttons
  assert.deepEqual([...buttonsDown(null)], [])
})

test('the left stick counts as a D-pad once it leans past the deadzone', () => {
  assert.deepEqual([...buttonsDown(pad({ axes: [0.9, 0.1] }))], ['right'])
  assert.deepEqual([...buttonsDown(pad({ axes: [-0.2, -0.8] }))], ['up'])
  assert.deepEqual([...buttonsDown(pad({ axes: [0.3, -0.3] }))], []) // drift
})

test('a press fires once, then a held direction repeats after the delay', () => {
  let state = new Map()
  const step = (held, now) => {
    const result = pressesFor(state, new Set(held), now)
    state = result.state
    return result
  }
  assert.deepEqual(step(['down'], 0).fired, ['down'])
  assert.deepEqual(step(['down'], 100).fired, [])
  assert.deepEqual(step(['down'], REPEAT_DELAY_MS - 1).fired, [])
  assert.deepEqual(step(['down'], REPEAT_DELAY_MS).fired, ['down'])
  assert.deepEqual(step(['down'], REPEAT_DELAY_MS + REPEAT_EVERY_MS - 1).fired, [])
  assert.deepEqual(step(['down'], REPEAT_DELAY_MS + REPEAT_EVERY_MS).fired, ['down'])
  // letting go reports the release, and the next press fires straight away
  assert.deepEqual(step([], 1000).released, ['down'])
  assert.deepEqual(step(['down'], 1010).fired, ['down'])
})

test('A and B never repeat while held', () => {
  let state = new Map()
  const fired = []
  for (let now = 0; now <= 2000; now += 50) {
    const result = pressesFor(state, new Set(['activate']), now)
    state = result.state
    fired.push(...result.fired)
  }
  assert.deepEqual(fired, ['activate'])
})

test('the right stick scrolls, faster the further it leans, ignoring drift', () => {
  assert.deepEqual(stickScroll(pad({ axes: [0, 0, 0, 0.1] })), { x: 0, y: 0 })
  const half = stickScroll(pad({ axes: [0, 0, 0, 0.6] })).y
  const full = stickScroll(pad({ axes: [0, 0, 0, 1] })).y
  assert.ok(half > 0 && full > half)
  assert.ok(stickScroll(pad({ axes: [0, 0, -1, 0] })).x < 0)
})

// Android lists fingerprint readers and sensor hubs as gamepads: no standard mapping, axes at ±1
test('hardware that only looks like a gamepad is not a controller', () => {
  assert.equal(isController(pad()), true)
  assert.equal(isController({ id: 'uinput-fpc', mapping: '', axes: [0, 0, 0, -1], buttons: [] }), false)
  for (const value of [null, undefined, {}, { mapping: 'xr-standard' }]) assert.equal(isController(value), false)
})

test('a controller does nothing until someone uses it', () => {
  const rest = padSnapshot(pad({ axes: [0, 0, 0, -1] })) // a stick resting at one end
  assert.equal(padActivity(pad({ axes: [0, 0, 0, -1] }), rest), false)
  assert.equal(padActivity(pad({ axes: [0.1, 0, 0, -0.8] }), rest), false) // drift
  assert.equal(padActivity(pad({ axes: [0, 0, 0, -1], down: [0] }), rest), true) // a button
  assert.equal(padActivity(pad({ axes: [0, 0, 0, 0] }), rest), true) // the stick moved
  assert.equal(padActivity(pad({ axes: [0, 0.9, 0, 0] }), padSnapshot(pad())), true)
  assert.equal(padActivity(null), false)
})

// Chromium on Android (Chrome, Samsung Internet) can give a fingerprint reader or sensor hub the
// standard mapping, so on a phone only a fresh button press wakes a pad
test('on a phone, sticks never wake a pad, and neither does a button stuck down', () => {
  const phantom = { ...pad({ axes: [0, 0, 0, 0], down: [3] }), id: 'uinput-fpc' }
  const asleep = padSnapshot(phantom)
  const phone = { sticks: false }
  assert.equal(padActivity({ ...phantom, axes: [0, 0, 0, -1] }, asleep, phone), false) // axis jumps to -1
  assert.equal(padActivity({ ...phantom, axes: [1, 1, 1, 1] }, asleep, phone), false)
  assert.equal(padActivity(phantom, asleep, phone), false) // button 3 was already down
  assert.equal(padActivity(pad({ down: [0] }), asleep, phone), true) // a real press of A
  assert.equal(padActivity({ ...phantom, axes: [0, 0, 0, -1] }, asleep), true) // desktops: sticks count
})
