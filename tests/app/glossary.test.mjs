// Glossary terms (README "Glossary terms"): acronyms and jargon in the site's display text get a
// definition. The first test keeps it that way: new display text with an acronym that isn't in
// data/glossary.js (or the short list of everyday ones below) fails until it's defined there or
// said in plain words.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { glossary } from '../../data/glossary.js'
import { findTerms } from '../../utils/glossary.js'
import { achievements, education, experience } from '../../data/xp.mjs'

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

// Everyday acronyms, places and model numbers: no definition needed
const EVERYDAY = new Set(['NC', 'SC', 'VA', 'GA', 'US', 'USA', 'MIT', 'AI', 'GPS', 'TV', 'CS', 'NET', 'T5', 'HW', 'BS'])

// The display text the site writes itself: the About card's plain-English lines (the XP ones
// live in data/xp.mjs), the gear lists' tags and notes, the hobby facts, the bio and the blog
// posts written here (content/blog; the ones mirrored from dev.to get terms too, but are written
// there)
const displayText = () => {
  const card = [...read('components/AboutCard.vue').matchAll(/\b(?:readable|highlight):\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1])
  const xp = [...education, ...experience, ...achievements].flatMap(entry => [entry.readable, entry.highlight].filter(Boolean))
  const gear = ['outdoor', 'camera'].flatMap(id => JSON.parse(read(`data/gear/${id}.json`)).items.flatMap(i => [...i.tags, i.notes ?? '']))
  const posts = readdirSync(new URL('../../content/blog/', import.meta.url)).filter(f => f.endsWith('.md')).map(f => read(`content/blog/${f}`))
  return [...card, ...xp, ...gear, read('data/hobbyFacts.mjs'), read('content/bio/bio.md'), ...posts]
}

test('every acronym in the display text is in the glossary (or everyday)', () => {
  const known = new Set(Object.values(glossary).flatMap(e => [e.term, ...(e.aliases ?? [])]).flatMap(t => t.split(' ')))
  const missing = new Set()
  for (const text of displayText()) {
    for (const [token] of text.matchAll(/(?<![A-Za-z0-9])[A-Z][A-Z0-9]+(?:\/[A-Z0-9]+)?(?![A-Za-z0-9])/g)) {
      if (!known.has(token) && !EVERYDAY.has(token)) missing.add(token)
    }
  }
  assert.deepEqual([...missing], [], 'Add these to data/glossary.js with a short definition and a link, or write them out')
})

test('every entry has a term, a short definition and a link', () => {
  for (const [id, entry] of Object.entries(glossary)) {
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, id)
    assert.ok(entry.term && entry.short && entry.href, id)
    assert.ok(entry.short.length <= 220, `${id}: keep the definition short`)
  }
})

test('terms match whole words, exactly, and only the first use is marked', () => {
  const parts = findTerms('MLH: HackNC (MLH 2019 season), SUPER sup SUP and CI/CD at TIAA.')
  assert.deepEqual(parts.filter(p => p.id).map(p => [p.text, p.id]), [['MLH', 'mlh'], ['SUP', 'sup'], ['CI/CD', 'ci-cd'], ['TIAA', 'tiaa']])
  assert.equal(parts.map(p => p.text).join(''), 'MLH: HackNC (MLH 2019 season), SUPER sup SUP and CI/CD at TIAA.')
})

test('the longest spelling wins, and aliases mark the same term', () => {
  assert.deepEqual(findTerms('UNC Charlotte').map(p => p.id), ['unc'])
  assert.deepEqual(findTerms('#GuideMode #AssistedBraking').filter(p => p.id).map(p => p.id), ['guide-mode', 'assisted-braking'])
})

test('text with no terms comes back as it was', () => {
  assert.deepEqual(findTerms('Just a rope.'), [{ text: 'Just a rope.' }])
  assert.deepEqual(findTerms(''), [])
  assert.deepEqual(findTerms(null), [])
})
