// Security headers live in netlify.toml (fixed) and the generated CSP (scripts/lib/csp.mjs).
// This keeps either from being weakened or dropped without a failing test.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildCsp, handlerHashes, inlineScriptHashes } from '../../scripts/lib/csp.mjs'

const toml = parse(await readFile(new URL('../../netlify.toml', import.meta.url), 'utf8'))
const headersFor = path => Object.assign({}, ...toml.headers.filter(h => h.for === path).map(h => h.values))

const directives = policy =>
  Object.fromEntries(policy.split(';').map(d => d.trim().split(/\s+/)).map(([name, ...values]) => [name, values]))

test('every response gets the security headers', () => {
  const h = headersFor('/*')
  assert.match(h['Strict-Transport-Security'], /max-age=(\d{8,})/)
  assert.ok(Number(h['Strict-Transport-Security'].match(/max-age=(\d+)/)[1]) >= 31536000)
  assert.equal(h['X-Content-Type-Options'], 'nosniff')
  assert.equal(h['X-Frame-Options'], 'DENY')
  assert.equal(h['Referrer-Policy'], 'strict-origin-when-cross-origin')
  for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) assert.match(h['Permissions-Policy'], new RegExp(`${feature}=\\(\\)`))
  assert.equal(h['Cross-Origin-Opener-Policy'], 'same-origin-allow-popups')
  assert.equal(headersFor('/api/*')['X-Robots-Tag'], 'noindex')
})

test('the CSP only runs this site\'s scripts', () => {
  const csp = directives(buildCsp({ scripts: ["'sha256-abc='"], handlers: ["'sha256-def='"] }))
  assert.deepEqual(csp['default-src'], ["'self'"])
  assert.deepEqual(csp['script-src'], ["'self'", "'sha256-abc='", "'unsafe-hashes'", "'sha256-def='"])
  for (const loose of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:', 'blob:', "'strict-dynamic'"]) {
    assert.ok(!csp['script-src'].includes(loose), loose)
  }
  assert.deepEqual(csp['object-src'], ["'none'"])
  assert.deepEqual(csp['frame-ancestors'], ["'none'"])
  assert.deepEqual(csp['base-uri'], ["'self'"])
  assert.deepEqual(csp['form-action'], ["'self'"])
  assert.ok(!csp['connect-src'].includes('*') && !csp['connect-src'].includes('https:'))
  assert.ok('upgrade-insecure-requests' in csp)
  // With no inline handlers, 'unsafe-hashes' isn't added at all
  assert.ok(!directives(buildCsp({ scripts: [] }))['script-src'].includes("'unsafe-hashes'"))
})

test('only executable inline scripts and handlers are hashed', () => {
  const html = `<script>window.a=1</script><script type="application/json">{"x":1}</script>
    <script src="/_nuxt/a.js"></script><script type="module">import "/a.js"</script>
    <link rel="preload" onload="this.onload=null;this.rel='stylesheet'">`
  assert.equal(inlineScriptHashes(html).size, 2)
  // End tags browsers accept with whitespace or junk before ">" still close the script
  assert.deepEqual([...inlineScriptHashes('<script>window.b=1</script >')], [...inlineScriptHashes('<script>window.b=1</script>')])
  assert.equal(inlineScriptHashes('<SCRIPT>window.c=1</SCRIPT\n foo>').size, 1)
  assert.deepEqual([...handlerHashes(html)], ["'sha256-1jAmyYXcRq6zFldLe/GCgIDJBiOONdXjTLgEFMDnDSM='"])
})

test('sign-in and session responses are never cached', () => {
  assert.equal(headersFor('/api/me')['Cache-Control'], 'private, no-store')
  assert.equal(headersFor('/api/auth/*')['Cache-Control'], 'private, no-store')
})
