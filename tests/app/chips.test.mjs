// Chips: tags read as hashtags, and every chip strip wraps naturally up to 3 rows on phones and
// 4 on wider screens, then scrolls sideways in balanced rows.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chipRows, hashtag, maxRowsFor, searchText, tagSearchText, wrappedRows } from '../../utils/chips.js'

test('tags read as hashtags, with no spaces and one "#"', () => {
  assert.equal(hashtag('vue'), '#vue')
  assert.equal(hashtag('First Aid'), '#FirstAid')
  assert.equal(hashtag('#already'), '#already')
  assert.equal(hashtag('##twice'), '#twice')
  assert.equal(hashtag('Rock Climbing  Gear'), '#RockClimbingGear')
  assert.equal(hashtag(''), '')
  assert.equal(hashtag(undefined), '')
})

test('a search ignores "#", so a hashtag finds its tag', () => {
  assert.equal(searchText('#climbing'), 'climbing')
  assert.equal(searchText('  #vue #nuxt '), 'vue  nuxt')
  assert.equal(searchText(undefined), '')
})

test('3 rows on phones, 4 on wider screens', () => {
  assert.equal(maxRowsFor(390), 3)
  assert.equal(maxRowsFor(639), 3)
  assert.equal(maxRowsFor(640), 4)
  assert.equal(maxRowsFor(1280), 4)
})

test('natural wrapping counts rows like text', () => {
  assert.equal(wrappedRows([], 300, 6), 0)
  assert.equal(wrappedRows([100, 100], 300, 6), 1)
  assert.equal(wrappedRows([100, 100, 100], 300, 6), 2) // 100 + 6 + 100 + 6 + 100 > 300
  assert.equal(wrappedRows([500], 300, 6), 1) // one chip wider than the strip still takes one row
})

test('a short list just wraps', () => {
  assert.deepEqual(chipRows([80, 90, 70, 60], 360, 6, 3), { mode: 'wrap' })
  assert.deepEqual(chipRows([], 360, 6, 3), { mode: 'wrap' })
  assert.deepEqual(chipRows([80, 90], 0, 6, 3), { mode: 'wrap' }) // not measured yet
})

test('a long list becomes balanced rows that scroll, keeping every chip in order', () => {
  const widths = Array.from({ length: 40 }, (_, i) => 60 + ((i * 37) % 70))
  for (const maxRows of [3, 4]) {
    const layout = chipRows(widths, 360, 6, maxRows)
    assert.equal(layout.mode, 'scroll')
    assert.equal(layout.rows.length, maxRows)
    assert.deepEqual(layout.rows.flat(), widths.map((_, i) => i))
    const rowWidths = layout.rows.map(row => row.reduce((sum, i) => sum + widths[i] + 6, 0))
    const widest = Math.max(...rowWidths)
    assert.ok(rowWidths.every(width => width > widest * 0.7), `balanced: ${rowWidths}`)
  }
})

test('rows are never empty', () => {
  const layout = chipRows([400, 400, 400, 400, 400], 300, 6, 4)
  assert.equal(layout.mode, 'scroll')
  assert.ok(layout.rows.every(row => row.length > 0))
  assert.deepEqual(layout.rows.flat(), [0, 1, 2, 3, 4])
})

test('tags are searchable by the hashtag a chip shows', () => {
  const text = tagSearchText(['Crash Pad', 'vue']).toLowerCase()
  assert.ok(text.includes(searchText('#CrashPad').toLowerCase()))
  assert.ok(text.includes('crash pad'))
  assert.ok(text.includes(searchText('#vue')))
  assert.equal(tagSearchText(undefined), '')
})
