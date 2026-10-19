// Chips across the site (components/ChipStrip.vue): hashtag labels for tags, and one row layout.
// Chips wrap naturally like text up to a row limit (3 on phones, 4 on wider screens); past it
// they are balanced into that many rows that scroll sideways. Pure, so it can be unit tested.

// A tag as a hashtag: "First Aid" -> "#FirstAid", "vue" -> "#vue" (display only; filters keep
// the raw tag)
export const hashtag = tag => {
  const word = String(tag ?? '').replace(/^#+/, '').replace(/\s+/g, '')
  return word ? `#${word}` : ''
}

// Searches ignore "#", so "#climbing" finds climbing
export const searchText = query => String(query ?? '').replace(/#/g, ' ').trim()

// Tags as search text, each also in its hashtag form ("Crash Pad crashpad"), so a search for
// the hashtag a chip shows ("#CrashPad") finds it
export const tagSearchText = tags => (Array.isArray(tags) ? tags.flatMap(tag => [tag, hashtag(tag).slice(1)]) : []).join(' ')

export const PHONE_MAX_WIDTH = 640
export const maxRowsFor = viewportWidth => (viewportWidth < PHONE_MAX_WIDTH ? 3 : 4)

// How many rows chips of these widths take when they simply wrap in a container this wide
export const wrappedRows = (widths, containerWidth, gap) => {
  let rows = 0
  let x = 0
  for (const width of widths) {
    if (rows === 0 || (x > 0 && x + gap + width > containerWidth)) {
      rows++
      x = width
    } else {
      x += gap + width
    }
  }
  return rows
}

// { mode: 'wrap' } when natural wrapping fits in maxRows rows; otherwise
// { mode: 'scroll', rows: [[index, ...], ...] }: the chips, in order, split into at most maxRows
// rows of about equal width
export const chipRows = (widths, containerWidth, gap, maxRows) => {
  if (!(containerWidth > 0) || wrappedRows(widths, containerWidth, gap) <= maxRows) return { mode: 'wrap' }
  const target = widths.reduce((sum, width) => sum + width + gap, 0) / maxRows
  const rows = [[]]
  let used = 0
  widths.forEach((width, index) => {
    if (used >= target && rows.length < maxRows) {
      rows.push([])
      used = 0
    }
    rows[rows.length - 1].push(index)
    used += width + gap
  })
  return { mode: 'scroll', rows }
}
