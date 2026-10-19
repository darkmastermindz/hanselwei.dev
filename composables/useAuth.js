// Site sign-in with GitHub, owner only. The server decides who gets a session: a signed,
// HTTP-only cookie set by /api/auth/github/callback and checked by /api/me. This
// composable reflects that result and keeps the shared 1-hour idle clock
// (utils/idleSession.js), renewing the session while the owner is active.
import { explainAuthError, IDLE_SIGNED_OUT, SESSION_ENDED } from '~/utils/authMessages.js'
import { clearLastActive, isIdleExpired, LAST_ACTIVE_KEY, readLastActive, writeLastActive } from '~/utils/idleSession.js'

const PROVIDERS = [{ id: 'github', label: 'GitHub' }]
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'wheel']
const CHECK_EVERY_MS = 60 * 1000
const RECORD_EVERY_MS = 60 * 1000 // at most one write and one renewal a minute

let started = null
let lastRecorded = 0

export const useAuth = () => {
  const user = useState('auth:user', () => null)
  const status = useState('auth:status', () => 'idle') // idle | ready | unavailable
  const error = useState('auth:error', () => '')
  const notice = useState('auth:notice', () => '')

  const endSession = async () => {
    clearLastActive()
    user.value = null
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
  }

  // Idle sign-out: checked on the shared clock every minute, when the tab comes back, and
  // before counting new activity
  const expireIfIdle = async () => {
    if (!user.value || !isIdleExpired(readLastActive())) return false
    await endSession()
    notice.value = IDLE_SIGNED_OUT
    return true
  }

  const renew = async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      if (res.status === 401) {
        // The server ended the session (expired or revoked)
        clearLastActive()
        user.value = null
        notice.value = SESSION_ENDED
      }
    } catch {}
  }

  const recordActivity = async () => {
    if (!user.value || Date.now() - lastRecorded < RECORD_EVERY_MS) return
    if (await expireIfIdle()) return
    lastRecorded = Date.now()
    writeLastActive(lastRecorded)
    renew()
  }

  const watchIdle = () => {
    for (const type of ACTIVITY_EVENTS) addEventListener(type, recordActivity, { passive: true, capture: true })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') expireIfIdle().then(expired => expired || recordActivity())
    })
    // Another tab signed out (or expired): follow it
    addEventListener('storage', event => {
      if (event.key === LAST_ACTIVE_KEY && event.newValue === null) expireIfIdle()
    })
    setInterval(expireIfIdle, CHECK_EVERY_MS)
  }

  // Sign-ins from before the GitHub sign-in (Netlify Identity) leave these behind
  const removeLegacySession = () => {
    try {
      localStorage.removeItem('gotrue.user')
      document.cookie = 'nf_jwt=; Path=/; Max-Age=0; Secure; SameSite=Lax'
    } catch {}
  }

  // `landingHash` is the URL hash as the page loaded; `clearHash` removes it from the URL
  // (see plugins/auth.client.js)
  const start = ({ landingHash = '', clearHash = () => {} } = {}) => {
    if (import.meta.server) return Promise.resolve()
    started ??= (async () => {
      removeLegacySession()
      const landing = new URLSearchParams(landingHash.slice(1))
      if (landing.has('auth_error')) {
        error.value = explainAuthError(landing.get('auth_error'))
        clearHash()
      }

      try {
        const res = await fetch('/api/me', { headers: { accept: 'application/json' } })
        if (res.status === 503) throw new Error('sign-in not configured')
        const data = res.status === 200 ? await res.json() : null
        user.value = data?.owner ? { email: data.email, name: data.name } : null
        status.value = 'ready'

        if (user.value) {
          // First load after signing in: the idle clock starts now
          if (readLastActive() === null) writeLastActive()
          lastRecorded = Date.now()
          await expireIfIdle()
        } else if (readLastActive() !== null && isIdleExpired(readLastActive())) {
          // The session ran out while the site was closed
          clearLastActive()
          notice.value = IDLE_SIGNED_OUT
        }
        watchIdle()
      } catch {
        // Sign-in isn't configured on this deploy (or the site is running without functions)
        status.value = 'unavailable'
      }
    })()
    return started
  }

  const signIn = provider => {
    if (!PROVIDERS.some(p => p.id === provider)) return
    error.value = ''
    notice.value = ''
    location.assign(`/api/auth/${provider}`)
  }

  const signOut = async () => {
    notice.value = ''
    await endSession()
  }

  return { user, providers: PROVIDERS, status, error, notice, start, signIn, signOut }
}
