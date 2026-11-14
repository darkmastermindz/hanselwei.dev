// Slide to unlock (components/SwipeToUnlock.vue): how far along the knob is, from 0 to 1, and how
// far it must get before letting go unlocks rather than springing back.
export const UNLOCK_AT = 0.9

export const unlockProgress = (x, travel) => (travel > 0 ? Math.max(0, Math.min(1, x / travel)) : 0)
