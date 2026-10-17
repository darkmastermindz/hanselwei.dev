// The sign-in menu explains failed sign-ins using text from the URL; it must only ever
// show one of its own fixed messages.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { explainAuthError, NOT_INVITED, SIGN_IN_FAILED } from '../../utils/authMessages.js'
import { XSS_HTML, JS_BREAKOUTS, REDOS } from './payloads.mjs'

test('refusals read as not invited', () => {
  for (const reason of ['access_denied', '401 Unauthorized', '403', 'unauthorized_client Signups not allowed for this instance', 'Forbidden']) {
    assert.equal(explainAuthError(reason), NOT_INVITED, reason)
  }
})

test('attacker-supplied text is never shown', () => {
  const spoofs = ['Your account is locked, call +1 555 0100', 'Visit https://evil.example to verify', ...XSS_HTML, ...JS_BREAKOUTS, REDOS, null, undefined, {}]
  for (const reason of spoofs) {
    assert.ok([NOT_INVITED, SIGN_IN_FAILED].includes(explainAuthError(reason)), String(reason).slice(0, 60))
  }
})
