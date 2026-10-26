// Hansel's gear inventories. The lists themselves are data/gear/<id>.json (one file per list,
// in the canonical form utils/gearEdits.mjs writes), edited by hand or from the editor on the
// list's page when signed in (README "Editing gear lists"). Served live by the Netlify function
// at /api/inventory (netlify/functions/inventory.mjs) and bundled into the static pages as a
// fallback.
import camera from './gear/camera.json' with { type: 'json' }
import outdoor from './gear/outdoor.json' with { type: 'json' }

// Where an item stands. Items default to "owned"; purchases found in order
// emails start as ordered/shipped/delivered until confirmed.
export const statuses = {
  owned: { label: 'Owned', emoji: '✅' },
  delivered: { label: 'Delivered', emoji: '📦' },
  shipped: { label: 'Shipped', emoji: '🚚' },
  ordered: { label: 'Ordered', emoji: '🧾' },
  returned: { label: 'Returned', emoji: '↩️' },
  retired: { label: 'Retired', emoji: '🪦' },
  wishlist: { label: 'Wishlist', emoji: '⭐' },
  unknown: { label: 'Needs review', emoji: '❓' }
}

// The list ids are the file names, and the page URLs (/gear/outdoor)
export const inventories = { outdoor, camera }

// Only real lists: ids come from URLs, so "__proto__", "constructor" etc. must not match
export const hasInventory = id => typeof id === 'string' && Object.hasOwn(inventories, id)

export const listSummaries = () =>
  Object.entries(inventories).map(([id, { title, emoji, description, items }]) => ({
    id,
    title,
    emoji,
    description,
    count: items.reduce((sum, i) => sum + i.qty, 0)
  }))

// Filters a list by ?section=, ?category=, ?tag=, ?status= and free-text ?q=
// (matches name, brand, notes, section, category, tags).
export const queryInventory = (id, { section, category, tag, status, q } = {}) => {
  if (!hasInventory(id)) return null
  const list = inventories[id]

  const needle = q?.trim().toLowerCase()
  const items = list.items.filter(i => {
    if (section && i.section.toLowerCase() !== section.toLowerCase()) return false
    if (status && i.status !== status.toLowerCase()) return false
    if (category && i.category.toLowerCase() !== category.toLowerCase()) return false
    if (tag && !i.tags.some(t => t.toLowerCase() === tag.toLowerCase())) return false
    if (needle) {
      const haystack = [i.name, i.brand, i.notes, i.section, i.category, ...i.tags].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })

  return {
    id,
    title: list.title,
    emoji: list.emoji,
    description: list.description,
    sections: list.sections.filter(name => list.items.some(i => i.section === name)),
    categories: [...new Set(list.items.map(i => i.category))],
    statuses: Object.keys(statuses).filter(key => list.items.some(i => i.status === key)),
    tags: [...new Set(list.items.flatMap(i => i.tags))].sort(),
    count: items.length,
    items
  }
}
