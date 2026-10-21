// Seasonal themes: themed emoji drifting over the background (components/SeasonalParticles.vue)
// and the topographic lines in the season's colours (components/TopoBackground.vue). Read from
// config.toml [seasons] by scripts/build-seasons.mjs; anything wrong fails the build, like the
// other config sections. A theme for every week of the year, plus dated events that take over
// while they run. Picked in the browser from today's date, so the themes change without a rebuild.
import { calendarDay } from './coinBubble.mjs'

export const SEASONS_DEFAULTS = {
  enabled: false,
  particles: 12,
  weeks: [],
  events: []
}

export const MOTIONS = ['fall', 'rise'] // drift down (leaves, snow) or float up (bubbles, ghosts)
export const MAX_EMOJI = 8
export const MAX_NAME = 40
const MAX_EMOJI_LENGTH = 16 // one emoji, with skin tone / ZWJ sequences / flags
const MONTH_DAY = /^(\d{2})-(\d{2})$/
const COLOR = /^#[0-9a-f]{6}$/i
// One emoji (or a short symbol): no markup, quotes, spaces or escapes
const EMOJI_UNSAFE = /[<>&"'`\\=\s]/
const ALPHANUMERIC = /^[a-z0-9]+$/i

// "MM-DD" for a real day of the year (Feb 29 isn't one: not every year has it), or null
export const monthDay = value => {
  const match = typeof value === 'string' ? MONTH_DAY.exec(value) : null
  if (!match) return null
  const [m, d] = [Number(match[1]), Number(match[2])]
  const date = new Date(Date.UTC(2025, m - 1, d))
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? value : null
}

// The theme's checked settings, or null when any is wrong (the build fails then anyway)
const checkTheme = (theme, where, problems) => {
  const out = {}
  const before = problems.length
  if (typeof theme !== 'object' || theme === null || Array.isArray(theme)) {
    problems.push(`${where} must be a table`)
    return null
  }
  const name = typeof theme.name === 'string' ? theme.name.replace(/\s+/g, ' ').trim() : ''
  if (name && name.length <= MAX_NAME && !/[<>]/.test(name)) out.name = name
  else problems.push(`${where} name must be 1 to ${MAX_NAME} characters of plain text`)

  const emoji = Array.isArray(theme.emoji) ? theme.emoji : []
  const goodEmoji = emoji.every(
    e => typeof e === 'string' && e.length > 0 && e.length <= MAX_EMOJI_LENGTH && !EMOJI_UNSAFE.test(e) && !ALPHANUMERIC.test(e)
  )
  if (emoji.length >= 1 && emoji.length <= MAX_EMOJI && goodEmoji) out.emoji = [...emoji]
  else problems.push(`${where} emoji must be a list of 1 to ${MAX_EMOJI} emoji`)

  const colors = Array.isArray(theme.colors) ? theme.colors : []
  if (colors.length === 2 && colors.every(c => typeof c === 'string' && COLOR.test(c))) out.colors = colors.map(c => c.toLowerCase())
  else problems.push(`${where} colors must be two colours like "#f97316"`)

  const motion = theme.motion ?? 'fall'
  if (MOTIONS.includes(motion)) out.motion = motion
  else problems.push(`${where} motion must be ${MOTIONS.map(m => `"${m}"`).join(' or ')}`)
  return problems.length === before ? out : null
}

const THEME_KEYS = new Set(['name', 'emoji', 'colors', 'motion'])
const unknownKeys = (table, allowed, where, problems) => {
  if (typeof table !== 'object' || table === null) return
  for (const key of Object.keys(table)) if (!allowed.has(key)) problems.push(`${where} ${JSON.stringify(key)} isn't a setting`)
}

export const buildSeasonsConfig = (toml = {}) => {
  const section = toml?.seasons ?? {}
  const config = { ...SEASONS_DEFAULTS, weeks: [], events: [] }
  const problems = []
  if (typeof section !== 'object' || Array.isArray(section)) {
    return { config, problems: ['[seasons] must be a table of settings'] }
  }

  for (const [key, value] of Object.entries(section)) {
    if (key === 'enabled') {
      if (typeof value === 'boolean') config.enabled = value
      else problems.push('[seasons] enabled must be true or false')
    } else if (key === 'particles') {
      if (Number.isInteger(value) && value >= 0 && value <= 40) config.particles = value
      else problems.push('[seasons] particles must be a whole number from 0 to 40')
    } else if (key === 'week') {
      if (!Array.isArray(value)) {
        problems.push('[seasons] week must be a list of [[seasons.week]] tables')
        continue
      }
      value.forEach((week, i) => {
        const where = `[[seasons.week]] #${i + 1}`
        unknownKeys(week, new Set([...THEME_KEYS, 'from']), where, problems)
        const theme = checkTheme(week, where, problems)
        const from = monthDay(week?.from)
        if (!from) problems.push(`${where} from must be a day like "10-29" (month-day, not Feb 29)`)
        if (theme && from) config.weeks.push({ from, ...theme })
      })
    } else if (key === 'event') {
      if (!Array.isArray(value)) {
        problems.push('[seasons] event must be a list of [[seasons.event]] tables')
        continue
      }
      value.forEach((event, i) => {
        const where = `[[seasons.event]] #${i + 1}`
        unknownKeys(event, new Set([...THEME_KEYS, 'from', 'to']), where, problems)
        const theme = checkTheme(event, where, problems)
        const from = calendarDay(event?.from)
        const to = calendarDay(event?.to)
        if (!from || !to || from > to) problems.push(`${where} from and to must be dates like 2026-10-19, from first`)
        else if (theme) config.events.push({ from, to, ...theme })
      })
    } else {
      problems.push(`[seasons] ${JSON.stringify(key)} isn't a setting`)
    }
  }

  // The weeks run in order from Jan 1, each until the next one starts, so every day has a theme
  const starts = config.weeks.map(week => week.from)
  if (config.weeks.length && starts[0] !== '01-01') problems.push('[[seasons.week]] the first week must start on "01-01"')
  for (let i = 1; i < starts.length; i++) {
    if (starts[i] <= starts[i - 1]) problems.push(`[[seasons.week]] #${i + 1} must start after #${i} (${starts[i]} isn't after ${starts[i - 1]})`)
  }
  if (config.enabled && !config.weeks.length) problems.push('[seasons] needs [[seasons.week]] themes when enabled')
  return { config, problems }
}

// The theme for a day ("YYYY-MM-DD"): an event running that day, or else that day's week. Null
// when seasons are off. Feb 29 belongs to the week running on Feb 28.
export const themeFor = (config, day) => {
  if (!config?.enabled || typeof day !== 'string') return null
  const event = config.events.find(e => e.from <= day && day <= e.to)
  if (event) return event
  const md = day.slice(5)
  let week = null
  for (const w of config.weeks) if (w.from <= md) week = w
  return week
}

// Where each particle starts and how it moves, picked at random for every page load. `random`
// returns 0 to 1 (Math.random), so tests can pass their own.
export const particleLayout = (theme, count, random = Math.random) =>
  Array.from({ length: theme ? count : 0 }, (_, i) => {
    const duration = 14 + random() * 14 // seconds to cross the screen
    return {
      id: i,
      emoji: theme.emoji[i % theme.emoji.length],
      x: Math.round(random() * 1000) / 10, // % across
      size: Math.round((1 + random() * 1.1) * 100) / 100, // rem
      duration: Math.round(duration * 10) / 10,
      delay: -Math.round(random() * duration * 10) / 10, // already on screen at load
      sway: Math.round((2.5 + random() * 3) * 10) / 10, // seconds per side-to-side
      spin: Math.round((random() - 0.5) * 720) // degrees over the whole crossing
    }
  })

export const seasonsModule = config =>
  `// Generated by scripts/build-seasons.mjs from config.toml [seasons]. Don't edit.\nexport default ${JSON.stringify(config, null, 2)}\n`
