// cover_image, canonical_url and link come from front matter (or the dev.to API) and are
// bound to :src/:href, which Vue does not filter: only http(s) and site paths get through.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeUrl } from '../../utils/safeUrl.js'
import { toPost } from '../../server/utils/blog.js'
import { opensXp } from '../../utils/aboutCard.js'
import { UNSAFE_URLS, SAFE_URLS, PROTOTYPE_KEYS, XSS_HTML } from './payloads.mjs'

// The home page reads location.hash to open the About card on XP: nothing else switches it
test('hostile URL hashes never switch the About card', () => {
  for (const value of [...UNSAFE_URLS, ...XSS_HTML, ...PROTOTYPE_KEYS, null, undefined, 42, {}, ['#xp']]) {
    assert.equal(opensXp(value), false, JSON.stringify(value))
    if (typeof value === 'string') assert.equal(opensXp(`#${value}`), false, value)
  }
})

test('unsafe URLs are dropped', () => {
  for (const url of [...UNSAFE_URLS, ...PROTOTYPE_KEYS, '', '   ', null, undefined, 42, {}, ['https://x.example']]) {
    assert.equal(safeUrl(url), null, JSON.stringify(url))
  }
})

test('normal URLs are kept as they are', () => {
  for (const url of SAFE_URLS) assert.equal(safeUrl(url), url)
})

test('post URL fields are filtered when a post is read', () => {
  for (const url of UNSAFE_URLS) {
    const source = `---\ntitle: "x"\ncover_image: ${JSON.stringify(url)}\ncanonical_url: ${JSON.stringify(url)}\nlink: ${JSON.stringify(url)}\n---\n\nBody`
    const post = toPost('devto:x.md', source)
    assert.equal(post.cover, null, url)
    assert.equal(post.canonical, null, url)
    assert.equal(post.link, null, url)
  }
  const ok = toPost('x.md', '---\ncover_image: "https://res.cloudinary.com/x.png"\ncanonical_url: "https://dev.to/hansel/x"\n---\n\nBody')
  assert.equal(ok.cover, 'https://res.cloudinary.com/x.png')
  assert.equal(ok.canonical, 'https://dev.to/hansel/x')
})
