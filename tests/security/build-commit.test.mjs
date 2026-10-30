// The footer's owner-only "Build abc1234" line (components/SiteFooter.vue) shows the commit the
// build came from. It reads the build environment, so only a full commit hash may get through,
// and the link it makes always points at this repository on GitHub.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCommit, commitUrl } from '../../utils/buildCommit.mjs'
import { safeUrl } from '../../utils/safeUrl.js'
import { BAD_COMMITS } from './payloads.mjs'

const SHA = '8e48e59c387a7ad7650268f6bb9d2addad978d04'

test('Netlify, then GitHub Actions, then git', () => {
  assert.equal(buildCommit({ COMMIT_REF: SHA, GITHUB_SHA: 'b'.repeat(40) }), SHA)
  assert.equal(buildCommit({ GITHUB_SHA: SHA }), SHA)
  assert.equal(buildCommit({}, () => `${SHA}\n`), SHA)
  assert.equal(buildCommit({ COMMIT_REF: SHA.toUpperCase() }), SHA)
})

test('no commit when there is none to be had', () => {
  assert.equal(buildCommit(), null)
  assert.equal(buildCommit({}), null)
  assert.equal(buildCommit({}, () => { throw new Error('not a git repository') }), null)
})

test('hostile or malformed values never pass as a commit', () => {
  for (const bad of BAD_COMMITS) {
    assert.equal(buildCommit({ COMMIT_REF: bad }), null, JSON.stringify(String(bad)))
    assert.equal(buildCommit({ GITHUB_SHA: bad }), null, JSON.stringify(String(bad)))
    assert.equal(buildCommit({}, () => bad), null, JSON.stringify(String(bad)))
    assert.equal(commitUrl(bad), null, JSON.stringify(String(bad)))
  }
})

test('a bad Netlify value falls through to the next source', () => {
  assert.equal(buildCommit({ COMMIT_REF: '<script>', GITHUB_SHA: SHA }), SHA)
})

test('the link is a safe https link to this repository', () => {
  const url = commitUrl(SHA)
  assert.equal(url, `https://github.com/darkmastermindz/hanselwei.dev/commit/${SHA}`)
  assert.equal(safeUrl(url), url)
})
