// Kudos (netlify/functions/kudos.mjs) for blog posts and Curiosity Feed entries. Counts are shared by everyone, kept once for the whole app (useState) and
// refreshed while a page's buttons are on screen; which ones this browser has already given
// kudos to is remembered locally, so the button shows it. Where the function isn't there (local
// preview), `available` stays false and the buttons don't show.
const GIVEN_KEY = 'kudos:given'
const REFRESH_MS = 15_000

const readGiven = () => {
  try {
    const list = JSON.parse(localStorage.getItem(GIVEN_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}
const saveGiven = given => {
  try {
    localStorage.setItem(GIVEN_KEY, JSON.stringify(given))
  } catch {}
}

export const useKudos = () => {
  const available = useState('kudos:available', () => false)
  const counts = useState('kudos:counts', () => ({}))
  const given = useState('kudos:given', () => [])
  const hasGiven = id => given.value.includes(id)

  const refresh = async () => {
    try {
      const res = await fetch('/api/kudos', { headers: { accept: 'application/json' } })
      const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? await res.json() : null
      if (!body?.counts || typeof body.counts !== 'object') return
      counts.value = body.counts
      available.value = true
    } catch {}
  }

  const give = async id => {
    if (hasGiven(id)) return
    const before = counts.value[id] ?? 0
    counts.value = { ...counts.value, [id]: before + 1 }
    given.value = [...given.value, id]
    try {
      const res = await fetch('/api/kudos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      if (Number.isSafeInteger(body.count)) counts.value = { ...counts.value, [id]: body.count }
      saveGiven(given.value)
    } catch {
      counts.value = { ...counts.value, [id]: before }
      given.value = given.value.filter(g => g !== id)
    }
  }

  // Live while `active` is true (the buttons are on screen); one timer per caller
  const watchActive = active => {
    let timer = null
    const tick = () => {
      if (!document.hidden) refresh()
    }
    watch(
      active,
      on => {
        clearInterval(timer)
        timer = null
        if (!on || import.meta.server) return
        given.value = readGiven()
        refresh()
        timer = setInterval(tick, REFRESH_MS)
      },
      { immediate: true }
    )
    onBeforeUnmount(() => clearInterval(timer))
  }

  return { available, counts, given, hasGiven, give, watchActive }
}
