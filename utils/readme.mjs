// The GitHub profile README shown on the Bio page. It is outside input, so it is checked
// here before the page uses it. The page renders it with renderMarkdown, which sanitizes it.
export const MAX_README_CHARS = 100_000
// Control characters other than tab and line breaks (NUL, escapes, bells, and so on)
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

// README text -> cleaned text, or null when it isn't text or is too long
export const parseReadme = raw => {
  if (typeof raw !== 'string' || raw.length > MAX_README_CHARS) return null
  return raw.replace(CONTROL, '')
}
