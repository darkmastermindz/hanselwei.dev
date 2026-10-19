// Arrow-key and D-pad navigation (plugins/navigation.client.js): from the focused control, pick
// the nearest one in the pressed direction. Pure so it can be unit tested; rects are
// { left, top, right, bottom } like getBoundingClientRect().
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

const centre = rect => ({ x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 })

// Candidates must lie past the current one in the direction. The score is the gap between the
// two along that direction plus the sideways offset between their centres (only a quarter of it
// for those sharing the column, which also get a head start), so moving down a column stays in
// the column, and otherwise the closest control wins. Left and right only move within the row.
export const pickNext = (from, candidates, direction) => {
  const vertical = direction === 'up' || direction === 'down'
  const sign = direction === 'down' || direction === 'right' ? 1 : -1
  const a = centre(from)
  let best = -1
  let bestScore = Infinity
  candidates.forEach((rect, i) => {
    const b = centre(rect)
    const along = vertical ? (b.y - a.y) * sign : (b.x - a.x) * sign
    // Its centre must be past the current one's edge, so a neighbour in the same row (a few
    // pixels lower) doesn't count as "down"
    const past = {
      down: b.y > from.bottom - 2,
      up: b.y < from.top + 2,
      right: b.x > from.right - 2,
      left: b.x < from.left + 2
    }[direction]
    if (along <= 0 || !past) return
    const gap = Math.max(0, {
      down: rect.top - from.bottom,
      up: from.top - rect.bottom,
      right: rect.left - from.right,
      left: from.left - rect.right
    }[direction])
    const across = vertical ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y)
    const overlaps = vertical
      ? rect.left < from.right && rect.right > from.left
      : rect.top < from.bottom && rect.bottom > from.top
    // Left and right stay within the row: no jumping up to the nav from a wide panel
    if (!vertical && !overlaps) return
    const score = overlaps ? gap + across / 4 - 1e6 : gap + across
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}
