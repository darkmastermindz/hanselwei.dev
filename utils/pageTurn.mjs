// The site as a book, for foldables in book (README "Foldables"): the menu's sections are its
// chapters, in the menu's order. Going to a later chapter, or deeper into one, turns the page
// forward; going back turns it back (plugins/pageTurn.client.js). The corner links turn to the
// next and previous chapter (components/BookPager.vue).
export const CHAPTERS = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/gear', label: 'Gear Lists' },
  { to: '/bio', label: 'Bio' }
]

const clean = path => (path.length > 1 ? path.replace(/\/+$/, '') : path)

// The chapter a page is in; pages outside the menu (terms, credits…) come after the last one
export const chapterOf = path => {
  const p = clean(path)
  if (p === '/') return 0
  const i = CHAPTERS.findIndex(c => c.to !== '/' && (p === c.to || p.startsWith(`${c.to}/`)))
  return i === -1 ? CHAPTERS.length : i
}

const depth = path => clean(path).split('/').filter(Boolean).length

export const turnDirection = (from, to) => {
  const a = chapterOf(from)
  const b = chapterOf(to)
  if (a !== b) return b > a ? 'forward' : 'back'
  return depth(to) >= depth(from) ? 'forward' : 'back'
}

export const neighbours = path => {
  const i = chapterOf(path)
  return {
    prev: i > 0 ? CHAPTERS[Math.min(i, CHAPTERS.length) - 1] : null,
    next: i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : null
  }
}

// The page-turn hint (components/BookPager.vue): the first few times the phone is folded into book
export const TURN_HINT_KEY = 'pageTurnHintShown'
export const TURN_HINT_TIMES = 3
export const turnHintDue = timesShown => Number.isFinite(timesShown) && timesShown >= 0 && timesShown < TURN_HINT_TIMES
