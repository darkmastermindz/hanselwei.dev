// Site sign-in through Netlify Identity (@netlify/identity). Browser only: the
// static pages render signed out, then this picks up the session after load.
// Who may sign in is enforced on Netlify (invite-only + netlify/functions/identity.mjs);
// the nav only reflects the result.

const PROVIDER_LABELS = { github: 'GitHub', google: 'Google', gitlab: 'GitLab', bitbucket: 'Bitbucket', facebook: 'Facebook' }

let identity = null
let started = null

export const useAuth = () => {
  const user = useState('auth:user', () => null)
  const providers = useState('auth:providers', () => [])
  const status = useState('auth:status', () => 'idle') // idle | ready | unavailable
  const error = useState('auth:error', () => '')

  const start = () => {
    if (import.meta.server) return Promise.resolve()
    started ??= (async () => {
      try {
        identity = await import('@netlify/identity')
        // Finishes OAuth redirects and invite/confirmation links (#..._token in the URL)
        const result = await identity.handleAuthCallback().catch(e => {
          error.value = e.message
          return null
        })
        user.value = result?.user ?? (await identity.getUser())
        identity.onAuthChange((event, next) => (user.value = next))

        const settings = await identity.getSettings()
        // Single sign-on providers only ("email" is password sign-in, not SSO)
        providers.value = Object.entries(settings.providers ?? {})
          .filter(([id, on]) => on && id in PROVIDER_LABELS)
          .map(([id]) => ({ id, label: PROVIDER_LABELS[id] ?? id }))
        status.value = 'ready'
      } catch {
        // Identity isn't enabled for this site/deploy yet (or this is `nuxt dev`)
        status.value = 'unavailable'
      }
    })()
    return started
  }

  const signIn = provider => identity?.oauthLogin(provider) // navigates away
  const signOut = async () => {
    await identity?.logout()
    user.value = null
  }

  return { user, providers, status, error, start, signIn, signOut }
}
