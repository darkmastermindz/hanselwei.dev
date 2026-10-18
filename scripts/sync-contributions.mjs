// Writes data/contributions.generated.json (the contribution calendar for the Projects
// page) before every build. It needs GITHUB_TOKEN, a Netlify build variable with no
// permissions selected (it only reads public data). Without it, or on any error, the last
// calendar is kept (or an empty one is written) and the build carries on, like sync-devto.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { EMPTY_CALENDAR, parseCalendar } from '../utils/contributions.mjs'

const USER = 'darkmastermindz'
const OUT = fileURLToPath(new URL('../data/contributions.generated.json', import.meta.url))
const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`

const keepLastOrEmpty = async () => {
  if (!existsSync(OUT)) await writeFile(OUT, JSON.stringify(EMPTY_CALENDAR))
}

const fetchCalendar = async token => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'hanselwei.dev' },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } })
  })
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const body = await res.json()
  if (Array.isArray(body?.errors) && body.errors.length) throw new Error('GitHub returned an error')
  const calendar = parseCalendar(body?.data?.user?.contributionsCollection?.contributionCalendar)
  if (!calendar) throw new Error('unexpected calendar format')
  return calendar
}

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.warn('[sync-contributions] GITHUB_TOKEN not set; keeping the last calendar')
  await keepLastOrEmpty()
} else {
  try {
    const calendar = await fetchCalendar(token)
    await writeFile(OUT, JSON.stringify(calendar))
    console.log(`[sync-contributions] ${calendar.total} contributions in the last year`)
  } catch (err) {
    console.warn(`[sync-contributions] Skipped, keeping the last calendar: ${err.message}`)
    await keepLastOrEmpty()
  }
}
