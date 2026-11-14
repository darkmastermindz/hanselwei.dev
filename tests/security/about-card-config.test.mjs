// config.toml [about_card] first picks whether the home page's About card opens in plain English
// or JSON (utils/aboutCard.js). Only the two known values pass; anything else fails the build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from 'smol-toml'
import { aboutCardConfig } from '../../utils/aboutCard.js'
import { BAD_ABOUT_FIRST } from './payloads.mjs'

test('"text" and "json" are the only values, and leaving it out means "text"', () => {
  assert.deepEqual(aboutCardConfig({ about_card: { first: 'text' } }), { config: { first: 'text' }, problems: [] })
  assert.deepEqual(aboutCardConfig({ about_card: { first: 'json' } }), { config: { first: 'json' }, problems: [] })
  assert.deepEqual(aboutCardConfig({}), { config: { first: 'text' }, problems: [] })
  assert.deepEqual(aboutCardConfig(), { config: { first: 'text' }, problems: [] })
})

test('anything else fails the build and falls back to plain English', () => {
  for (const first of BAD_ABOUT_FIRST) {
    const { config, problems } = aboutCardConfig({ about_card: { first } })
    assert.equal(problems.length, 1, JSON.stringify(first))
    assert.equal(config.first, 'text')
  }
})

test('the site config passes', () => {
  const toml = parse(readFileSync(new URL('../../config.toml', import.meta.url), 'utf8'))
  assert.deepEqual(aboutCardConfig(toml).problems, [])
})
