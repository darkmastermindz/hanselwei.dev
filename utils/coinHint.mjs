// The home page coin's "you can tap me" nudge (components/Bitmoji.vue): a small tilt to the left,
// across to the right, and home again on SwiftUI's .smooth spring, the same spring the coin's reset
// uses. It plays once a visit, after the intro, and again whenever the coin has been left alone for
// a while, waiting twice as long each time until it's touched. The coin turns by --spin, so its
// lighting follows the tilt like any other turn.

export const HINT_FIRST_MS = 1200 // after the intro flip, on the first visit to the page
export const HINT_IDLE_MS = 12000 // untouched this long before the first idle nudge
export const HINT_MAX_IDLE_MS = 120000 // the longest it waits between nudges

// Each nudge waits twice as long as the last, up to the cap
export const nextHintWait = wait => Math.min(wait * 2, HINT_MAX_IDLE_MS)

// The steps of a nudge from a coin at rest at `rest` degrees: when each starts (ms from the
// start), the angle it turns to, and the transition timing to get there. Small tilts only (the
// other face never shows), and it ends exactly where it started.
export const hintSteps = rest => [
  { at: 0, angle: rest - 12, timing: '0.32s cubic-bezier(0.37, 0, 0.63, 1)' },
  { at: 320, angle: rest + 10, timing: '0.46s cubic-bezier(0.37, 0, 0.63, 1)' },
  { at: 780, angle: rest, timing: 'var(--spring-smooth-duration) var(--spring-smooth)' }
]

// How long a nudge keeps the coin busy: the last step's start plus the .smooth spring settling
export const HINT_BUSY_MS = 780 + 750
