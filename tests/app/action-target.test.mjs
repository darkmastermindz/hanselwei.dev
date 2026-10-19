// The About card's plain English stays through scrolls and background taps; only a click on
// something that acts (a link, a button...) flips it back to JSON.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACTION_TARGETS, isActionTarget } from '../../utils/actionTarget.js'

// A stand-in element: `closest` finds a match when the element (or an ancestor) is an action
const element = isAction => ({ closest: selector => (selector === ACTION_TARGETS && isAction ? {} : null) })

test('links, buttons and other controls count as an action', () => {
  assert.equal(isActionTarget(element(true)), true)
})

test('the background, plain text and non-elements do not', () => {
  assert.equal(isActionTarget(element(false)), false)
  assert.equal(isActionTarget(null), false)
  assert.equal(isActionTarget(undefined), false)
  assert.equal(isActionTarget({}), false) // e.g. a text node or the document: no closest()
})

test('the selector covers the controls on the site', () => {
  for (const part of ['a[href]', 'button', 'input', '[role="button"]', '[role="tab"]']) {
    assert.ok(ACTION_TARGETS.includes(part), part)
  }
  assert.ok(!ACTION_TARGETS.includes('div'))
})
