import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from 'smol-toml'
import { readFile } from 'node:fs/promises'
import { encode } from 'uqr'
import { COIN_BUBBLE_DEFAULTS, bubbleActive, bubbleParts, buildCoinBubbleConfig, calendarDay, dayIn, landsHeads } from '../../utils/coinBubble.mjs'
import { qrPath } from '../../utils/coinQr.mjs'

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
  assert.equal(config.link, 'https://2026.allthingsopen.org')
  assert.equal(config.qr, 'https://hanselwei.dev')
})

const EVENT = { enabled: true, text: 'Catch me at @AllThingsOpen in Raleigh!', until: '2027-10-26' }

test('the link fills {year} from until, and links its part of the text', () => {
  const { config, problems } = buildCoinBubbleConfig({
    coin_bubble: { ...EVENT, link: 'https://{year}.allthingsopen.org', link_text: '@AllThingsOpen' }
  })
  assert.deepEqual(problems, [])
  assert.equal(config.link, 'https://2027.allthingsopen.org')
  assert.deepEqual(bubbleParts(config), ['Catch me at ', '@AllThingsOpen', ' in Raleigh!'])
  assert.deepEqual(bubbleParts({ text: 'Hi' }), ['Hi', '', ''])
})

test('link settings are checked', () => {
  const bad = [
    { link: 'https://{year}.allthingsopen.org', link_text: '@AllThingsOpen', until: undefined },
    { link: 'http://allthingsopen.org', link_text: '@AllThingsOpen' },
    { link: 'https://allthingsopen.org', link_text: '@SomethingElse' },
    { link: 'https://allthingsopen.org' },
    { link_text: '@AllThingsOpen' },
    { qr: 'http://hanselwei.dev' },
    { qr: '/bio' }
  ]
  for (const extra of bad) {
    const coin_bubble = { ...EVENT, ...extra }
    for (const [k, v] of Object.entries(coin_bubble)) if (v === undefined) delete coin_bubble[k]
    assert.ok(buildCoinBubbleConfig({ coin_bubble }).problems.length >= 1, JSON.stringify(extra))
  }
})

test('the QR path draws exactly the dark modules of the code', () => {
  const { size, path } = qrPath('https://hanselwei.dev')
  const { data } = encode('https://hanselwei.dev', { ecc: 'M', border: 0 })
  assert.equal(size, data.length)
  assert.match(path, /^(M\d+ \d+h\d+v1h-\d+z)+$/)
  const drawn = [...path.matchAll(/h(\d+)v1/g)].reduce((sum, [, n]) => sum + Number(n), 0)
  assert.equal(drawn, data.flat().filter(Boolean).length)
})

test('settings are checked: off by default, text and date needed when on', () => {
  assert.deepEqual(buildCoinBubbleConfig({}), { config: COIN_BUBBLE_DEFAULTS, problems: [] })
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: false } }).problems.length, 0)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: true } }).problems.length, 1)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { enabled: true, text: 'Hi' } }).problems.length, 1)
  assert.equal(buildCoinBubbleConfig({ coin_bubble: { text: '  Hi\n  there ' } }).config.text, 'Hi there')
  for (const coin_bubble of [{ enabled: 'yes' }, { text: '' }, { text: 'x'.repeat(81) }, { text: 42 }, { until: '2026-02-30' }, { until: 'soon' }]) {
    assert.equal(buildCoinBubbleConfig({ coin_bubble }).problems.length, 1, JSON.stringify(coin_bubble))
  }
})
