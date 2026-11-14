// Surprise me (components/SurpriseMe.vue, on the 404 page): somewhere at random on the site.
// A blog post opens; a home page fact or a glossary definition is searched for you, shown being
// typed and searched, in the page (components/LetMeSearch.vue).
//
// Decoupled from the rest of the site on purpose: the button only reads /lucky.json
// (server/routes/lucky.json.js), a plain list built from the data itself (the blog posts,
// data/hobbyFacts.mjs and data/glossary.js), never from the components that show them. Each source
// is read on its own, and anything that's missing, empty or doesn't look right is left out, so a
// change to one of them can at worst drop it from the draw, never break the button.

export const KINDS = ['post', 'fact', 'term']

const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i
const text = (value, max = 400) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const list = value => (Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [])

// What to search for: a fact's first sentence, at most 12 words (Google reads the first 32); a
// definition's term, with what an acronym stands for ("AMGA American Mountain Guides Association")
export const factQuery = fact => {
  const first = text(fact).split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '')
  return first.split(' ').slice(0, 12).join(' ')
}
export const termQuery = ({ term, short }) => {
  const stands = /^[A-Z0-9/&]{2,}$/.test(term) ? text(short).match(/^([^:.]{3,80}):/)?.[1] : null
  return stands && stands !== term ? `${term} ${stands}` : term
}

// The pool, from whatever each source gives (a source that's missing or not a list gives nothing)
export function luckyPool({ posts, facts, glossary } = {}) {
  const pool = { post: [], fact: [], term: [] }
  for (const post of list(posts)) {
    const slug = text(post?.slug, 120)
    // Only this site's own posts, by slug: never a link to somewhere else
    if (!SLUG.test(slug) || post.draft) continue
    pool.post.push({ kind: 'post', title: text(post.title, 200) || slug, path: `/blog/${slug}` })
  }
  for (const fact of list(facts)) {
    const body = text(fact?.text)
    if (!body) continue
    const query = fact.type === 'quote' && fact.author ? `"${factQuery(body)}" ${text(fact.author, 80)}` : factQuery(body)
    pool.fact.push({ kind: 'fact', label: text(fact.label, 60), emoji: text(fact.emoji, 8), text: body, ...(fact.author && { author: text(fact.author, 80) }), query })
  }
  for (const entry of list(glossary)) {
    const term = text(entry?.term, 80)
    const short = text(entry?.short, 240)
    if (!term || !short) continue
    pool.term.push({ kind: 'term', term, text: short, query: termQuery({ term, short }) })
  }
  return pool
}

// One pick: a kind first (so the few blog posts aren't drowned out by the many facts), then one
// of that kind. random: a number in [0, 1), Math.random's kind. null when the pool is empty.
export function pickLucky(pool, random = Math.random) {
  const kinds = KINDS.filter(kind => Array.isArray(pool?.[kind]) && pool[kind].length)
  if (!kinds.length) return null
  const at = (items, r) => items[Math.min(items.length - 1, Math.floor(r * items.length))]
  const kind = at(kinds, random())
  return at(pool[kind], random())
}

export const googleSearchUrl = query => `https://www.google.com/search?q=${encodeURIComponent(query)}`

// config.toml [lucky] search_engine_id: a Programmable Search Engine ID (Google's official way to
// show its results in a page). Empty: the search ends with a link to Google instead.
const ENGINE_ID = /^[a-z0-9]+(?::[a-z0-9_-]+)?$/i
export function luckyConfig(toml = {}) {
  const raw = toml?.lucky?.search_engine_id ?? ''
  if (raw === '') return { config: { searchEngineId: '' }, problems: [] }
  if (typeof raw !== 'string' || raw.length > 64 || !ENGINE_ID.test(raw)) {
    return { config: { searchEngineId: '' }, problems: ['[lucky] search_engine_id: a Programmable Search Engine ID is letters and digits (like "a1b2c3d4e5f6g7h8i"), or leave it empty'] }
  }
  return { config: { searchEngineId: raw }, problems: [] }
}
