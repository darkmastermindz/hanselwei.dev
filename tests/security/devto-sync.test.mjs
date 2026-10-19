// The dev.to sync turns article slugs into file names and article fields into front
// matter: neither may escape content/blog/devto/ or add front matter keys.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { convertLiquidTags, frontMatter, isMirroredFile, safeSlug } from '../../scripts/lib/devto.mjs'
import { parseFrontMatter } from '../../server/utils/blog.js'
import { FRONT_MATTER_BREAKS, PATH_TRAVERSAL, PROTOTYPE_KEYS, REDOS } from './payloads.mjs'

test('slugs that could leave the folder are refused', () => {
  for (const slug of [...PATH_TRAVERSAL, null, undefined, 42, {}]) assert.equal(safeSlug(slug), false, JSON.stringify(slug))
  for (const slug of ['hello-world', 'my-first-post-4k2j', '2026-recap']) assert.equal(safeSlug(slug), true, slug)
})

test('only mirrored post files can be deleted', () => {
  for (const name of ['README.md', '.gitkeep', '../x.md', 'notes.txt', '.md', 'a b.md']) assert.equal(isMirroredFile(name), false, name)
  assert.equal(isMirroredFile('hello-world.md'), true)
})

test('article fields cannot add or change front matter keys', () => {
  for (const payload of FRONT_MATTER_BREAKS) {
    const source = frontMatter({ title: payload, description: payload, slug: 'ok', tags: [payload] }) + 'Body'
    const { data, content } = parseFrontMatter(source)
    assert.deepEqual(Object.keys(data).sort(), ['description', 'slug', 'tags', 'title'], payload)
    assert.equal(data.title, payload)
    assert.equal(data.slug, 'ok')
    assert.equal(data.draft, undefined)
    assert.equal(content.trim(), 'Body')
  }
})

test('prototype keys in front matter stay plain data', () => {
  for (const key of PROTOTYPE_KEYS) {
    const { data } = parseFrontMatter(`---\n${key}: "x"\ntitle: "t"\n---\n`)
    assert.equal(Object.getPrototypeOf({}).polluted, undefined)
    assert.equal(data.title, 't')
  }
  parseFrontMatter('---\n__proto__: {"polluted": true}\n---\n')
  assert.equal({}.polluted, undefined)
})

test('liquid tags never become script URLs and stay fast', () => {
  const out = convertLiquidTags('{% embed javascript:alert(1) %} {% github x/y %} {% raw %}')
  assert.match(out, /https:\/\/github\.com\/x\/y/)
  const started = performance.now()
  convertLiquidTags(`{% ${REDOS}`)
  assert.ok(performance.now() - started < 1000)
})
