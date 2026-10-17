// CODEOWNERS and config.toml become a generated JS module that the Identity functions
// import, so hostile entries must be refused and the output must stay pure data.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accessModule, buildAllowList, isEmail } from '../../scripts/lib/access.mjs'
import { JS_BREAKOUTS, XSS_HTML, PROTOTYPE_KEYS } from './payloads.mjs'

const HOSTILE_EMAILS = [
  'a"b@x.example',
  'a\\b@x.example',
  '<a@x.example>',
  'a b@x.example',
  'a@x.example\nb@y.example',
  'a@x.example\u0000',
  'a@x',
  '@x.example',
  'a@.example',
  ...JS_BREAKOUTS.map(p => `${p}@x.example`),
  `${'a'.repeat(250)}@x.example`
]

test('only plain email addresses are accepted', () => {
  for (const email of HOSTILE_EMAILS) assert.equal(isEmail(email), false, JSON.stringify(email))
  for (const email of ['hello@hanselwei.dev', 'first.last+tag@sub.example.co']) assert.equal(isEmail(email), true, email)
})

test('hostile config entries fail the build instead of reaching the list', () => {
  for (const email of [...HOSTILE_EMAILS, ...XSS_HTML]) {
    const fromAdditional = buildAllowList({ codeowners: '', config: { access: { additional: [email] } } })
    assert.equal(fromAdditional.emails.length, 0, email)
    assert.equal(fromAdditional.problems.length, 1, email)

    const fromGithub = buildAllowList({ codeowners: '* @someone', config: { access: { github: { someone: email } } } })
    assert.equal(fromGithub.emails.length, 0, email)
    assert.ok(fromGithub.problems.length > 0, email)
  }
})

test('prototype keys do not resolve to emails', () => {
  for (const key of PROTOTYPE_KEYS) {
    const { emails, problems } = buildAllowList({ codeowners: `* @${key}`, config: { access: { github: {} } } })
    assert.deepEqual(emails, [])
    assert.equal(problems.length, 1, key)
  }
})

test('the real owner still resolves', () => {
  const { emails, problems } = buildAllowList({
    codeowners: '# comment\n* @darkmastermindz\n/docs/ Extra@Example.com',
    config: { access: { additional: [], github: { darkmastermindz: 'hello@hanselwei.dev' } } }
  })
  assert.deepEqual(problems, [])
  assert.deepEqual(emails, ['extra@example.com', 'hello@hanselwei.dev'])
})

test('the generated module is only data', async () => {
  const source = accessModule(['hello@hanselwei.dev'])
  const mod = await import(`data:text/javascript,${encodeURIComponent(source)}`)
  assert.deepEqual(mod.default, { emails: ['hello@hanselwei.dev'] })
  assert.doesNotMatch(source.replace(/^\/\/.*\n/, ''), /[`$\\]|import|require|\(/)
})
