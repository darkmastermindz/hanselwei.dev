// Site sign-in through Netlify Identity (@netlify/identity). Browser only: the
// static pages render signed out, then this picks up the session after load.
// Who may sign in is enforced on Netlify (invite-only + netlify/functions/identity.mjs);
// the nav only reflects the result.

const NOT_INVITED = "That account isn't on the invite list for this site."
const PROVIDER_LABELS = { github: 'GitHub', google: 'Google', gitlab: 'GitLab', bitbucket: 'Bitbucket', facebook: 'Facebook' }

let identity = null
let started = null

// Netlify refusing a sign-in reads as a 401/403 or "denied"; say why in plain words
const explain = message => (/40[13]|denied|not allowed|unauthori|invite/i.test(message) ? NOT_INVITED : message)

export const useAuth = () => {
  const user = useState('auth:user', () => null)
  const providers = useState('auth:providers', () => [])
  const status = useState('auth:status', () => 'idle') // idle | ready | unavailable
  const error = useState('auth:error', () => '')

  // `landingHash` is the URL hash as the page loaded (loading the library clears it);
  // `clearHash` removes it from the URL (see plugins/auth.client.js)
  const start = ({ landingHash = '', clearHash = () => {} } = {}) => {
    if (import.meta.server) return Promise.resolve()
    started ??= (async () => {
      // A refused SSO sign-in (not on the invite list) comes back with #error=... in
      // the URL, which handleAuthCallback() ignores: report it and tidy the URL
      const landing = new URLSearchParams(landingHash.slice(1))
      if (landing.has('error')) error.value = explain(`${landing.get('error')} ${landing.get('error_description') ?? ''}`)

      try {
        identity = await import('@netlify/identity')

        // Finishes OAuth redirects and invite/confirmation links (#..._token in the URL)
        const result = await identity.handleAuthCallback().catch(e => {
          error.value = explain(`${e.status ?? ''} ${e.message}`)
          return null
        })
        if (landing.has('error')) clearHash() // after the library has loaded and touched the URL
        user.value = result?.user ?? (await identity.getUser())
        identity.onAuthChange((event, next) => (user.value = next))

        const settings = await identity.getSettings()
        // Single sign-on providers only ("email" is password sign-in, not SSO)
        providers.value = Object.entries(settings.providers ?? {})
          .filter(([id, on]) => on && id in PROVIDER_LABELS)
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
    error.value = ''
    identity?.oauthLogin(provider) // navigates away
  }
  const signOut = async () => {
    await identity?.logout()
    user.value = null
  }

  return { user, providers, status, error, start, signIn, signOut }
}
