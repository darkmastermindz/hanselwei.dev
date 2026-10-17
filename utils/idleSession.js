// Signs the owner out after an hour without activity. The last-activity time lives in
// localStorage so every open tab shares one clock: activity in any tab counts.
export const IDLE_LIMIT_MS = 60 * 60 * 1000
export const LAST_ACTIVE_KEY = 'hanselwei:auth-last-active'
// Tabs on one device share a clock; this only absorbs write races between them
const CLOCK_SLACK_MS = 60 * 1000

// Missing, unreadable or future times count as expired, so a tampered or stale value
// can only ever sign you out, never keep you signed in
export const isIdleExpired = (lastActive, now = Date.now()) =>
  !Number.isFinite(lastActive) || lastActive > now + CLOCK_SLACK_MS || now - lastActive >= IDLE_LIMIT_MS

export const parseLastActive = raw => (typeof raw === 'string' && /^\d{1,15}$/.test(raw) ? Number(raw) : null)

// Storage can be blocked (private windows, site data off); fall back to this tab only
let memory = null
const storage = () => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export const readLastActive = () => {
  try {
    const raw = storage()?.getItem(LAST_ACTIVE_KEY)
    if (raw != null) return parseLastActive(raw)
  } catch {}
  return memory
}

export const writeLastActive = (now = Date.now()) => {
  memory = now
  try {
    storage()?.setItem(LAST_ACTIVE_KEY, String(now))
  } catch {}
}

export const clearLastActive = () => {
  memory = null
  try {
    storage()?.removeItem(LAST_ACTIVE_KEY)
  } catch {}
}
