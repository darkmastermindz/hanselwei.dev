// The Projects page: which repos show, their status and tags, plus search, sort and the
// config that controls them. Config and search text come from outside, so hostile input
// must be refused or treated as plain text.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildProjectConfig,
  categorize,
  FILTERS,
  matchesQuery,
  projectsModule,
  sorter,
  tagLabel,
  tagsFor,
  visibleProjects
} from '../../utils/projects.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, REDOS, XSS_HTML } from '../security/payloads.mjs'

const config = buildProjectConfig({
  projects: { wip: ['Pending-Thing'], forks: ['HackNC2019', 'iole-python'], featured: ['Hanselwei.dev'], hackathon: ['HackNC2019'] }
})
const repo = (name, extra = {}) => ({
  name,
  fork: false,
  description: '',
  language: null,
  topics: [],
  stargazers_count: 0,
  updated_at: '2026-01-01T00:00:00Z',
  ...extra
})
// What the store builds from a GitHub repo
const shown = (r, cfg = config) => {
  const category = categorize(r, cfg)
  return category === null ? null : { ...r, category, tags: [...new Set(tagsFor(r, cfg).concat(r.topics))] }
}
const list = repos => repos.map(r => shown(r)).filter(Boolean)

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

test('a missing or empty config shows every non-fork, with no tags and no forks', () => {
  const empty = buildProjectConfig({})
  assert.deepEqual(empty.problems, [])
  assert.equal(categorize(repo('anything'), empty), 'active')
  assert.equal(categorize(repo('hacknc2019', { fork: true }), empty), null)
  assert.deepEqual(tagsFor(repo('anything'), empty), [])
})

test('featured and hackathon tags come from config, case-insensitively', () => {
  assert.deepEqual(tagsFor(repo('HackNC2019'), config), ['hackathon'])
  assert.deepEqual(tagsFor(repo('hanselwei.dev'), config), ['featured'])
  assert.deepEqual(tagsFor(repo('gear-tracker'), config), [])
  assert.equal(tagLabel('featured'), '#featured') // every tag is a hashtag, config ones too
  assert.equal(tagLabel('hackathon'), '#hackathon')
  assert.equal(tagLabel('vue'), '#vue')
})

test('a tag on a hidden fork does not show the fork', () => {
  const cfg = buildProjectConfig({ projects: { hackathon: ['random-fork'] } })
  assert.equal(list([repo('random-fork', { fork: true })]).length, 0)
  assert.deepEqual(tagsFor(repo('random-fork', { fork: true }), cfg), ['hackathon'])
})

test('bad config entries fail the build instead of changing what shows', () => {
  for (const key of ['wip', 'forks', 'featured', 'hackathon']) {
    for (const value of [...XSS_HTML, ...JS_BREAKOUTS, '../etc', 'a b', 'x'.repeat(101), 42, null]) {
      const { problems, wip, forks, featured, hackathon } = buildProjectConfig({ projects: { [key]: [value] } })
      assert.equal(problems.length, 1, `${key} ${JSON.stringify(value).slice(0, 40)}`)
      assert.equal(wip.size + forks.size + featured.size + hackathon.size, 0)
    }
    assert.equal(buildProjectConfig({ projects: { [key]: 'not-a-list' } }).problems.length, 1, key)
  }
  const both = buildProjectConfig({ projects: { wip: ['same'], forks: ['same'] } })
  assert.equal(both.problems.length, 1)
})

test('a repo can be both featured and hackathon', () => {
  const cfg = buildProjectConfig({ projects: { featured: ['x'], hackathon: ['x'] } })
  assert.deepEqual(tagsFor(repo('x'), cfg), ['featured', 'hackathon'])
})

test('prototype repo names never match anything', () => {
  for (const key of PROTOTYPE_KEYS) {
    assert.equal(categorize(repo(key), config), 'active', key)
    assert.equal(categorize(repo(key, { fork: true }), config), null, key)
    assert.deepEqual(tagsFor(repo(key), config), [], key)
  }
})

test('search matches name, description, language and tags, ignoring case, as plain text', () => {
  const r = { ...repo('Hello-World', { description: 'A Nuxt site', language: 'Vue' }), tags: ['pwa', 'gear'] }
  assert.equal(matchesQuery(r, ''), true)
  assert.equal(matchesQuery(r, '  '), true)
  assert.equal(matchesQuery(r, 'hello'), true)
  assert.equal(matchesQuery(r, 'NUXT'), true)
  assert.equal(matchesQuery(r, 'vue'), true)
  assert.equal(matchesQuery(r, 'gear'), true)
  assert.equal(matchesQuery(r, 'nothing'), false)
  // A hashtag search finds the tag, as the chips show it
  assert.equal(matchesQuery(r, '#gear'), true)
  assert.equal(matchesQuery(r, '#PWA'), true)
  assert.equal(matchesQuery(r, '#'), true)
  for (const q of ['.*', '(a+)+$', '[', ...XSS_HTML, ...JS_BREAKOUTS, REDOS.slice(0, 500)]) {
    assert.equal(matchesQuery(r, q), false, q.slice(0, 30))
  }
  assert.equal(matchesQuery({ ...repo('x', { description: 'a.*b' }), tags: [] }, '.*'), true)
  assert.equal(matchesQuery(r, null), true)
})

test('sorting uses only the keys we define, and featured goes first', () => {
  const items = [
    { ...repo('b', { stargazers_count: 1, updated_at: '2026-01-01' }), tags: [] },
    { ...repo('a', { stargazers_count: 5, updated_at: '2026-03-01' }), tags: [] },
    { ...repo('c', { updated_at: '2025-01-01' }), tags: ['featured'] }
  ]
  assert.equal([...items].sort(sorter('name'))[0].name, 'a')
  assert.equal([...items].sort(sorter('stars'))[0].name, 'a')
  assert.equal([...items].sort(sorter('updated'))[0].name, 'a')
  assert.equal([...items].sort(sorter('featured'))[0].name, 'c')
  for (const key of [...PROTOTYPE_KEYS, 'nope', undefined]) {
    assert.equal(sorter(key), sorter('updated'), String(key))
  }
})

test('the tag filter shows only repos with that tag, and combines with status and search', () => {
  const projects = list([
    repo('hanselwei.dev', { topics: ['nuxt'], updated_at: '2026-02-01' }),
    repo('HackNC2019', { fork: true, language: 'Python' }),
    repo('gear-tracker', { topics: ['gear'] })
  ])
  assert.deepEqual(visibleProjects(projects, { tag: 'hackathon' }).map(p => p.name), ['HackNC2019'])
  assert.deepEqual(visibleProjects(projects, { tag: 'featured' }).map(p => p.name), ['hanselwei.dev'])
  assert.deepEqual(visibleProjects(projects, { tag: 'nuxt', filter: 'active' }).map(p => p.name), ['hanselwei.dev'])
  assert.deepEqual(visibleProjects(projects, { tag: 'nuxt', filter: 'fork' }).map(p => p.name), [])
  assert.deepEqual(visibleProjects(projects, { tag: 'gear', query: 'python' }).map(p => p.name), [])
  assert.equal(visibleProjects(projects, { tag: null }).length, 3)
  // An unknown filter matches nothing (the store refuses to set one)
  assert.equal(visibleProjects(projects, { filter: 'nope' }).length, 0)
})

test('filters are the four known chips', () => {
  assert.deepEqual(FILTERS, ['all', 'active', 'wip', 'fork'])
})

test('the generated config module is data only', async () => {
  const source = projectsModule({ wip: new Set(['b', 'a']), forks: new Set(['iole-python']), featured: new Set(['x']), hackathon: new Set() })
  const mod = await import(`data:text/javascript,${encodeURIComponent(source)}`)
  assert.deepEqual(mod.default, { projects: { wip: ['a', 'b'], forks: ['iole-python'], featured: ['x'], hackathon: [] } })
  assert.doesNotMatch(source.replace(/^\/\/.*\n/, ''), /[`$\\]|import|require|\(/)
})
