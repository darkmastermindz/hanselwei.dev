// While a press on the About card switches its text, the social links below jump under the
// finger; they stay paused until a moment after the press ends.
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createLock, RELEASE_GRACE_MS } from '../../utils/socialsLock.js'

const tracked = () => {
  const changes = []
  return { changes, lock: createLock(value => changes.push(value)) }
}

test('stays locked for as long as the press lasts', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { changes, lock } = tracked()
    lock.lock()
    mock.timers.tick(60000)
    assert.equal(lock.isLocked(), true)
    assert.deepEqual(changes, [true])
  } finally {
    mock.timers.reset()
  }
})

test('unlocks only once the grace period after the release is over', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { changes, lock } = tracked()
    lock.lock()
    lock.release()
    mock.timers.tick(RELEASE_GRACE_MS - 1)
    assert.equal(lock.isLocked(), true)
    mock.timers.tick(1)
    assert.equal(lock.isLocked(), false)
    assert.deepEqual(changes, [true, false])
  } finally {
    mock.timers.reset()
  }
})

test('a new switch during the grace period keeps it locked', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { changes, lock } = tracked()
    lock.lock()
    lock.release()
    mock.timers.tick(RELEASE_GRACE_MS / 2)
    lock.lock()
    mock.timers.tick(RELEASE_GRACE_MS * 2)
    assert.equal(lock.isLocked(), true)
    lock.release()
    mock.timers.tick(RELEASE_GRACE_MS)
    assert.equal(lock.isLocked(), false)
    assert.deepEqual(changes, [true, false])
  } finally {
    mock.timers.reset()
  }
})

test('releasing without a lock does nothing', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { changes, lock } = tracked()
    lock.release()
    mock.timers.tick(RELEASE_GRACE_MS * 2)
    assert.deepEqual(changes, [])
  } finally {
    mock.timers.reset()
  }
})

test('unlock is immediate and drops a pending unlock', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { changes, lock } = tracked()
    lock.lock()
    lock.release()
    lock.unlock()
    assert.equal(lock.isLocked(), false)
    lock.lock() // a new pause right after must not be undone by the old timer
    mock.timers.tick(RELEASE_GRACE_MS * 2)
    assert.equal(lock.isLocked(), true)
    assert.deepEqual(changes, [true, false, true])
  } finally {
    mock.timers.reset()
  }
})

test('unlocking without a lock reports no change', () => {
  const { changes, lock } = tracked()
  lock.unlock()
  assert.deepEqual(changes, [])
})
