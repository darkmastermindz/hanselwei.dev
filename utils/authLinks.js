// Sign-in providers the menu offers, and the link that accepts an invite through one.
// Both the provider and the invite token come from outside (Identity settings, the
// invite link's URL), so only known providers and plain tokens make a link.
export const PROVIDER_LABELS = { github: 'GitHub', google: 'Google', gitlab: 'GitLab', bitbucket: 'Bitbucket', facebook: 'Facebook' }

export const isProvider = id => typeof id === 'string' && Object.hasOwn(PROVIDER_LABELS, id)

const INVITE_TOKEN = /^[A-Za-z0-9_-]{1,512}$/
export const isInviteToken = token => typeof token === 'string' && INVITE_TOKEN.test(token)

// Same URL gotrue-js builds in acceptInviteExternalUrl: Netlify signs the invited
// person in with the provider and attaches the account to the invite
export const inviteAuthorizeUrl = (provider, token) =>
  isProvider(provider) && isInviteToken(token)
    ? `/.netlify/identity/authorize?${new URLSearchParams({ provider, invite_token: token })}`
    : null
