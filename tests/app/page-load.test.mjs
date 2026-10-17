// A refresh resets the token stats and hides Sign in once; in-app page changes later in
// the same visit must not reset them again.
import { test } from 'node:test'
import assert from 'node:assert/strict'

const withNavigation = async (type, fn) => {
  const original = globalThis.performance.getEntriesByType
  globalThis.performance.getEntriesByType = kind => (kind === 'navigation' ? [{ type }] : [])
  try {
    // Fresh module per case: the once-per-key memory lives for one page load
    return await fn(await import(`../../utils/pageLoad.js?${type}-${Math.random()}`))
  } finally {
    globalThis.performance.getEntriesByType = original
  }
}

test('a refresh resets each thing once', () =>
  withNavigation('reload', ({ isReload, resetOnReload }) => {
    assert.equal(isReload(), true)
    assert.equal(resetOnReload('hanselwei:token'), true)
    assert.equal(resetOnReload('hanselwei:token'), false) // later in-app navigation
    assert.equal(resetOnReload('hanselwei:owner-gate'), true)
  }))

test('normal navigation, back/forward and redirects reset nothing', async () => {
  for (const type of ['navigate', 'back_forward', 'prerender']) {
    await withNavigation(type, ({ resetOnReload }) => assert.equal(resetOnReload('hanselwei:token'), false, type))
  }
})

test('no navigation timing (old browsers) resets nothing', async () => {
  const original = globalThis.performance.getEntriesByType
  globalThis.performance.getEntriesByType = () => {
    throw new Error('unsupported')
  }
  try {
    const { resetOnReload } = await import(`../../utils/pageLoad.js?broken-${Math.random()}`)
    assert.equal(resetOnReload('hanselwei:token'), false)
  } finally {
    globalThis.performance.getEntriesByType = original
  }
})
