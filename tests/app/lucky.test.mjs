import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { factQuery, luckyPool, pickLucky, termQuery } from '../../utils/lucky.mjs'
import { unlockProgress, UNLOCK_AT } from '../../utils/swipeUnlock.mjs'
import { hobbyFacts } from '../../data/hobbyFacts.mjs'
import { glossary } from '../../data/glossary.js'

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

test("the site's own data all makes it into the pool", () => {
  const pool = luckyPool({ posts: [{ slug: 'hello-world', title: 'Hello' }], facts: hobbyFacts, glossary })
  assert.equal(pool.fact.length, hobbyFacts.length)
  assert.equal(pool.term.length, Object.keys(glossary).length)
  assert.deepEqual(pool.post, [{ kind: 'post', title: 'Hello', path: '/blog/hello-world' }])
})

test('a missing, empty or odd source just sits the draw out', () => {
  for (const broken of [undefined, null, 42, 'text', [], {}, [null, 1, 'x', { text: '' }]]) {
    const pool = luckyPool({ posts: broken, facts: broken, glossary: broken })
    assert.deepEqual(pool, { post: [], fact: [], term: [] })
  }
  const onlyFacts = luckyPool({ posts: null, facts: [{ text: 'Chalk is magnesium carbonate.' }], glossary: 'gone' })
  assert.equal(pickLucky(onlyFacts, () => 0.99).kind, 'fact')
  assert.equal(pickLucky({ post: [], fact: [], term: [] }), null)
  assert.equal(pickLucky(null), null)
  assert.equal(pickLucky({ post: 'nope', fact: [{ kind: 'fact' }] }).kind, 'fact')
})

test('drafts stay out', () => {
  assert.deepEqual(luckyPool({ posts: [{ slug: 'secret', draft: true }] }).post, [])
})

test('a kind first, then one of that kind, so every kind gets a fair turn', () => {
  const pool = luckyPool({ posts: [{ slug: 'a' }], facts: hobbyFacts, glossary })
  assert.equal(pickLucky(pool, () => 0).kind, 'post')
  assert.equal(pickLucky(pool, () => 0.5).kind, 'fact')
  assert.equal(pickLucky(pool, () => 0.9).kind, 'term')
  assert.equal(pickLucky(pool, () => 1).kind, 'term', 'never past the end')
})

test('what gets searched: a short first sentence, or a term and what it stands for', () => {
  assert.equal(factQuery('The Appalachian Trail runs roughly 2,190 miles through 14 states, from Georgia to Maine. More.'), 'The Appalachian Trail runs roughly 2,190 miles through 14 states, from Georgia')
  assert.equal(factQuery('Short one!'), 'Short one')
  assert.equal(termQuery(glossary.amga), 'AMGA American Mountain Guides Association')
  assert.equal(termQuery({ term: 'Assisted Braking', short: 'A belay device: x.' }), 'Assisted Braking')
  const quote = luckyPool({ facts: [{ type: 'quote', text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' }] }).fact[0]
  assert.equal(quote.query, '"Fall seven times, stand up eight" Japanese proverb')
})

test('decoupled: the button only reads /lucky.json, and the list is built from data alone', () => {
  const button = read('components/FeelingLucky.vue')
  assert.match(button, /\$fetch\('\/lucky\.json'\)/)
  assert.doesNotMatch(button, /from '~\/(components|data|composables)\//)
  const route = read('server/routes/lucky.json.js')
  assert.doesNotMatch(route, /components\//)
  assert.ok(read('nuxt.config.js').includes("'/lucky.json'"), 'prerendered with the site')
})

test('slide to unlock: progress from 0 to 1, unlocking near the end', () => {
  assert.equal(unlockProgress(0, 200), 0)
  assert.equal(unlockProgress(100, 200), 0.5)
  assert.equal(unlockProgress(500, 200), 1)
  assert.equal(unlockProgress(-5, 200), 0)
  assert.equal(unlockProgress(10, 0), 0)
  assert.ok(UNLOCK_AT > 0.5 && UNLOCK_AT < 1)
})
