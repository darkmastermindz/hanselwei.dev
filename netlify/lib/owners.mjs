// Who may sign in. Set OWNER_EMAILS (comma-separated) in the Netlify environment
// variables to change it; until then it's just Hansel.
const DEFAULT_OWNERS = 'hello@hanselwei.dev'

export const ownerEmails = () =>
  (globalThis.Netlify?.env.get('OWNER_EMAILS') ?? process.env.OWNER_EMAILS ?? DEFAULT_OWNERS)
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

export const isOwner = email => Boolean(email) && ownerEmails().includes(email.toLowerCase())
