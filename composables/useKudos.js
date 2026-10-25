// Kudos for the About card's XP entries (netlify/functions/kudos.mjs). Counts are shared by
// everyone and refreshed while the list is on screen; which entries this browser has already
// given kudos to is remembered locally, so the button shows it. Where the function isn't there
// (local preview), `available` stays false and the buttons don't show.
const GIVEN_KEY = 'kudos:given'
const REFRESH_MS = 15_000

const readGiven = () => {
  try {
    const list = JSON.parse(localStorage.getItem(GIVEN_KEY) ?? '[]')
    return new Set(Array.isArray(list) ? list.filter(id => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}
const saveGiven = given => {
  try {
    localStorage.setItem(GIVEN_KEY, JSON.stringify([...given]))
  } catch {}
}

export const useKudos = () => {
  const available = ref(false)
  const counts = ref({})
  const given = ref(new Set())
  let timer = null

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
    if (given.value.has(id)) return
    const before = counts.value[id] ?? 0
    counts.value = { ...counts.value, [id]: before + 1 }
    given.value = new Set([...given.value, id])
    try {
      const res = await fetch('/api/kudos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error(String(res.status))
      const body = await res.json()
      if (Number.isSafeInteger(body.count)) counts.value = { ...counts.value, [id]: body.count }
      saveGiven(given.value)
    } catch {
      counts.value = { ...counts.value, [id]: before }
      const rest = new Set(given.value)
      rest.delete(id)
      given.value = rest
    }
  }

  const tick = () => {
    if (!document.hidden) refresh()
  }
  // Live while `active` (the plain-English XP list is showing)
  const watchActive = active => {
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

  return { available, counts, given, give, watchActive }
}
