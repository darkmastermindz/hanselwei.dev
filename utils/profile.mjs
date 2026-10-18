// The About me text for the About card, taken from the GitHub profile bio at build time.
// The bio is outside input, so it is checked here before the site uses it. It is plain
// text only: the page shows it as text, never as HTML.
export const EMPTY_PROFILE = { lines: [] }
export const MAX_BIO_CHARS = 1000
const MAX_LINES = 10
// Control characters other than line breaks (NUL, escapes, bells, and so on)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

// GitHub user JSON -> { lines: [string] }, or null when the bio isn't text or is too long
export const parseProfile = raw => {
  if (!raw || typeof raw !== 'object') return null
  if (raw.bio === null || raw.bio === undefined || raw.bio === '') return EMPTY_PROFILE
  if (typeof raw.bio !== 'string' || raw.bio.length > MAX_BIO_CHARS) return null

  const lines = raw.bio
    .replace(CONTROL, '')
    .split(/\r\n|\r|\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, MAX_LINES)
  return { lines }
}
