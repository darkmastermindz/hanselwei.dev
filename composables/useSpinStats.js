import { hobbyFacts } from '~/data/hobbyFacts.mjs'

const STORAGE_KEY = 'hanselwei:token'

// Spin count, best single-hold streak and revealed facts for the home page token.
// Saved in localStorage so they survive reloads; everything still works if storage
// is unavailable (private mode etc.), it just won't persist.
export const useSpinStats = () => {
  const loaded = ref(false)
  const count = ref(0)
  const best = ref(0)
  const seen = ref([])
  const current = ref(null)

  const save = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count: count.value, best: best.value, seen: seen.value, last: current.value?.id ?? null })
      )
    } catch {
      // Storage unavailable: keep the in-memory state
    }
  }

  onMounted(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      count.value = Number(saved.count) || 0
      best.value = Number(saved.best) || 0
      seen.value = Array.isArray(saved.seen) ? saved.seen : []
      current.value = hobbyFacts.find(f => f.id === saved.last) ?? null
    } catch {
      // Corrupt or blocked storage: start fresh
    }
    loaded.value = true
  })

  const addSpin = () => {
    count.value++
    save()
  }

  // Called when the token is released; reveals a fact not seen yet (cycling once all are seen)
  const reveal = spinsThisHold => {
    best.value = Math.max(best.value, spinsThisHold)

    let pool = hobbyFacts.filter(f => !seen.value.includes(f.id) && f.id !== current.value?.id)
    if (!pool.length) {
      seen.value = []
      pool = hobbyFacts.filter(f => f.id !== current.value?.id)
    }
    current.value = pool[Math.floor(Math.random() * pool.length)]
    seen.value = [...seen.value, current.value.id]
    save()
  }

  return { loaded, count, best, current, total: hobbyFacts.length, seenCount: computed(() => seen.value.length), addSpin, reveal }
}
