import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from 'smol-toml'
import { readFile } from 'node:fs/promises'
import { bubbleActive, buildCoinBubbleConfig, calendarDay, dayIn, landsHeads } from '../../utils/coinBubble.mjs'

const ATO = { enabled: true, text: 'Catch me at @AllThingsOpen in Raleigh! 👋', until: '2026-10-20' }

test('the bubble shows through the last day of the event, in Raleigh time', () => {
  assert.equal(bubbleActive(ATO, new Date('2026-10-19T13:00:00Z')), true)
  // 11:59 pm on the 20th in Raleigh (EDT, UTC−4) is already the 21st in UTC
  assert.equal(bubbleActive(ATO, new Date('2026-10-21T03:59:00Z')), true)
  assert.equal(bubbleActive(ATO, new Date('2026-10-21T04:00:00Z')), false)
  assert.equal(bubbleActive(ATO, new Date('2027-10-19T13:00:00Z')), false)
})

test('turning it off, or leaving out the text or date, hides it', () => {
  const now = new Date('2026-10-19T13:00:00Z')
  assert.equal(bubbleActive({ ...ATO, enabled: false }, now), false)
  assert.equal(bubbleActive({ ...ATO, text: '' }, now), false)
  assert.equal(bubbleActive({ ...ATO, until: null }, now), false)
  assert.equal(bubbleActive(undefined, now), false)
})

test('dayIn gives the calendar day where the event is', () => {
  assert.equal(dayIn(new Date('2026-10-21T02:00:00Z')), '2026-10-20')
  assert.equal(dayIn(new Date('2026-10-21T02:00:00Z'), 'UTC'), '2026-10-21')
})

test('the coin is heads up at whole turns only', () => {
  for (const angle of [0, 360, 720, -360, 3600]) assert.equal(landsHeads(angle), true, angle)
  for (const angle of [180, 540, -180, 90, NaN, Infinity]) assert.equal(landsHeads(angle), false, angle)
})

test('dates come from TOML dates or strings, and must be real days', () => {
  assert.equal(calendarDay(parse('d = 2026-10-20').d), '2026-10-20')
  assert.equal(calendarDay('2026-10-20'), '2026-10-20')
  for (const bad of ['2026-02-30', '2026-13-01', '20 Oct 2026', '2026-10-20T00:00', '', 20261020, null, new Date('x')]) {
    assert.equal(calendarDay(bad), null, String(bad))
  }
})

test('config.toml [coin_bubble] builds', async () => {
  const { problems, config } = buildCoinBubbleConfig(parse(await readFile(new URL('../../config.toml', import.meta.url), 'utf8')))
  assert.deepEqual(problems, [])
  assert.match(config.text, /@AllThingsOpen/)
})

test('settings are checked: off by default, text and date needed when on', () => {
  assert.deepEqual(buildCoinBubbleConfig({}), { config: { enabled: false, text: '', until: null }, problems: [] })
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: false } }).problems.length, 0)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: true } }).problems.length, 1)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: true, text: 'Hi' } }).problems.length, 1)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { text: '  Hi\n  there ' } }).config.text, 'Hi there')
  for (const coin_bubble of [{ enabled: 'yes' }, { text: '' }, { text: 'x'.repeat(81) }, { text: 42 }, { until: '2026-02-30' }, { until: 'soon' }]) {
    assert.equal(buildCoinBubbleConfig({ coin_bubble }).problems.length, 1, JSON.stringify(coin_bubble))
  }
})
