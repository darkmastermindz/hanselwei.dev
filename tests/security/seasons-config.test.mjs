// config.toml [seasons] is written into a generated module at build time
// (scripts/build-seasons.mjs). Its emoji are shown as page text and its colours are bound into
// the background's SVG gradient. Only known settings with checked values get through.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSeasonsConfig, seasonsModule, SEASONS_DEFAULTS } from '../../utils/seasons.mjs'
import { HOSTILE_COLORS, JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

const week = (theme = {}) => ({ from: '01-01', name: 'Snow', emoji: ['❄️'], colors: ['#93c5fd', '#e0f2fe'], ...theme })
const build = (seasons) => buildSeasonsConfig({ seasons: { enabled: true, ...seasons } })

test('unknown or hostile keys fail the build and never reach the module', () => {
  for (const key of [...PROTOTYPE_KEYS, ...JS_BREAKOUTS, 'html', 'script']) {
    const { config, problems } = buildSeasonsConfig({ seasons: { [key]: 1 } })
    assert.ok(problems.length >= 1, key)
    assert.deepEqual(Object.keys(config).sort(), Object.keys(SEASONS_DEFAULTS).sort())
    const nested = build({ week: [week({ [key]: 1 })] })
    assert.ok(nested.problems.length >= 1, key)
    assert.ok(!Object.hasOwn(nested.config.weeks[0] ?? {}, key), key)
  }
})

test('hostile colours are refused', () => {
  for (const color of [...HOSTILE_COLORS, ...XSS_HTML, ...JS_BREAKOUTS]) {
    const { config, problems } = build({ week: [week({ colors: [color, '#ffffff'] })] })
    assert.ok(problems.length >= 1, color)
    assert.equal(config.weeks.length, 0, color)
  }
})

test('markup, scripts and words are refused as emoji', () => {
  for (const emoji of [...XSS_HTML, ...JS_BREAKOUTS, 'abc', '"', '&lt;', ' ', '', 42, null]) {
    const { config, problems } = build({ week: [week({ emoji: [emoji] })] })
    assert.ok(problems.length >= 1, JSON.stringify(emoji))
    assert.equal(config.weeks.length, 0)
  }
})

test('markup is refused as a name, and dates must be real days', () => {
  for (const name of [...XSS_HTML, '', 'x'.repeat(41)]) {
    assert.ok(build({ week: [week({ name })] }).problems.length >= 1, name)
  }
  for (const from of ['02-29', '13-01', '1-1', '01-01; x', '__proto__', 20260101]) {
    assert.ok(build({ week: [week({ from })] }).problems.length >= 1, String(from))
  }
  for (const [from, to] of [['2026-10-21', '2026-10-19'], ['2026-02-30', '2026-03-01'], ['x', 'y']]) {
    const event = { name: 'Event', from, to, emoji: ['⭐'], colors: ['#ffffff', '#000000'] }
    assert.ok(build({ week: [week()], event: [event] }).problems.length >= 1, `${from} ${to}`)
  }
})

test('hostile names stay strings in the generated module: nothing runs', async () => {
  for (const payload of JS_BREAKOUTS.filter(p => !/[<>]/.test(p))) {
    const { config, problems } = build({ week: [week({ name: payload })] })
    assert.deepEqual(problems, [])
    const mod = await import(`data:text/javascript,${encodeURIComponent(seasonsModule(config))}`)
    assert.equal(mod.default.weeks[0].name, payload)
    assert.equal(globalThis.pwned, undefined)
  }
})

test('[seasons.spooky] takes only from and to, as plain times', () => {
  for (const key of [...PROTOTYPE_KEYS, ...JS_BREAKOUTS, 'shape', 'mask']) {
    const { config, problems } = build({ week: [week()], spooky: { from: '10-30 12:00', to: '10-31 23:59', [key]: 1 } })
    assert.ok(problems.length >= 1, key)
    assert.ok(!Object.hasOwn(config.spooky ?? {}, key), key)
  }
  for (const value of [...XSS_HTML, ...JS_BREAKOUTS, ...HOSTILE_COLORS]) {
    for (const spooky of [{ from: value, to: '10-31 23:59' }, { from: '10-30 12:00', to: value }]) {
      const { config, problems } = build({ week: [week()], spooky })
      assert.ok(problems.length >= 1, value)
      assert.equal(config.spooky, null, value)
    }
  }
})
