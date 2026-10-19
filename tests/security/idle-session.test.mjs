// Signed-in sessions end after 1 hour without activity. The stored clock is readable and
// writable by anything on the page, so bad values must only ever end a session early.
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  IDLE_LIMIT_MS,
  LAST_ACTIVE_KEY,
  clearLastActive,
  isIdleExpired,
  parseLastActive,
  readLastActive,
  writeLastActive
} from '../../utils/idleSession.js'
import { PROTOTYPE_KEYS, JS_BREAKOUTS } from './payloads.mjs'

const NOW = Date.UTC(2026, 9, 17, 12)

beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  }
  clearLastActive()
})

test('the limit is one hour', () => assert.equal(IDLE_LIMIT_MS, 3_600_000))

test('expires at exactly one hour idle, not before', () => {
  assert.equal(isIdleExpired(NOW, NOW), false)
  assert.equal(isIdleExpired(NOW - IDLE_LIMIT_MS + 1, NOW), false)
  assert.equal(isIdleExpired(NOW - IDLE_LIMIT_MS, NOW), true)
  assert.equal(isIdleExpired(NOW - 4 * IDLE_LIMIT_MS, NOW), true)
})

test('missing, garbage or future times count as expired', () => {
  for (const value of [null, undefined, NaN, Infinity, -Infinity, NOW + 2 * 60 * 1000, NOW + IDLE_LIMIT_MS * 1000]) {
    assert.equal(isIdleExpired(value, NOW), true, String(value))
  }
  for (const raw of ['', 'abc', '1e20', '-5', '12.5', ' 123', '0x10', '9'.repeat(30), ...PROTOTYPE_KEYS, ...JS_BREAKOUTS, null, undefined]) {
    assert.equal(parseLastActive(raw), null, String(raw))
  }
})

test('activity resets the clock and is shared through storage', () => {
  writeLastActive(NOW - IDLE_LIMIT_MS + 60_000)
  assert.equal(isIdleExpired(readLastActive(), NOW), false)
  assert.equal(localStorage.getItem(LAST_ACTIVE_KEY), String(NOW - IDLE_LIMIT_MS + 60_000))

  // Another tab was active later
  localStorage.setItem(LAST_ACTIVE_KEY, String(NOW - 1000))
  assert.equal(readLastActive(), NOW - 1000)

  // A tampered value can only sign you out
  localStorage.setItem(LAST_ACTIVE_KEY, String(NOW + 10 * IDLE_LIMIT_MS))
  assert.equal(isIdleExpired(readLastActive(), NOW), true)
  localStorage.setItem(LAST_ACTIVE_KEY, '<script>')
  assert.equal(isIdleExpired(readLastActive(), NOW), true)

  clearLastActive()
  assert.equal(readLastActive(), null)
})

test('blocked storage falls back to this tab only', () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
    removeItem: () => {
      throw new Error('blocked')
    }
  }
  assert.doesNotThrow(() => writeLastActive(NOW))
  assert.equal(readLastActive(), NOW)
  clearLastActive()
  assert.equal(readLastActive(), null)
})
