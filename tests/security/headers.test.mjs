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
  assert.deepEqual(csp['script-src'], ["'self'", 'https://scripts.simpleanalyticscdn.com', "'sha256-abc='", "'unsafe-hashes'", "'sha256-def='"])
  for (const loose of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:', 'blob:', "'strict-dynamic'"]) {
    assert.ok(!csp['script-src'].includes(loose), loose)
  }
  assert.deepEqual(csp['object-src'], ["'none'"])
  assert.deepEqual(csp['frame-ancestors'], ["'none'"])
  assert.deepEqual(csp['base-uri'], ["'self'"])
  assert.deepEqual(csp['form-action'], ["'self'"])
  assert.ok(!csp['connect-src'].includes('*') && !csp['connect-src'].includes('https:'))
  assert.ok('upgrade-insecure-requests' in csp)
  // The report-only policy on deploy previews leaves it out (browsers ignore it there and warn)
  assert.ok(!('upgrade-insecure-requests' in directives(buildCsp({ reportOnly: true }))))
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

// Nuxt 4 loads the app through an inline import map ("#entry" -> the entry chunk). Browsers
// apply script-src to import maps too: without its hash the map is blocked and no script runs.
test('inline import maps are hashed', () => {
  const map = '{"imports":{"#entry":"/_nuxt/Dlgq0opj.js"}}'
  const hashes = inlineScriptHashes(`<script type="importmap">${map}</script><script type="application/json">{}</script>`)
  assert.deepEqual([...hashes], [...inlineScriptHashes(`<script>${map}</script>`)])
  assert.equal(inlineScriptHashes(`<script type="ImportMap">${map}</script>`).size, 1)
})

test('sign-in and session responses are never cached', () => {
  assert.equal(headersFor('/api/me')['Cache-Control'], 'private, no-store')
  assert.equal(headersFor('/api/auth/*')['Cache-Control'], 'private, no-store')
})

// Simple Analytics is added to every page by the site's Netlify settings; the enforced CSP was
// blocking it. Only its script host and its report queue are allowed, nothing broader.
test('Simple Analytics can load and report, and nothing else is opened up', () => {
  const csp = directives(buildCsp())
  const external = list => list.filter(v => /^https:\/\//.test(v))
  assert.deepEqual(external(csp['script-src']), ['https://scripts.simpleanalyticscdn.com'])
  assert.deepEqual(external(csp['connect-src']), ['https://api.github.com', 'https://queue.simpleanalyticscdn.com'])
})

// netlify.toml [images] lets the Image CDN fetch the coin photos (utils/coinFaces.mjs). Anything
// else it allowed could be fetched through hanselwei.dev: only those two exact images may match.
test("the Image CDN only fetches the coin's two photos", async () => {
  const { COIN_FACES } = await import('../../utils/coinFaces.mjs')
  const allowed = toml.images.remote_images.map(pattern => new RegExp(`^(?:${pattern})$`))
  const fetches = url => allowed.some(re => re.test(url))
  for (const face of COIN_FACES) assert.ok(fetches(face.src), face.src)
  for (const url of [
    'https://evil.example/x.png',
    'https://avatars.githubusercontent.com/u/1?v=4',
    'https://avatars.githubusercontent.com.evil.example/u/6164335?v=4',
    'https://avatarsXgithubusercontent.com/u/6164335?v=4',
    'https://1.gravatar.com/avatar/00000000000000000000000000000000?size=720',
    'https://2.gravatar.com/avatar/821b2e292cc6a6668358a74625d89a477f395929456bf9f30db01c059de56fd2?size=720',
    'http://avatars.githubusercontent.com/u/6164335?v=4',
    'javascript:alert(1)'
  ]) {
    assert.equal(fetches(url), false, url)
  }
})
