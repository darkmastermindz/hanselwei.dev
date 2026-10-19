// Who may sign in: the code owners in .github/CODEOWNERS plus [access] additional in
// config.toml, merged into access.mjs by scripts/build-access.mjs on every build.
import access from './access.mjs'

const allowed = new Set(access.emails)

export const ownerEmails = () => [...allowed]

export const isOwner = email => typeof email === 'string' && allowed.has(email.toLowerCase())
