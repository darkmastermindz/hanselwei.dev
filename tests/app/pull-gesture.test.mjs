// The pull-down hard refresh must only fire for a deliberate downward pull from the top
// of the page, never for scrolling, sideways swipes or the token's long press.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canStartPull, isPullArmed, NO_PULL, pullDistance, pullIntent, PULL_MAX, PULL_THRESHOLD } from '../../utils/pullGesture.js'

const target = matches => ({ closest: selector => (selector === NO_PULL && matches ? {} : null) })

test('only starts at the top of the page, away from sideways strips and the token', () => {
  assert.equal(canStartPull(0, target(false)), true)
  assert.equal(canStartPull(1, target(false)), false)
  assert.equal(canStartPull(250, target(false)), false)
  assert.equal(canStartPull(0, target(true)), false)
  assert.equal(canStartPull(0, null), true) // e.g. the document itself
})

test('only starts between the nav bar and the name, around the coin', () => {
  const zone = { top: 80, bottom: 300 }
  assert.equal(canStartPull(0, target(false), 120, zone), true)
  assert.equal(canStartPull(0, target(false), 80, zone), true)
  assert.equal(canStartPull(0, target(false), 300, zone), true)
  assert.equal(canStartPull(0, target(false), 40, zone), false) // on the nav bar
  assert.equal(canStartPull(0, target(false), 301, zone), false) // below the name: reading, not resetting
  assert.equal(canStartPull(0, target(false), 10, { top: Infinity, bottom: -Infinity }), false) // no zone on the page: never
})

test('decides pull vs scroll vs swipe', () => {
  assert.equal(pullIntent(2, 3), 'undecided')
  assert.equal(pullIntent(0, 20), 'pull')
  assert.equal(pullIntent(5, 30), 'pull')
  assert.equal(pullIntent(30, 30), 'ignore') // diagonal
  assert.equal(pullIntent(40, 5), 'ignore') // sideways swipe
  assert.equal(pullIntent(0, -20), 'ignore') // scrolling down the page
})

test('needs a real pull, with resistance and a cap', () => {
  assert.equal(pullDistance(-50), 0)
  assert.equal(pullDistance(40), 20)
  assert.equal(isPullArmed(pullDistance(40)), false) // short tug does nothing
  assert.equal(isPullArmed(pullDistance(2 * PULL_THRESHOLD)), true)
  assert.equal(pullDistance(1000), PULL_MAX)
})
