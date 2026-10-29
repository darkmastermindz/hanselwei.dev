// The open-source credits list keeps itself up to date: every package in package.json (plus the
// libraries that come with Nuxt), at the installed version, with details from the package.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCredits, creditTargets, INCLUDED, plainText } from '../../utils/credits.mjs'
import pkg from '../../package.json' with { type: 'json' }
import lock from '../../package-lock.json' with { type: 'json' }

test('every dependency of the site is credited, at its installed version, with nothing hand-kept', () => {
  const targets = creditTargets(pkg, lock)
  const names = targets.map(t => t.name)
  const local = name => lock.packages[`node_modules/${name}`]?.link
  for (const name of Object.keys(pkg.dependencies)) assert.ok(local(name) || names.includes(name), name)
  for (const name of Object.keys(pkg.devDependencies)) assert.ok(local(name) || names.includes(name), name)
  for (const name of Object.keys(INCLUDED)) assert.ok(names.includes(name), name)
  assert.equal(new Set(names).size, names.length, 'each once')
  for (const target of targets) {
    assert.equal(target.version, lock.packages[`node_modules/${target.name}`].version, target.name)
    assert.ok(['site', 'build'].includes(target.group))
  }
  assert.equal(targets.find(t => t.name === 'nuxt').group, 'site')
  assert.equal(targets.find(t => t.name === 'sass').group, 'build')
})

test('a new dependency shows up without touching the credits code', () => {
  const next = { ...pkg, dependencies: { ...pkg.dependencies, 'left-pad': '^1.3.0' } }
  const nextLock = { packages: { ...lock.packages, 'node_modules/left-pad': { version: '1.3.0', license: 'WTFPL' } } }
  const added = creditTargets(next, nextLock).find(t => t.name === 'left-pad')
  assert.deepEqual(added, { name: 'left-pad', group: 'site', version: '1.3.0', license: 'WTFPL' })
})

test('details come from the package; when that fails, the lockfile still gives version and license', async () => {
  const credits = await buildCredits({
    pkg: { dependencies: { marked: '^14' } },
    lock: { packages: { 'node_modules/marked': { version: '14.1.4', license: 'MIT' } } },
    packageInfo: async () => {
      throw new Error('registry down')
    },
    licenseText: async () => {
      throw new Error('cdn down')
    }
  })
  const marked = credits.packages.find(p => p.name === 'marked')
  assert.equal(marked.version, '14.1.4')
  assert.equal(marked.license, 'MIT')
  assert.equal(marked.url, 'https://www.npmjs.com/package/marked') // no GitHub link known: the npm page
  assert.equal(marked.copyright, null)
  assert.ok(credits.fonts.length >= 1)
})

test('npm descriptions are plain one-line text', () => {
  assert.equal(plainText('  A fast\nmarkdown   parser  '), 'A fast markdown parser')
  assert.equal(plainText('a <b>bold</b> one'), 'a bbold/b one')
  for (const tricky of ['<scr<script>ipt>alert(1)</script>', '<<img src=x onerror=1>>', '<a href=x>']) {
    assert.doesNotMatch(plainText(tricky), /[<>]/, tricky)
  }
  assert.equal(plainText('x'.repeat(500)).length, 160)
  assert.equal(plainText(''), null)
  assert.equal(plainText(42), null)
})

test("the site's own local packages aren't credited", () => {
  const next = { ...pkg, devDependencies: { ...pkg.devDependencies, 'my-lib': 'file:packages/my-lib' } }
  const nextLock = { packages: { ...lock.packages, 'node_modules/my-lib': { resolved: 'packages/my-lib', link: true } } }
  assert.equal(creditTargets(next, nextLock).find(t => t.name === 'my-lib'), undefined)
})
