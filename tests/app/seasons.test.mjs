// Seasonal themes (config.toml [seasons]): a theme for every week of the year, dated events
// taking over while they run, and the drifting emoji's layout.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildSeasonsConfig, monthDay, particleLayout, themeFor } from '../../utils/seasons.mjs'

const toml = parse(await readFile(new URL('../../config.toml', import.meta.url), 'utf8'))
const { config, problems } = buildSeasonsConfig(toml)

test("the site's config.toml [seasons] builds", () => {
  assert.deepEqual(problems, [])
  assert.equal(config.weeks.length, 52)
})

test('every day of the year has a theme, leap days included', () => {
  for (const year of [2026, 2028]) {
    for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.toISOString().slice(0, 10)
      assert.ok(themeFor(config, day), day)
    }
  }
  assert.equal(themeFor(config, '2028-02-29'), themeFor(config, '2028-02-28'))
})

test('October is spooky, and All Things Open takes over during the event', () => {
  assert.match(themeFor(config, '2026-10-31').name, /Halloween/)
  assert.ok(themeFor(config, '2026-10-31').emoji.includes('🎃'))
  assert.match(themeFor(config, '2026-10-16').name, /Spooky/)
  for (const day of ['2026-10-19', '2026-10-20', '2026-10-21']) assert.equal(themeFor(config, day).name, 'All Things Open')
  assert.notEqual(themeFor(config, '2026-10-22').name, 'All Things Open')
  assert.notEqual(themeFor(config, '2027-10-20').name, 'All Things Open') // dated: one year only
})

test('GitHub Universe takes over Oct 28–30, 2026, and Halloween is still Halloween', () => {
  for (const day of ['2026-10-28', '2026-10-29', '2026-10-30']) {
    const theme = themeFor(config, day)
    assert.equal(theme.name, 'GitHub Universe', day)
    assert.ok(theme.emoji.includes('🐙'))
    assert.deepEqual(theme.colors, ['#a371f7', '#3fb950'])
  }
  assert.notEqual(themeFor(config, '2026-10-27').name, 'GitHub Universe')
  assert.match(themeFor(config, '2026-10-31').name, /Halloween/)
  assert.notEqual(themeFor(config, '2027-10-29').name, 'GitHub Universe') // dated: one year only
})

test('a few holidays land in their week', () => {
  assert.match(themeFor(config, '2026-01-01').name, /New Year/)
  assert.match(themeFor(config, '2026-02-14').name, /Valentine/)
  assert.match(themeFor(config, '2026-03-17').name, /Patrick/)
  assert.match(themeFor(config, '2026-07-04').name, /Fourth of July/)
  assert.match(themeFor(config, '2026-12-25').name, /Holidays/)
  assert.match(themeFor(config, '2026-12-31').name, /New Year's Eve/)
})

test('weeks must start on Jan 1 and run in order', () => {
  const week = from => ({ from, name: 'x', emoji: ['⭐'], colors: ['#ffffff', '#000000'] })
  assert.ok(buildSeasonsConfig({ seasons: { week: [week('01-08')] } }).problems.length)
  assert.ok(buildSeasonsConfig({ seasons: { week: [week('01-01'), week('03-01'), week('02-01')] } }).problems.length)
  assert.deepEqual(buildSeasonsConfig({ seasons: { enabled: true, week: [week('01-01'), week('06-01')] } }).problems, [])
})

test('off, or no date, means no theme', () => {
  assert.equal(themeFor({ ...config, enabled: false }, '2026-10-31'), null)
  assert.equal(themeFor(config, undefined), null)
  assert.equal(monthDay('02-29'), null)
  assert.equal(monthDay('12-31'), '12-31')
})

test('particles cycle through the emoji and stay on screen', () => {
  const theme = themeFor(config, '2026-10-31')
  const values = [0, 0.5, 0.999]
  let i = 0
  const layout = particleLayout(theme, 12, () => values[i++ % values.length])
  assert.equal(layout.length, 12)
  assert.deepEqual(layout.slice(0, theme.emoji.length).map(p => p.emoji), theme.emoji)
  for (const p of layout) {
    assert.ok(p.x >= 0 && p.x <= 100)
    assert.ok(p.duration >= 14 && p.duration <= 28)
    assert.ok(p.delay <= 0 && -p.delay <= p.duration)
  }
  assert.deepEqual(particleLayout(null, 12), [])
})
