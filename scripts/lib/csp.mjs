// Content-Security-Policy for the generated site (tested in tests/security/headers.test.mjs).
// Scripts may only come from this site; the few inline scripts Nuxt writes into the
// prerendered pages (and scripts/first-paint.mjs's loader) are allowed by hash, so an injected
// <script> or on*= handler still can't run.
import { createHash } from 'node:crypto'

const sha256 = text => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`

const decodeAttr = value =>
  value.replace(/&(quot|#39|apos|lt|gt|amp);/g, (_, e) => ({ quot: '"', '#39': "'", apos: "'", lt: '<', gt: '>', amp: '&' })[e])

// Executable inline <script> bodies and import maps (script-src covers both; JSON data blocks
// don't run, so they need no hash)
export const inlineScriptHashes = html => {
  const hashes = new Set()
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi)) {
    if (/\ssrc\s*=/i.test(attrs)) continue
    const type = attrs.match(/\stype\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.toLowerCase()
    if (type && !['module', 'importmap', 'text/javascript', 'application/javascript'].includes(type)) continue
    hashes.add(sha256(body))
  }
  return hashes
}

// Inline event handler attributes (on*="...") the build itself wrote (none at the moment)
export const handlerHashes = html => {
  const hashes = new Set()
  for (const tag of html.match(/<[a-z][^>]*>/gi) ?? []) {
    for (const [, , value] of tag.matchAll(/\son[a-z]+\s*=\s*(["'])([\s\S]*?)\1/gi)) hashes.add(sha256(decodeAttr(value)))
  }
  return hashes
}

export const FONT_STYLES = ['https://fonts.googleapis.com', 'https://use.typekit.net', 'https://p.typekit.net']
export const FONT_FILES = ['https://fonts.gstatic.com', 'https://use.typekit.net']
// Simple Analytics (added to every page by the site's Netlify settings): its script, and the
// queue it reports page views to
export const ANALYTICS_SCRIPTS = ['https://scripts.simpleanalyticscdn.com']
export const ANALYTICS_CONNECT = ['https://queue.simpleanalyticscdn.com']
// The projects page lists repos from the GitHub API
export const CONNECT = ['https://api.github.com', ...ANALYTICS_CONNECT]

// Google's Programmable Search Element (Surprise me's in-page results, components/LetMeSearch.vue),
// only allowed when config.toml [lucky] sets a search engine: its script, the scripts it loads,
// its result requests, styles and the frames it draws ads and image results in
export const GOOGLE_SEARCH = ['https://cse.google.com', 'https://www.google.com']
export const GOOGLE_SEARCH_FRAMES = [...GOOGLE_SEARCH, 'https://syndicatedsearch.goog']

// `reportOnly`: the policy deploy previews only report on (scripts/build-csp.mjs). Browsers ignore
// upgrade-insecure-requests there and warn about it on every page, so it's left out.
export const buildCsp = ({ scripts = [], handlers = [], reportOnly = false, googleSearch = false } = {}) => {
  const handlerList = [...handlers].sort()
  const search = googleSearch ? GOOGLE_SEARCH : []
  return [
    "default-src 'self'",
    [
      'script-src',
      "'self'",
      ...ANALYTICS_SCRIPTS,
      ...search,
      ...[...scripts].sort(),
      ...(handlerList.length ? ["'unsafe-hashes'", ...handlerList] : [])
    ].join(' '),
    // Vue and the components set inline styles; styles can't run code
    ['style-src', "'self'", "'unsafe-inline'", ...FONT_STYLES, ...search].join(' '),
    ['font-src', "'self'", 'data:', ...FONT_FILES].join(' '),
    "img-src 'self' https: data:",
    ['connect-src', "'self'", ...CONNECT, ...search].join(' '),
    "manifest-src 'self'",
    "worker-src 'self'",
    "media-src 'self' https:",
    googleSearch ? ['frame-src', ...GOOGLE_SEARCH_FRAMES].join(' ') : "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(reportOnly ? [] : ['upgrade-insecure-requests'])
  ].join('; ')
}
