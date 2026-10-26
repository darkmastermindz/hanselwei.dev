// The Gear updates workflow signs in to the site with GitHub Actions' own token (no stored secret):
// netlify/lib/githubOidc.mjs and /api/gear/pending must take only a genuine token from GitHub, for
// this repository's gear-updates.yml on main, and nothing else
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSign, createHmac, generateKeyPairSync } from 'node:crypto'
import { GITHUB_OIDC_ISSUER, githubKey, verifyGithubOidc } from '../../netlify/lib/githubOidc.mjs'
import { GEAR_AUDIENCE, GEAR_REPOSITORY, GEAR_WORKFLOW_REF, handlePending } from '../../netlify/functions/gear-pending.mjs'
import { BAD_BEARER_TOKENS, PATH_TRAVERSAL, PROTOTYPE_KEYS } from './payloads.mjs'

// A stand-in for GitHub's signing key, and another key nobody trusts
const pair = () => generateKeyPairSync('rsa', { modulusLength: 2048 })
const github = pair()
const stranger = pair()
const KID = 'gh-key-1'
const jwk = { ...github.publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }
const getKey = async kid => (kid === KID ? jwk : null)

const NOW = Date.UTC(2026, 9, 26, 3)
const T = Math.floor(NOW / 1000)
const b64 = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')
const goodClaims = {
  iss: GITHUB_OIDC_ISSUER,
  aud: GEAR_AUDIENCE,
  repository: GEAR_REPOSITORY,
  job_workflow_ref: GEAR_WORKFLOW_REF,
  ref: 'refs/heads/main',
  iat: T - 10,
  nbf: T - 10,
  exp: T + 300
}
const jwt = ({ claims = {}, header = {}, key = github.privateKey } = {}) => {
  const head = b64({ alg: 'RS256', typ: 'JWT', kid: KID, ...header })
  const body = b64({ ...goodClaims, ...claims })
  const signature = createSign('RSA-SHA256').update(`${head}.${body}`).sign(key).toString('base64url')
  return `${head}.${body}.${signature}`
}
const expect = { repository: GEAR_REPOSITORY, job_workflow_ref: GEAR_WORKFLOW_REF, ref: 'refs/heads/main' }
const check = token => verifyGithubOidc(token, { audience: GEAR_AUDIENCE, expect, now: NOW, getKey })

test('a genuine token for this workflow on main is accepted', async () => {
  const claims = await check(jwt())
  assert.equal(claims.repository, GEAR_REPOSITORY)
  assert.ok(await check(jwt({ claims: { aud: ['other', GEAR_AUDIENCE] } })))
})

test('tokens signed wrong are refused: no signature, a shared-secret signature, another key, tampering', async () => {
  const [head, body] = jwt().split('.')
  assert.equal(await check(`${b64({ alg: 'none', kid: KID })}.${body}.`), null)
  // HS256 "signed" with GitHub's public key (the classic algorithm mix-up)
  const hsHead = b64({ alg: 'HS256', kid: KID })
  const hs = createHmac('sha256', JSON.stringify(jwk)).update(`${hsHead}.${body}`).digest('base64url')
  assert.equal(await check(`${hsHead}.${body}.${hs}`), null)
  assert.equal(await check(jwt({ key: stranger.privateKey })), null)
  assert.equal(await check(jwt({ header: { kid: 'unknown' } })), null)
  const forged = b64({ ...goodClaims, repository: 'evil/repo' })
  assert.equal(await check(`${head}.${forged}.${jwt().split('.')[2]}`), null)
  for (const token of BAD_BEARER_TOKENS) assert.equal(await check(token), null, token.slice(0, 40))
})

test('tokens for anyone or anything else are refused', async () => {
  const wrong = [
    { iss: 'https://evil.example' },
    { aud: 'sts.amazonaws.com' },
    { aud: [] },
    { repository: 'someone/hanselwei.dev' },
    { job_workflow_ref: `${GEAR_REPOSITORY}/.github/workflows/other.yml@refs/heads/main` },
    { job_workflow_ref: `${GEAR_REPOSITORY}/.github/workflows/gear-updates.yml@refs/heads/my-branch` },
    { job_workflow_ref: `${GEAR_REPOSITORY}/.github/workflows/gear-updates.yml@refs/pull/7/merge` },
    { ref: 'refs/heads/gear-updates' },
    { exp: T - 3600 },
    { exp: undefined },
    { nbf: T + 3600 },
    { iat: T + 3600 },
    { iat: 'yesterday' }
  ]
  for (const claims of wrong) assert.equal(await check(jwt({ claims })), null, JSON.stringify(claims))
})

test("GitHub's keys are fetched once and kept, and fetched again (not too often) for a new key", async () => {
  let loads = 0
  const load = async () => (loads++, [jwk])
  const t = Date.UTC(2030, 0, 1)
  assert.deepEqual(await githubKey(KID, t, load), jwk)
  assert.deepEqual(await githubKey(KID, t + 1000, load), jwk)
  assert.equal(loads, 1)
  assert.equal(await githubKey('new-key', t + 2000, load), null)
  assert.equal(loads, 1, 'not again within a minute')
  assert.equal(await githubKey('new-key', t + 61_000, load), null)
  assert.equal(await githubKey('new-key', t + 62_000, load), null)
  assert.equal(loads, 2, 'an unknown key fetches again, at most once a minute')
  // GitHub unreachable later: the keys it had still work
  assert.deepEqual(await githubKey(KID, t + 2 * 3600_000, async () => { throw new Error('down') }), jwk)
})

// /api/gear/pending with a stand-in store
const memoryStore = entries => {
  const blobs = new Map(Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)]))
  return {
    blobs,
    list: async ({ prefix }) => ({ blobs: [...blobs.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key, etag: '"1"' })) }),
    get: async (key, { type } = {}) => (blobs.has(key) ? (type === 'json' ? JSON.parse(blobs.get(key)) : blobs.get(key)) : null),
    delete: async key => void blobs.delete(key)
  }
}
const edit = { list: 'camera', ops: '[{"op":"remove","id":"x-t5"}]', token: 't', at: '2026-10-26T01:00:00.000Z' }
const verifyToken = (token, options) => verifyGithubOidc(token, { ...options, now: NOW, getKey })
const pending = (store, { method = 'GET', token = jwt(), body } = {}) =>
  handlePending(
    new Request('https://www.hanselwei.dev/api/gear/pending', {
      method,
      headers: { ...(token !== null && { authorization: `Bearer ${token}` }), 'content-type': 'application/json' },
      ...(body !== undefined && { body: typeof body === 'string' ? body : JSON.stringify(body) })
    }),
    { store, verifyToken }
  )

test('only the workflow can read or delete pending edits', async () => {
  const store = memoryStore({ 'pending/2026-10-26T01-00-00-000Z-aaaaaaaaaaaa': edit })
  for (const token of [null, ...BAD_BEARER_TOKENS, jwt({ key: stranger.privateKey }), jwt({ claims: { ref: 'refs/heads/x' } })]) {
    assert.equal((await pending(store, { token })).status, 401)
    assert.equal((await pending(store, { method: 'DELETE', token, body: { keys: ['pending/2026-10-26T01-00-00-000Z-aaaaaaaaaaaa'] } })).status, 401)
  }
  assert.equal(store.blobs.size, 1, 'nothing deleted')
  assert.equal((await pending(store, { method: 'POST', body: '{}' })).status, 405)
})

test('the workflow gets the pending edits oldest first, and deletes only pending ones', async () => {
  const store = memoryStore({
    'pending/2026-10-26T02-00-00-000Z-bbbbbbbbbbbb': { ...edit, at: '2026-10-26T02:00:00.000Z' },
    'pending/2026-10-26T01-00-00-000Z-aaaaaaaaaaaa': edit,
    'other/keep': { x: 1 }
  })
  const { submissions } = await (await pending(store)).json()
  assert.deepEqual(submissions.map(s => s.key), ['pending/2026-10-26T01-00-00-000Z-aaaaaaaaaaaa', 'pending/2026-10-26T02-00-00-000Z-bbbbbbbbbbbb'])
  assert.deepEqual(Object.keys(submissions[0]).sort(), ['at', 'key', 'list', 'ops', 'token'])

  for (const keys of [['other/keep'], ['pending/../other/keep'], ...PATH_TRAVERSAL.filter(p => !/^[0-9A-Za-z-]+$/.test(p)).map(p => [`pending/${p}`]), ...PROTOTYPE_KEYS.map(k => [k]), 'pending/x', [1], Array(501).fill('pending/x')]) {
    assert.equal((await pending(store, { method: 'DELETE', body: { keys } })).status, 400, JSON.stringify(keys).slice(0, 60))
  }
  assert.equal((await pending(store, { method: 'DELETE', body: '{nope' })).status, 400)
  assert.equal(store.blobs.size, 3)
  const res = await pending(store, { method: 'DELETE', body: { keys: ['pending/2026-10-26T01-00-00-000Z-aaaaaaaaaaaa'] } })
  assert.deepEqual(await res.json(), { deleted: 1 })
  assert.deepEqual([...store.blobs.keys()].sort(), ['other/keep', 'pending/2026-10-26T02-00-00-000Z-bbbbbbbbbbbb'])
})
