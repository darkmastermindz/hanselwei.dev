// The message bubble under the home page coin (components/Bitmoji.vue): a blue iMessage-style
// speech bubble that pops up when a hold lands the coin heads up, and then a QR code engraved on
// the coin's tails side. Read from config.toml [coin_bubble] by scripts/build-coin-bubble.mjs;
// anything wrong fails the build, like the other config sections. It shows through the last day
// of an event, then switches itself off.
import { safeUrl } from './safeUrl.js'

export const COIN_BUBBLE_DEFAULTS = { enabled: false, text: '', until: null, link: null, linkText: null, qr: null }

// `until` is a calendar day here (the events are in Raleigh): the bubble shows through the end of it
export const COIN_BUBBLE_TIME_ZONE = 'America/New_York'
export const MAX_TEXT = 80

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/
// "YYYY-MM-DD" from a TOML date (2026-10-20) or a string ("2026-10-20"), or null if it isn't a real day
export const calendarDay = value => {
  const text = value instanceof Date ? (Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)) : value
  const match = typeof text === 'string' ? DAY.exec(text) : null
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? text : null
}

export const buildCoinBubbleConfig = (toml = {}) => {
  const section = toml?.coin_bubble ?? {}
  const config = { ...COIN_BUBBLE_DEFAULTS }
  const problems = []
  if (typeof section !== 'object' || Array.isArray(section)) {
    return { config, problems: ['[coin_bubble] must be a table of settings'] }
  }

  let link = null
  for (const [key, value] of Object.entries(section)) {
    if (key === 'enabled') {
      if (typeof value === 'boolean') config.enabled = value
      else problems.push('[coin_bubble] enabled must be true or false')
    } else if (key === 'text') {
      const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
      if (text && text.length <= MAX_TEXT) config.text = text
      else problems.push(`[coin_bubble] text must be 1 to ${MAX_TEXT} characters`)
    } else if (key === 'until') {
      const day = calendarDay(value)
      if (day) config.until = day
      else problems.push('[coin_bubble] until must be a date, like 2026-10-20')
    } else if (key === 'link') {
      if (typeof value === 'string' && value.trim()) link = value.trim()
      else problems.push('[coin_bubble] link must be an https:// address')
    } else if (key === 'link_text') {
      if (typeof value === 'string' && value.trim()) config.linkText = value.trim()
      else problems.push('[coin_bubble] link_text must be text from `text`')
    } else if (key === 'qr') {
      const qr = httpsUrl(value)
      if (qr) config.qr = qr
      else problems.push('[coin_bubble] qr must be an https:// address')
    } else {
      problems.push(`[coin_bubble] ${JSON.stringify(key)} isn't a setting`)
    }
  }

  // The link may name the event's year, filled from `until` ("https://{year}.allthingsopen.org")
  if (link !== null) {
    const filled = config.until ? httpsUrl(link.replaceAll('{year}', config.until.slice(0, 4))) : null
    if (filled) config.link = filled
    else problems.push('[coin_bubble] link must be an https:// address ({year} needs until)')
  }
  if (config.linkText !== null && !config.text.includes(config.linkText)) {
    problems.push('[coin_bubble] link_text must be part of text')
    config.linkText = null
  }
  if ((config.link === null) !== (config.linkText === null) && !problems.length) {
    problems.push('[coin_bubble] link and link_text go together')
  }
  if (config.enabled && (!config.text || !config.until)) problems.push('[coin_bubble] needs text and until when enabled')
  return { config, problems }
}

// An absolute https:// address, or null
export const httpsUrl = value => {
  const url = safeUrl(typeof value === 'string' ? value.trim() : value)
  return url && url.startsWith('https://') ? url : null
}

// The bubble's text split around its link: [before, link text, after] (no link: [text, '', ''])
export const bubbleParts = config => {
  const text = config?.text ?? ''
  const at = config?.link && config.linkText ? text.indexOf(config.linkText) : -1
  if (at < 0) return [text, '', '']
  return [text.slice(0, at), config.linkText, text.slice(at + config.linkText.length)]
}

// Today's date where the event is, as "YYYY-MM-DD"
export const dayIn = (now, timeZone = COIN_BUBBLE_TIME_ZONE) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

// Whether the bubble is on right now: enabled, and the event's last day hasn't ended yet
export const bubbleActive = (config, now = new Date()) =>
  Boolean(config?.enabled && config.text && config.until && dayIn(now) <= config.until)

// Whether a coin angle (degrees) shows its front face, the profile picture
export const landsHeads = angle => Number.isFinite(angle) && ((Math.round(angle) % 360) + 360) % 360 === 0

export const coinBubbleModule = config =>
  `// Generated by scripts/build-coin-bubble.mjs from config.toml [coin_bubble]. Don't edit.\nexport default ${JSON.stringify(config, null, 2)}\n`
