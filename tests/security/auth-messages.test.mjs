// The sign-in menu shows only its own fixed messages; the callback sends one of two reasons
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { explainAuthError, NOT_INVITED, SIGN_IN_FAILED } from '../../utils/authMessages.js'
import { JS_BREAKOUTS, REDOS, XSS_HTML } from './payloads.mjs'

test('a denied sign-in explains the invite list', () => {
  assert.equal(explainAuthError('denied'), NOT_INVITED)
})

test('anything else shows the generic message, whatever the text', () => {
  const spoofs = ['failed', 'Your account is locked, call +1 555 0100', 'Visit https://evil.example to verify', ...XSS_HTML, ...JS_BREAKOUTS, REDOS, null, undefined, {}]
  for (const reason of spoofs) {
    assert.equal(explainAuthError(reason), SIGN_IN_FAILED, String(reason).slice(0, 60))
  }
})
