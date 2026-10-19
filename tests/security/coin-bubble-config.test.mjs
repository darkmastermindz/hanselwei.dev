// config.toml [coin_bubble] is written into a generated module at build time
// (scripts/build-coin-bubble.mjs), and its text is shown as plain text on the home page. Only
// known settings with checked values get through; the text stays data, never code or markup.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COIN_BUBBLE_DEFAULTS, buildCoinBubbleConfig, coinBubbleModule } from '../../utils/coinBubble.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

test('unknown or hostile keys fail the build and never reach the module', () => {
  for (const key of [...PROTOTYPE_KEYS, ...JS_BREAKOUTS, 'url', 'html']) {
    const { config, problems } = buildCoinBubbleConfig({ coin_bubble: { [key]: 1 } })
    assert.ok(problems.length >= 1, key)
    assert.deepEqual(Object.keys(config).sort(), Object.keys(COIN_BUBBLE_DEFAULTS).sort())
  }
})

test('hostile enabled or until values are refused', () => {
  for (const payload of [...JS_BREAKOUTS, ...XSS_HTML]) {
    for (const key of ['enabled', 'until']) {
      const { config, problems } = buildCoinBubbleConfig({ coin_bubble: { [key]: payload } })
      assert.equal(problems.length, 1)
      assert.deepEqual(config, COIN_BUBBLE_DEFAULTS)
    }
  }
})

test('hostile text stays a string in the generated module: nothing runs', async () => {
  for (const payload of [...JS_BREAKOUTS, ...XSS_HTML]) {
    const { config, problems } = buildCoinBubbleConfig({ coin_bubble: { enabled: true, text: payload, until: '2026-10-20' } })
    if (problems.length) continue // too long: refused outright
    const loaded = await import(`data:text/javascript,${encodeURIComponent(coinBubbleModule(config))}`)
    assert.deepEqual(loaded.default, config)
    assert.equal(globalThis.pwned, undefined)
  }
})

test('a [coin_bubble] that is not a table fails the build', () => {
  for (const coin_bubble of ['on', 42, ['text']]) {
    const { config, problems } = buildCoinBubbleConfig({ coin_bubble })
    assert.equal(problems.length, 1)
    assert.deepEqual(config, COIN_BUBBLE_DEFAULTS)
  }
})
