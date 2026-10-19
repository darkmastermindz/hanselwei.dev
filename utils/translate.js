// The About card's plain-English text can be opened in Google Translate, in the visitor's own
// language. The language comes from the browser (navigator.languages), which is outside input:
// only a well-formed language tag gets through, and the link is always to translate.google.com.
const TAG = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i
const TRADITIONAL = new Set(['hant', 'tw', 'hk', 'mo'])
export const MAX_TEXT = 4000 // Google Translate's limit is 5000 characters; keep well under

// The target language for Google Translate, or null when the visitor reads English (or the
// browser reports nothing usable). Uses the browser's first (preferred) language.
export const translateTarget = languages => {
  const first = Array.isArray(languages) ? languages[0] : languages
  if (typeof first !== 'string' || first.length > 35 || !TAG.test(first)) return null
  const [base, ...rest] = first.toLowerCase().split('-')
  if (base === 'en') return null
  // Chinese is the one language Google splits by script
  if (base === 'zh') return rest.some(part => TRADITIONAL.has(part)) ? 'zh-TW' : 'zh-CN'
  return base
}

// The language's name in that language ("español", "日本語"), for the link text
export const languageName = code => {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code)
    return name && name !== code ? name : code
  } catch {
    return code
  }
}

// A Google Translate link for English `text` into `code` (from translateTarget)
export const translateUrl = (text, code) => {
  const params = new URLSearchParams({ sl: 'en', tl: code, op: 'translate' })
  const clean = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT) : ''
  if (clean) params.set('text', clean)
  return `https://translate.google.com/?${params}`
}
