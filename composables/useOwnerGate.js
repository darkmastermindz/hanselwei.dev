// The nav's Sign in stays hidden until a secret gesture on the home page token:
// hold it spinning for at least 3 seconds, let go, then tap it once.
// Remembered for this browser tab (sessionStorage), so an SSO redirect back to the
// site still shows it.
const HOLD_MS = 3000 // a long spin arms the gesture...
const TAP_MS = 400 // ...and a quick tap after it (within TAP_WINDOW_MS) completes it
const TAP_WINDOW_MS = 6000
const KEY = 'hanselwei:owner-gate'

const remembered = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export const useOwnerGate = () => {
  const revealed = useState('owner-gate:revealed', () => false)
  let armedAt = 0

  // Call with each token release: (spins, heldMs)
  const onTokenRelease = (spins, heldMs = 0) => {
    if (revealed.value) return
    if (heldMs >= HOLD_MS) {
      armedAt = performance.now()
      return
    }
    const tapped = heldMs < TAP_MS && armedAt && performance.now() - armedAt < TAP_WINDOW_MS
    armedAt = 0
    if (!tapped) return
    revealed.value = true
    navigator.vibrate?.([15, 60, 15])
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {}
  }

  const restore = () => {
    if (remembered()) revealed.value = true
  }

  return { revealed, onTokenRelease, restore }
}
