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
