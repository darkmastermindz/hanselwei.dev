// The Projects page: which repos show under which filter, plus search, sort and the
// config that controls them. Config and search text come from outside, so hostile input
// must be refused or treated as plain text.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildProjectConfig, categorize, matchesQuery, projectsModule, sorter, FILTERS } from '../../utils/projects.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, REDOS, XSS_HTML } from '../security/payloads.mjs'

const config = buildProjectConfig({ projects: { wip: ['Pending-Thing'], forks: ['HackNC2019', 'iole-python'] } })
const repo = (name, extra = {}) => ({ name, fork: false, description: '', language: null, topics: [], stargazers_count: 0, updated_at: '2026-01-01T00:00:00Z', ...extra })

test('non-forks show as active unless listed as work in progress, case-insensitively', () => {
  assert.equal(categorize(repo('hanselwei.dev'), config), 'active')
  assert.equal(categorize(repo('pending-thing'), config), 'wip')
  assert.equal(categorize(repo('PENDING-THING'), config), 'wip')
})

test('forks are hidden unless listed, and listed forks are the fork category', () => {
  assert.equal(categorize(repo('some-fork', { fork: true }), config), null)
  assert.equal(categorize(repo('hacknc2019', { fork: true }), config), 'fork')
  assert.equal(categorize(repo('IOLE-python', { fork: true }), config), 'fork')
})

test('a missing or empty config shows every non-fork and no forks', () => {
  const empty = buildProjectConfig({})
  assert.deepEqual(empty.problems, [])
  assert.equal(categorize(repo('anything'), empty), 'active')
  assert.equal(categorize(repo('hacknc2019', { fork: true }), empty), null)
})

test('bad config entries fail the build instead of changing what shows', () => {
  for (const value of [...XSS_HTML, ...JS_BREAKOUTS, '../etc', 'a b', 'x'.repeat(101), 42, null]) {
    const { problems, wip, forks } = buildProjectConfig({ projects: { wip: [value] } })
    assert.equal(problems.length, 1, JSON.stringify(value).slice(0, 40))
    assert.equal(wip.size, 0)
    assert.equal(forks.size, 0)
  }
  assert.equal(buildProjectConfig({ projects: { wip: 'not-a-list' } }).problems.length, 1)
  const both = buildProjectConfig({ projects: { wip: ['same'], forks: ['same'] } })
  assert.equal(both.problems.length, 1)
})

test('prototype repo names never match anything', () => {
  for (const key of PROTOTYPE_KEYS) {
    assert.equal(categorize(repo(key), config), 'active', key)
    assert.equal(categorize(repo(key, { fork: true }), config), null, key)
  }
})

test('search matches name, description, language and topics, ignoring case, as plain text', () => {
  const r = repo('Hello-World', { description: 'A Nuxt site', language: 'Vue', topics: ['pwa', 'gear'] })
  assert.equal(matchesQuery(r, ''), true)
  assert.equal(matchesQuery(r, '  '), true)
  assert.equal(matchesQuery(r, 'hello'), true)
  assert.equal(matchesQuery(r, 'NUXT'), true)
  assert.equal(matchesQuery(r, 'vue'), true)
  assert.equal(matchesQuery(r, 'gear'), true)
  assert.equal(matchesQuery(r, 'nothing'), false)
  // Regex characters and hostile text are just text
  for (const q of ['.*', '(a+)+$', '[', ...XSS_HTML, ...JS_BREAKOUTS, REDOS.slice(0, 500)]) {
    assert.equal(matchesQuery(r, q), false, q.slice(0, 30))
  }
  assert.equal(matchesQuery(repo('x', { description: 'a.*b' }), '.*'), true)
  assert.equal(matchesQuery(r, null), true)
})

test('sorting uses only the keys we define', () => {
  const list = [repo('b', { stargazers_count: 1, updated_at: '2026-01-01' }), repo('a', { stargazers_count: 5, updated_at: '2026-03-01' })]
  assert.equal([...list].sort(sorter('name'))[0].name, 'a')
  assert.equal([...list].sort(sorter('stars'))[0].name, 'a')
  assert.equal([...list].sort(sorter('updated'))[0].name, 'a')
  for (const key of [...PROTOTYPE_KEYS, 'nope', undefined]) {
    assert.equal(sorter(key), sorter('updated'), String(key))
  }
})

test('filters are the four known chips', () => {
  assert.deepEqual(FILTERS, ['all', 'active', 'wip', 'fork'])
})

test('the generated config module is data only', async () => {
  const source = projectsModule({ wip: new Set(['b', 'a']), forks: new Set(['iole-python']) })
  const mod = await import(`data:text/javascript,${encodeURIComponent(source)}`)
  assert.deepEqual(mod.default, { projects: { wip: ['a', 'b'], forks: ['iole-python'] } })
  assert.doesNotMatch(source.replace(/^\/\/.*\n/, ''), /[`$\\]|import|require|\(/)
})
