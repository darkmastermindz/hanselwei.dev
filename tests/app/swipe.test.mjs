// Sideways swipes on the XP view move the year slider; vertical movement stays a page scroll.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SWIPE_START_PX, SWIPE_STEP_PX, swipeIntent, swipeYears } from '../../utils/swipe.js'

test('small movements are undecided, so taps and holds still work', () => {
  assert.equal(swipeIntent(0, 0), null)
  assert.equal(swipeIntent(SWIPE_START_PX - 1, 0), null)
  assert.equal(swipeIntent(5, 5), null)
})

test('a clearly sideways movement is a swipe, anything steeper is a scroll', () => {
  assert.equal(swipeIntent(30, 0), 'swipe')
  assert.equal(swipeIntent(-30, 10), 'swipe')
  assert.equal(swipeIntent(0, 30), 'scroll')
  assert.equal(swipeIntent(20, 20), 'scroll') // diagonal: leave it to the page
  assert.equal(swipeIntent(-10, -40), 'scroll')
})

test('swiping left moves to later years, right to earlier ones, one per step of travel', () => {
  assert.equal(swipeYears(0), 0)
  assert.equal(swipeYears(-(SWIPE_STEP_PX - 1)), 0)
  assert.equal(swipeYears(-SWIPE_STEP_PX), 1)
  assert.equal(swipeYears(-SWIPE_STEP_PX * 3.5), 3)
  assert.equal(swipeYears(SWIPE_STEP_PX), -1)
  assert.equal(swipeYears(SWIPE_STEP_PX * 2), -2)
  assert.ok(Object.is(swipeYears(10), 0))
})
