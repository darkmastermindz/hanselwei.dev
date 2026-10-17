// Site sign-in through Netlify Identity (@netlify/identity). Browser only: the
// static pages render signed out, then this picks up the session after load.
// Who may sign in is enforced on Netlify (invite-only + netlify/functions/identity.mjs);
// the nav only reflects the result.
// A session ends after an hour without activity in any tab (utils/idleSession.js).
import { explainAuthError, IDLE_SIGNED_OUT } from '~/utils/authMessages.js'
import { clearLastActive, isIdleExpired, LAST_ACTIVE_KEY, readLastActive, writeLastActive } from '~/utils/idleSession.js'

const PROVIDER_LABELS = { github: 'GitHub', google: 'Google', gitlab: 'GitLab', bitbucket: 'Bitbucket', facebook: 'Facebook' }
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'wheel']
const CHECK_EVERY_MS = 60 * 1000
const RECORD_EVERY_MS = 60 * 1000 // at most one localStorage write a minute

let identity = null
let started = null
let lastRecorded = 0

export const useAuth = () => {
  const user = useState('auth:user', () => null)
  const providers = useState('auth:providers', () => [])
  const status = useState('auth:status', () => 'idle') // idle | ready | unavailable
  const error = useState('auth:error', () => '')
  const notice = useState('auth:notice', () => '')

  const endSession = async () => {
    clearLastActive()
    user.value = null
    await identity?.logout().catch(() => {})
  }

  // Idle sign-out: record activity while signed in, and check the shared clock every
  // minute, when the tab comes back, and before counting any new activity
  const expireIfIdle = async () => {
    if (!user.value || !isIdleExpired(readLastActive())) return false
    await endSession()
    notice.value = IDLE_SIGNED_OUT
    return true
  }
  const recordActivity = async () => {
    if (!user.value || Date.now() - lastRecorded < RECORD_EVERY_MS) return
    if (await expireIfIdle()) return
    lastRecorded = Date.now()
    writeLastActive(lastRecorded)
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

  // `landingHash` is the URL hash as the page loaded (loading the library clears it);
  // `clearHash` removes it from the URL (see plugins/auth.client.js)
  const start = ({ landingHash = '', clearHash = () => {} } = {}) => {
    if (import.meta.server) return Promise.resolve()
    started ??= (async () => {
      // A refused SSO sign-in (not on the invite list) comes back with #error=... in
      // the URL, which handleAuthCallback() ignores: report it and tidy the URL
      const landing = new URLSearchParams(landingHash.slice(1))
      if (landing.has('error')) error.value = explainAuthError(`${landing.get('error')} ${landing.get('error_description') ?? ''}`)

      try {
        identity = await import('@netlify/identity')

        // Finishes OAuth redirects and invite/confirmation links (#..._token in the URL)
        const result = await identity.handleAuthCallback().catch(e => {
          error.value = explainAuthError(`${e.status ?? ''} ${e.message}`)
          return null
        })
        if (landing.has('error')) clearHash() // after the library has loaded and touched the URL

        if (result?.user) {
          // Just signed in: the idle clock starts now
          writeLastActive()
          user.value = result.user
        } else {
          // A stored session that sat idle for an hour ends before it's shown
          user.value = await identity.getUser()
          await expireIfIdle()
        }
        if (user.value) lastRecorded = Date.now()

        // Also covers a token refresh that fails: the library reports a sign-out
        identity.onAuthChange((event, next) => {
          if (!next) clearLastActive()
          else if (!user.value) writeLastActive()
          user.value = next
        })
        watchIdle()

        const settings = await identity.getSettings()
        // Single sign-on providers only ("email" is password sign-in, not SSO)
        providers.value = Object.entries(settings.providers ?? {})
          .filter(([id, on]) => on && Object.hasOwn(PROVIDER_LABELS, id))
          .map(([id]) => ({ id, label: PROVIDER_LABELS[id] }))
        status.value = 'ready'
      } catch {
        // Identity isn't enabled for this site/deploy yet (or this is `nuxt dev`)
        status.value = 'unavailable'
      }
    })()
    return started
  }

  const signIn = provider => {
    if (!Object.hasOwn(PROVIDER_LABELS, provider)) return
    error.value = ''
    notice.value = ''
    identity?.oauthLogin(provider) // navigates away
  }
  const signOut = async () => {
    notice.value = ''
    await endSession()
  }

  return { user, providers, status, error, notice, start, signIn, signOut }
}
