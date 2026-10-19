// The credits page (/credits) links to each package's GitHub repository, read from the
// package.json of installed packages at build time. Only real https://github.com links get
// through; license ids and copyright lines are plain text.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { copyrightLine, licenseId, packageUrl, repoUrl } from '../../utils/credits.mjs'
import { JS_BREAKOUTS, PROTOTYPE_KEYS, UNSAFE_URLS, XSS_HTML } from './payloads.mjs'

test('every package.json repository format becomes a GitHub link', () => {
  const vue = 'https://github.com/vuejs/core'
  for (const repository of [
    'vuejs/core',
    'github:vuejs/core',
    'git+https://github.com/vuejs/core.git',
    'https://github.com/vuejs/core.git#v3',
    'git://github.com/vuejs/core.git',
    'git@github.com:vuejs/core.git',
    'git+ssh://git@github.com/vuejs/core.git',
    { type: 'git', url: 'git+https://github.com/vuejs/core.git' }
  ]) {
    assert.equal(repoUrl(repository), vue, JSON.stringify(repository))
  }
})

test('anything that is not a GitHub repository gets no link', () => {
  for (const repository of [
    ...UNSAFE_URLS,
    ...XSS_HTML,
    ...JS_BREAKOUTS,
    ...PROTOTYPE_KEYS,
    'https://gitlab.com/owner/repo',
    'https://github.com.evil.example/owner/repo',
    'https://evil.example/github.com/owner/repo',
    'https://github.com/owner',
    'https://github.com/owner/repo/../../evil',
    'javascript:alert(1)//github.com/a/b',
    '',
    null,
    undefined,
    42,
    { url: 42 }
  ]) {
    assert.equal(repoUrl(repository), null, JSON.stringify(repository))
  }
})

test('a monorepo package links to its folder, never outside the repo', () => {
  const repo = 'https://github.com/nuxt/nuxt'
  assert.equal(packageUrl({ url: 'x', directory: 'packages/nuxt' }, repo), `${repo}/tree/HEAD/packages/nuxt`)
  assert.equal(packageUrl({ url: 'x', directory: '../../evil' }, repo), repo)
  assert.equal(packageUrl({ url: 'x', directory: '<script>' }, repo), repo)
  assert.equal(packageUrl('nuxt/nuxt', repo), repo)
  assert.equal(packageUrl({ directory: 'packages/x' }, null), null)
})

test('license ids and copyright lines are short plain text', () => {
  assert.equal(licenseId('MIT'), 'MIT')
  assert.equal(licenseId('(MIT OR Apache-2.0)'), '(MIT OR Apache-2.0)')
  assert.equal(licenseId({ type: 'BSD-3-Clause' }), 'BSD-3-Clause')
  for (const bad of [...XSS_HTML, ...JS_BREAKOUTS, 'x'.repeat(100), null, 42]) assert.equal(licenseId(bad), null)

  assert.equal(copyrightLine('MIT License\n\nCopyright (c) 2018-present, Yuxi (Evan) You\n\nPermission…'), 'Copyright (c) 2018-present, Yuxi (Evan) You')
  assert.equal(copyrightLine('No notice here'), null)
  assert.equal(copyrightLine(null), null)
  assert.ok(copyrightLine(`Copyright ${'x'.repeat(500)}`).length <= 200)
})

test('hostile registry data never becomes a link or markup', async () => {
  const { buildCredits } = await import('../../utils/credits.mjs')
  for (const payload of [...UNSAFE_URLS, ...XSS_HTML, ...JS_BREAKOUTS]) {
    const credits = await buildCredits({
      pkg: { dependencies: { marked: '^14' } },
      lock: { packages: { 'node_modules/marked': { version: '14.1.4', license: 'MIT' } } },
      packageInfo: async () => ({ repository: payload, license: payload, description: payload }),
      licenseText: async () => `Copyright ${payload}`
    })
    for (const entry of credits.packages) {
      assert.ok(entry.url === `https://www.npmjs.com/package/${entry.name}` || entry.url.startsWith('https://github.com/'), entry.url)
      assert.doesNotMatch(entry.use ?? '', /<[a-z/!]/i)
      assert.ok(entry.license === null || /^[\w.+() -]+$/.test(entry.license), entry.license)
    }
  }
})

test('package names that are not npm names are never fetched', async () => {
  const { creditTargets } = await import('../../utils/credits.mjs')
  const names = ['../../etc/passwd', 'a b', '<script>', '@scope/../x', 'http://evil.example', ...PROTOTYPE_KEYS.filter(k => k.startsWith('_'))]
  const targets = creditTargets({ dependencies: Object.fromEntries(names.map(n => [n, '1'])) }, {})
  assert.deepEqual(targets.map(t => t.name).filter(n => names.includes(n)), [])
})

test('the /api/credits function answers from the registry and caches at the CDN', async () => {
  const { creditsResponse, headers, resetCreditsCache } = await import('../../netlify/functions/credits.mjs')
  resetCreditsCache()
  const requested = []
  const fakeFetch = async url => {
    requested.push(url)
    if (url.startsWith('https://registry.npmjs.org/')) {
      return new Response(JSON.stringify({ repository: 'git+https://github.com/example/pkg.git', license: 'MIT', description: 'Example' }))
    }
    if (url.startsWith('https://data.jsdelivr.com/')) return new Response(JSON.stringify({ files: [{ name: '/LICENSE' }] }))
    return new Response('MIT License\n\nCopyright (c) 2024 Example')
  }
  const response = await creditsResponse(fakeFetch, 1_000_000)
  const body = await response.json()
  assert.ok(body.packages.length >= 10)
  assert.ok(body.packages.every(p => p.url === 'https://github.com/example/pkg' && p.copyright === 'Copyright (c) 2024 Example'))
  assert.ok(requested.every(url => /^https:\/\/(registry\.npmjs\.org|data\.jsdelivr\.com|cdn\.jsdelivr\.net)\//.test(url)), 'only the expected hosts')
  assert.match(headers['netlify-cdn-cache-control'], /s-maxage=86400/)
  // A warm function reuses its answer for an hour
  const before = requested.length
  await creditsResponse(fakeFetch, 1_000_000 + 60_000)
  assert.equal(requested.length, before)
  resetCreditsCache()
})
