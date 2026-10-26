// Gear list edits (utils/gearEdits.mjs, scripts/gear-updates.mjs): the same changes on the same
// list give the same file, every time
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyOps, serializeList, validateOps } from '../../utils/gearEdits.mjs'
import { checkSubmissions, commitMessage } from '../../scripts/gear-updates.mjs'
import { createGearToken, gearKey } from '../../netlify/lib/gearToken.mjs'
import gearVerify from '../../netlify/functions/gear-verify.mjs'
import { inventories, queryInventory } from '../../data/inventory.mjs'

const file = id => readFileSync(new URL(`../../data/gear/${id}.json`, import.meta.url), 'utf8')
const KEY = 'k'.repeat(40)
const ops = raw => validateOps(raw).ops

const list = {
  title: 'Test',
  emoji: '🧪',
  description: 'x',
  sections: ['Climbing', 'Hiking'],
  items: [
    { id: 'rope', section: 'Climbing', category: 'Ropes', name: 'Rope', qty: 1, tags: [], status: 'owned' },
    { id: 'atc', section: 'Climbing', category: 'Belay', name: 'ATC', qty: 1, tags: ['Belay'], status: 'owned' },
    { id: 'poles', section: 'Hiking', category: 'Poles', name: 'Poles', qty: 2, tags: [], status: 'owned' }
  ]
}

test('the gear files are already in canonical form (a hand edit that isn\'t shows up here)', () => {
  for (const id of Object.keys(inventories)) assert.equal(serializeList(JSON.parse(file(id))), file(id), id)
})

test('every item has a unique id, and the page data still has every item', () => {
  for (const [id, inv] of Object.entries(inventories)) {
    const ids = inv.items.map(i => i.id)
    assert.equal(new Set(ids).size, ids.length, id)
    assert.equal(queryInventory(id).count, inv.items.length)
  }
})

test('the same changes on the same list give the same bytes, and the list passed in is untouched', () => {
  const changes = ops([
    { op: 'add', item: { name: 'GriGri', section: 'Climbing', category: 'Belay', qty: 1 } },
    { op: 'update', id: 'poles', item: { name: 'Poles', section: 'Hiking', category: 'Poles', qty: 3 } },
    { op: 'remove', id: 'rope' }
  ])
  const before = JSON.stringify(list)
  const a = serializeList(applyOps(list, changes).list)
  const b = serializeList(applyOps(list, changes).list)
  assert.equal(a, b)
  assert.equal(JSON.stringify(list), before)
  const out = JSON.parse(a)
  assert.deepEqual(out.items.map(i => i.id), ['atc', 'grigri', 'poles'])
  assert.equal(out.items.find(i => i.id === 'poles').qty, 3)
})

test('a new item goes after the last one in its category, and a new section is added once', () => {
  const { list: out } = applyOps(list, ops([
    { op: 'add', item: { name: 'Rope 2', section: 'Climbing', category: 'Ropes' } },
    { op: 'add', item: { name: 'Paddle', section: 'SUP', category: 'Paddles' } },
    { op: 'add', item: { name: 'Fin', section: 'SUP', category: 'Fins' } }
  ]))
  assert.deepEqual(out.items.map(i => i.id), ['rope', 'rope-2', 'atc', 'poles', 'paddle', 'fin'])
  assert.deepEqual(out.sections, ['Climbing', 'Hiking', 'SUP'])
})

test('two items with the same name get different ids', () => {
  const { list: out } = applyOps(list, ops([{ op: 'add', item: { name: 'Rope', section: 'Climbing', category: 'Ropes' } }]))
  assert.deepEqual(out.items.filter(i => i.name === 'Rope').map(i => i.id), ['rope', 'rope-2'])
})

test('a change to an item that is already gone is skipped and reported, not applied', () => {
  const { list: out, skipped } = applyOps(list, ops([{ op: 'remove', id: 'rope' }, { op: 'remove', id: 'rope' }, { op: 'update', id: 'ghost', item: { name: 'G', section: 'S', category: 'C' } }]))
  assert.equal(out.items.length, 2)
  assert.equal(skipped.length, 2)
})

test('moving an item to another category puts it with its new group', () => {
  const { list: out } = applyOps(list, ops([{ op: 'update', id: 'rope', item: { name: 'Rope', section: 'Hiking', category: 'Poles' } }]))
  assert.deepEqual(out.items.map(i => i.id), ['atc', 'poles', 'rope'])
})

test('submissions: only owner-signed ones for exactly their list and changes apply, oldest first', async () => {
  // Checked the way the workflow does it: by the site's own /api/gear/verify, keyed from the
  // sign-in secret
  process.env.GITHUB_CLIENT_SECRET = 'client-secret-of-sufficient-length'
  const key = gearKey(process.env)
  const verify = async body => (await gearVerify(new Request('https://www.hanselwei.dev/api/gear/verify', { method: 'POST', body: JSON.stringify(body) }))).ok
  const sign = (opsText, list = 'camera', email = 'hello@hanselwei.dev', at = Date.now()) => createGearToken({ email, list, opsText }, key, at)
  const textA = JSON.stringify([{ op: 'remove', id: 'x-t5' }])
  const textB = JSON.stringify(ops([{ op: 'add', item: { name: 'Lens', section: 'Cameras & Lenses', category: 'Lenses' } }]))
  const now = Date.now()
  const iso = t => new Date(t).toISOString()
  try {
    const { valid, invalid, later } = await checkSubmissions(
      [
        { id: 'b', created_at: iso(now), data: { list: 'camera', ops: textB, token: sign(textB) } },
        { id: 'a', created_at: iso(now - 1000), data: { list: 'camera', ops: textA, token: sign(textA) } },
        { id: 'forged', created_at: iso(now), data: { list: 'camera', ops: textA, token: sign(textB) } },
        { id: 'other-list', created_at: iso(now), data: { list: 'outdoor', ops: textA, token: sign(textA) } },
        { id: 'wrong-key', created_at: iso(now), data: { list: 'camera', ops: textA, token: createGearToken({ email: 'hello@hanselwei.dev', list: 'camera', opsText: textA }, KEY, now) } },
        { id: 'stranger', created_at: iso(now), data: { list: 'camera', ops: textA, token: sign(textA, 'camera', 'someone@example.com') } }
      ],
      { verify }
    )
    assert.deepEqual(valid.map(v => v.id), ['a', 'b'])
    assert.deepEqual(invalid.map(v => v.id).sort(), ['forged', 'other-list', 'stranger', 'wrong-key'])
    assert.deepEqual(later, [])
  } finally {
    delete process.env.GITHUB_CLIENT_SECRET
  }
})

test('when the site can\'t be asked, a submission waits for the next run instead of being dropped', async () => {
  const text = JSON.stringify([{ op: 'remove', id: 'x-t5' }])
  const { valid, invalid, later } = await checkSubmissions(
    [{ id: 's', created_at: new Date().toISOString(), data: { list: 'camera', ops: text, token: 'x.y' } }],
    { verify: async () => { throw new Error('offline') } }
  )
  assert.deepEqual([valid.length, invalid.length, later.map(l => l.id)], [0, 0, ['s']])
})

test('the commit message says what changed in plain lines', () => {
  const msg = commitMessage({ list: 'camera', title: 'Camera Gear', ops: [{ line: 'Remove X-T5' }], skipped: [], id: 's1', at: Date.UTC(2026, 9, 25) })
  assert.match(msg, /^Gear: Camera Gear: 1 change\n\n- Remove X-T5\n\nFrom the editor on \/gear\/camera \(submission s1, 2026-10-25T00:00:00.000Z\)\.$/)
})
