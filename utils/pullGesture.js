// Maths for the in-app pull-down "hard refresh" (components/PullToRefresh.vue), kept
// pure so it can be unit tested.
export const PULL_THRESHOLD = 72 // indicator distance (px) at which releasing resets
export const PULL_MAX = 96
const RESISTANCE = 0.5
const DECIDE_PX = 8 // movement before we decide whether it's a pull or a scroll/swipe

// Places a pull must not start from: sideways-scrolling chip strips, the token (long press)
// and form fields
export const NO_PULL = '.chip-strip.is-scroll, .socials.is-lens, .token, input, textarea, select, [data-no-pull]'

export const canStartPull = (scrollY, target) => scrollY <= 0 && !target?.closest?.(NO_PULL)

// 'undecided' until the finger has moved a little; then 'pull' only for a clearly
// downward drag, 'ignore' for sideways swipes and upward scrolls
export const pullIntent = (dx, dy) => {
  if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return 'undecided'
  return dy > 0 && dy > Math.abs(dx) * 1.5 ? 'pull' : 'ignore'
}

export const pullDistance = dy => Math.min(PULL_MAX, Math.max(0, dy * RESISTANCE))

export const isPullArmed = distance => distance >= PULL_THRESHOLD
