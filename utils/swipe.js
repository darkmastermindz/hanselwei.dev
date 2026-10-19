// Swiping sideways across the About card's XP view moves the year slider, like paging through
// the timeline: swipe left for later years, right for earlier ones (older years sit on the left).
export const SWIPE_START_PX = 14 // movement before deciding between a swipe and a scroll
export const SWIPE_STEP_PX = 48 // finger travel per year

// 'swipe' once the finger has clearly moved sideways, 'scroll' once it has clearly moved up or
// down (the page scrolls as usual), null while it's too early to tell
export const swipeIntent = (dx, dy) => {
  if (Math.hypot(dx, dy) < SWIPE_START_PX) return null
  return Math.abs(dx) > Math.abs(dy) * 1.2 ? 'swipe' : 'scroll'
}

// Years to move for a sideways travel of dx pixels (negative dx = left = later years)
export const swipeYears = dx => {
  const steps = Math.trunc(-dx / SWIPE_STEP_PX)
  return steps === 0 ? 0 : steps // never -0
}

// The mouse equivalent: a sideways wheel (trackpad two-finger swipe, tilt wheel, Shift+wheel)
// over the XP view. Returns the horizontal travel in pixels, or 0 when the wheel is mostly
// vertical, which is left to scroll the page. Positive = right = later years.
export const WHEEL_STEP_PX = 60 // wheel travel per year
const WHEEL_UNIT_PX = { 0: 1, 1: 16, 2: 400 } // deltaMode: pixels, lines, pages

export const wheelDx = ({ deltaX = 0, deltaY = 0, deltaMode = 0, shiftKey = false } = {}) => {
  const unit = WHEEL_UNIT_PX[deltaMode] ?? 1
  // Some browsers leave Shift+wheel vertical; it means sideways
  const dx = shiftKey && deltaX === 0 ? deltaY : deltaX
  const dy = shiftKey && deltaX === 0 ? 0 : deltaY
  if (Math.abs(dx) <= Math.abs(dy)) return 0
  return dx * unit
}
