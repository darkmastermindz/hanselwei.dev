// The contribution calendar is built from GitHub's response at build time; anything that
// doesn't look right is refused, so the page never renders hostile or broken data.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_CALENDAR, level, parseCalendar } from '../../utils/contributions.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, XSS_HTML } from '../security/payloads.mjs'

const day = (date, contributionCount) => ({ date, contributionCount })
const calendar = (weeks, totalContributions = 0) => ({ totalContributions, weeks: weeks.map(contributionDays => ({ contributionDays })) })

test('levels: none, then four buckets', () => {
  assert.deepEqual([0, 1, 3, 4, 6, 7, 9, 10, 50].map(level), [0, 1, 1, 2, 2, 3, 3, 4, 4])
})

test('a valid calendar becomes weeks of days with levels', () => {
  const parsed = parseCalendar(calendar([[day('2026-01-04', 0), day('2026-01-05', 7)], [day('2026-01-11', 12)]], 19))
  assert.equal(parsed.total, 19)
  assert.deepEqual(parsed.weeks[0][1], { date: '2026-01-05', count: 7, level: 3 })
  assert.equal(parsed.weeks[1][0].level, 4)
  assert.equal(parsed.weeks.length, 2)
})

test('an empty week list is a valid, empty calendar', () => {
  assert.deepEqual(parseCalendar(calendar([], 0)), { total: 0, weeks: [] })
  assert.deepEqual(EMPTY_CALENDAR, { total: 0, weeks: [] })
})

test('anything that does not look like a calendar is refused', () => {
  const bad = [
    null,
    undefined,
    'calendar',
    [],
    { weeks: 'nope', totalContributions: 1 },
    calendar([], -1),
    calendar([], 1.5),
    calendar([], '<script>'),
    { totalContributions: 1, weeks: [{ contributionDays: 'x' }] },
    calendar([[day('2026-01-01', -1)]]),
    calendar([[day('2026-01-01', 1e9)]]),
    calendar([[day('2026-01-01', 'x')]]),
    calendar([[day('2026-1-1', 1)]]),
    calendar([[day('../../etc', 1)]]),
    calendar([Array.from({ length: 8 }, (_, i) => day(`2026-01-0${i + 1}`, 1))])
  ]
  for (const raw of bad) assert.equal(parseCalendar(raw), null, JSON.stringify(raw)?.slice(0, 60))
  for (const text of [...XSS_HTML, ...JS_BREAKOUTS, ...PROTOTYPE_KEYS]) {
    assert.equal(parseCalendar(calendar([[day(text, 1)]])), null, text.slice(0, 40))
  }
})

test('only the fields we read are kept', () => {
  const parsed = parseCalendar({ totalContributions: 1, weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 1, color: '#fff', extra: 'x' }] }] })
  assert.deepEqual(Object.keys(parsed.weeks[0][0]).sort(), ['count', 'date', 'level'])
})
