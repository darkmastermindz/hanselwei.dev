// Gear list edits (README "Editing gear lists"): the owner's changes to a list, as a short list
// of operations, applied the same way everywhere they're used. The editor on /gear/[list] previews
// them, /api/gear/token checks them before signing, and scripts/gear-updates.mjs applies them to
// data/gear/<list>.json for the "Gear updates" pull request. Given the same file and the same
// operations, the result is the same bytes every time.
//
// Operations:
//   { op: 'add', item }          a new item (its id comes from its name)
//   { op: 'update', id, item }   replace an item's fields, keeping its id and place
//   { op: 'remove', id }
// Everything here comes from a form a browser filled in, so it's all checked and cut to size.

export const STATUSES = ['owned', 'delivered', 'shipped', 'ordered', 'returned', 'retired', 'wishlist', 'unknown']

export const LIMITS = {
  ops: 200,
  items: 2000,
  name: 120,
  brand: 80,
  notes: 500,
  section: 60,
  category: 60,
  tags: 20,
  tag: 40,
  qty: 999,
  id: 80
}

// The order every item's keys are written in (optional ones only when set)
const ITEM_KEYS = ['id', 'section', 'category', 'name', 'brand', 'qty', 'tags', 'status', 'notes']

// Control characters (newlines included) and the Unicode ones that flip or hide text
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g

const text = (value, max) => (typeof value === 'string' ? value.replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '')

export const slugify = value =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, LIMITS.id)
    .replace(/-$/, '') || 'item'

const isId = id => typeof id === 'string' && id.length <= LIMITS.id && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)

// An item's fields from the editor, checked and in canonical form; null when it can't be used
// (no name, section or category). The id is set separately.
export const cleanItem = input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const name = text(input.name, LIMITS.name)
  const section = text(input.section, LIMITS.section)
  const category = text(input.category, LIMITS.category)
  if (!name || !section || !category) return null
  // A number, or digits ("" and null aren't 0: a cleared field falls back to 1)
  const qty = typeof input.qty === 'number' ? input.qty : /^\d+$/.test(String(input.qty ?? '').trim()) ? Number(input.qty) : NaN
  const tags = Array.isArray(input.tags) ? input.tags.map(tag => text(tag, LIMITS.tag)).filter(Boolean) : []
  return {
    section,
    category,
    name,
    brand: text(input.brand, LIMITS.brand) || undefined,
    qty: Number.isInteger(qty) && qty >= 0 && qty <= LIMITS.qty ? qty : 1,
    tags: [...new Set(tags)].slice(0, LIMITS.tags),
    status: STATUSES.includes(input.status) ? input.status : 'owned',
    notes: text(input.notes, LIMITS.notes) || undefined
  }
}

// The item with its keys in the canonical order, leaving out empty optional ones
export const canonicalItem = item => Object.fromEntries(ITEM_KEYS.filter(key => item[key] !== undefined).map(key => [key, item[key]]))

// Checked operations, or { error } for the first one that can't be used
export const validateOps = ops => {
  if (!Array.isArray(ops) || !ops.length) return { error: 'No changes' }
  if (ops.length > LIMITS.ops) return { error: `At most ${LIMITS.ops} changes at a time` }
  const clean = []
  for (const [i, entry] of ops.entries()) {
    const op = entry && typeof entry === 'object' ? entry.op : null
    if (op === 'remove') {
      if (!isId(entry.id)) return { error: `Change ${i + 1}: unknown item` }
      clean.push({ op, id: entry.id })
    } else if (op === 'add' || op === 'update') {
      const item = cleanItem(entry.item)
      if (!item) return { error: `Change ${i + 1}: an item needs a name, a section and a category` }
      if (op === 'update' && !isId(entry.id)) return { error: `Change ${i + 1}: unknown item` }
      clean.push(op === 'add' ? { op, item: canonicalItem(item) } : { op, id: entry.id, item: canonicalItem(item) })
    } else {
      return { error: `Change ${i + 1}: unknown change` }
    }
  }
  return { ops: clean }
}

const uniqueId = (name, taken) => {
  const base = slugify(name)
  let id = base
  for (let n = 2; taken.has(id); n++) id = `${base.slice(0, LIMITS.id - String(n).length - 1)}-${n}`
  return id
}

// A new item goes after the last one in its category (or its section, or at the end), so the
// file's diff is one added block where the item will show
const insertAt = (items, item) => {
  const lastIndex = test => items.findLastIndex(test)
  const inCategory = lastIndex(i => i.section === item.section && i.category === item.category)
  if (inCategory >= 0) return inCategory + 1
  const inSection = lastIndex(i => i.section === item.section)
  return inSection >= 0 ? inSection + 1 : items.length
}

// Applies checked operations to a list ({ title, emoji, description, sections, items }) without
// changing it. Returns the new list, and the operations that couldn't apply (an item already
// removed, say) with why.
export const applyOps = (list, ops) => {
  const items = list.items.map(item => ({ ...item }))
  const sections = [...list.sections]
  const skipped = []
  const addSection = name => sections.includes(name) || sections.push(name)

  for (const op of ops) {
    if (op.op === 'add') {
      if (items.length >= LIMITS.items) {
        skipped.push({ op, reason: 'the list is full' })
        continue
      }
      const item = canonicalItem({ ...op.item, id: uniqueId(op.item.name, new Set(items.map(i => i.id))) })
      items.splice(insertAt(items, item), 0, item)
      addSection(item.section)
      continue
    }
    const at = items.findIndex(i => i.id === op.id)
    if (at < 0) {
      skipped.push({ op, reason: 'no item with that id' })
      continue
    }
    if (op.op === 'remove') {
      items.splice(at, 1)
    } else {
      const item = canonicalItem({ ...op.item, id: op.id })
      // A move to another section or category goes to the end of its new group
      if (item.section !== items[at].section || item.category !== items[at].category) {
        items.splice(at, 1)
        items.splice(insertAt(items, item), 0, item)
      } else {
        items[at] = item
      }
      addSection(item.section)
    }
  }
  return { list: { ...list, sections, items }, skipped }
}

// The list as it's stored in data/gear/<id>.json
export const serializeList = list =>
  `${JSON.stringify(
    {
      title: list.title,
      emoji: list.emoji,
      description: list.description,
      sections: list.sections,
      items: list.items.map(canonicalItem)
    },
    null,
    2
  )}\n`

// One line per change, for the commit message and the pull request (plain text: names can hold
// anything, so @ and backticks are defused before GitHub renders them)
const quiet = value => String(value).replace(/@/g, '@​').replace(/`/g, "'")
export const describeOp = (op, list) => {
  const before = op.id ? list?.items.find(i => i.id === op.id) : null
  if (op.op === 'add') return `Add ${quiet(op.item.name)} (${quiet(op.item.section)} › ${quiet(op.item.category)}${op.item.qty !== 1 ? `, ×${op.item.qty}` : ''})`
  if (op.op === 'remove') return `Remove ${quiet(before?.name ?? op.id)}`
  return `Update ${quiet(before?.name ?? op.id)}${before && before.name !== op.item.name ? ` → ${quiet(op.item.name)}` : ''}`
}
