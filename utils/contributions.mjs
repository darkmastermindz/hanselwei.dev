// The contribution calendar for the Projects page. The data comes from GitHub at build
// time and is checked here before the site uses it.
export const EMPTY_CALENDAR = { total: 0, weeks: [] }
const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_COUNT = 1_000_000

// 0 = none, then four levels for the colour of each square
export const level = count => (count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4)

// GitHub's GraphQL contributionCalendar -> { total, weeks: [[{ date, count, level }]] }, or
// null when anything doesn't look right
export const parseCalendar = raw => {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.weeks)) return null
  const total = Number(raw.totalContributions)
  if (!Number.isSafeInteger(total) || total < 0) return null

  const weeks = []
  for (const week of raw.weeks) {
    const days = week?.contributionDays
    if (!Array.isArray(days) || days.length > 7) return null
    const parsed = []
    for (const day of days) {
      const count = Number(day?.contributionCount)
      if (typeof day?.date !== 'string' || !DATE.test(day.date)) return null
      if (!Number.isSafeInteger(count) || count < 0 || count > MAX_COUNT) return null
      parsed.push({ date: day.date, count, level: level(count) })
    }
    weeks.push(parsed)
  }
  return { total, weeks }
}
