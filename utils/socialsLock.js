// Pauses the home page's social links while a press on the About card switches its text: the
// card changes height, so the links jump under the finger. Locked from the switch until a
// moment after the press ends (release: RELEASE_GRACE_MS later), or, on touch, until the visitor
// moves on (unlock), so neither the release nor a quick next tap opens a link by accident.
// `onChange(locked)` reports every change.
export const RELEASE_GRACE_MS = 1000

export const createLock = (onChange, graceMs = RELEASE_GRACE_MS) => {
  let locked = false
  let timer = null
  const set = value => {
    if (locked === value) return
    locked = value
    onChange(value)
  }
  return {
    // Locked until release() (a new lock cancels a pending unlock)
    lock() {
      clearTimeout(timer)
      timer = null
      set(true)
    },
    // Unlock once the grace period is over
    release() {
      if (!locked) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        set(false)
      }, graceMs)
    },
    // Unlock now (and drop any pending unlock)
    unlock() {
      clearTimeout(timer)
      timer = null
      set(false)
    },
    isLocked: () => locked
  }
}
