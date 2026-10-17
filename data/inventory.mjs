// Single source of truth for Hansel's gear inventories.
// Served live by the Netlify function at /api/inventory (netlify/functions/inventory.mjs)
// and bundled into the static pages as a fallback, so edit items here.

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

const item = (section, category, name, extra = {}) => ({
  section,
  category,
  name,
  qty: 1,
  tags: [],
  status: 'owned',
  ...extra
})

const climbing = (category, name, extra) => item('Climbing', category, name, extra)
const apparel = (category, name, extra) => item('Apparel & Footwear', category, name, extra)

export const inventories = {
  outdoor: {
    title: 'Outdoor Gear',
    emoji: '🏔️',
    description: 'Everything I take outside, starting with my climbing rack.',
    // Display order; sections without items are hidden
    sections: ['Climbing', 'Hiking & Backpacking', 'Camping', 'Apparel & Footwear'],
    items: [
      climbing('Climbing Shoes', 'La Sportiva Tarantulace', { brand: 'La Sportiva', tags: ['Neutral', 'Beginner', 'Warmup'] }),
      climbing('Climbing Shoes', 'La Sportiva Solutions', { brand: 'La Sportiva', tags: ['Aggressive', 'Sport', 'Main'] }),
      climbing('Climbing Shoes', 'La Sportiva Theory', { brand: 'La Sportiva', tags: ['Aggressive', 'Bouldering'] }),
      climbing('Harness', 'Black Diamond Solution Harness (Honnold Edition)', { brand: 'Black Diamond' }),
      climbing('Belay / Rappel', 'GridLock Magnetron Carabiner', { brand: 'Black Diamond', tags: ['Belay'] }),
      climbing('Belay / Rappel', 'Beal Birdie Belay Device (Green)', { brand: 'Beal', tags: ['Belay', 'Assisted Braking'] }),
      climbing('Belay / Rappel', 'ATC-XP Belay/Rappel Device', { brand: 'Black Diamond', tags: ['Rappel'] }),
      climbing('Belay / Rappel', '13mm Dynex Rabbit Runner', { brand: 'Black Diamond', qty: 2, tags: ['Rappel'] }),
      climbing('Sport / Lead', '9.9 FullDry Climbing Rope 60m (Purple)', { brand: 'Black Diamond', tags: ['Rope'] }),
      climbing('Sport / Lead', 'Session Quickdraws 12cm, 6-pack (Purple/Green)', { brand: 'Wild Country', qty: 2, tags: ['Quickdraws'] }),
      climbing('Sport / Lead', 'Ohm Assisted Braking Device', { brand: 'Edelrid', tags: ['Belay'] }),
      climbing('Anchor / Safety', 'Positron Screwgate Carabiner 3-pack', { brand: 'Black Diamond', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'HotForge Screwgate Carabiner 3-pack', { brand: 'Black Diamond', qty: 4, tags: ['Anchor', 'Misc'] }),
      climbing('Anchor / Safety', 'Link Personal Anchor System', { brand: 'Black Diamond', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Equalizer with Built-In Storage Pocket', { brand: 'Metolius', tags: ['Anchor'] }),
      climbing('Anchor / Safety', '18mm Nylon Sling', { brand: 'Metolius', tags: ['Rappel'] }),
      climbing('Anchor / Safety', '6.8mm HollowBlock2 Loop 13.5"', { brand: 'Sterling', qty: 2, tags: ['Rappel', 'Rescue'], notes: 'Replaces prusiks' }),
      climbing('Bouldering', 'Drop Zone Crash Pad', { brand: 'Black Diamond', tags: ['Bouldering'] }),
      apparel('Footwear', 'Session Approach Shoes (Black/Gum)', { brand: 'Black Diamond', tags: ['Approach'] }),
      apparel('Tops', 'Dirt Bag Tee (Nov 2019)', { brand: 'Black Diamond', tags: ['T-Shirt'] }),
      apparel('Tops', 'Riveter Tee', { tags: ['T-Shirt'] }),
      apparel('Tops', 'Inner Peaks Skull Tee', { brand: 'Inner Peaks', tags: ['T-Shirt'] }),
      apparel('Accessories', 'Out There Graphic Bandana', { brand: 'REI Co-op', tags: ['Bandana'] }),
      apparel('Accessories', 'Star Wars Jedi Order Bandana', { brand: 'Heroes & Villains', tags: ['Bandana'] }),
      apparel('Accessories', 'Chaco Promotional Bandana', { brand: 'Chaco', tags: ['Bandana'] })
    ]
  },
  video: {
    title: 'Video Gear',
    emoji: '🎥',
    description: 'Cameras, capture cards and software I make videos with.',
    sections: ['Video'],
    items: [
      item('Video', 'Cameras', 'OBSBOT Me / iPhone 11', { tags: ['Phone'] }),
      item('Video', 'Cameras', 'Spectacles v1 (Black)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Video', 'Cameras', 'Spectacles v1 (Cyan)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Video', 'Cameras', 'Spectacles v2 (Nico)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Video', 'Cameras', 'Snap Digital Instant Camera (Red)', { brand: 'Polaroid', tags: ['Instant'] }),
      item('Video', 'Cameras', 'BRIO 4K Ultra HD Webcam', { brand: 'Logitech', tags: ['Webcam', '4K'] }),
      item('Video', 'Capture', 'ShadowCast Capture', { brand: 'Genki', qty: 2, tags: ['Capture Card'] }),
      item('Video', 'Software', 'Final Cut Pro', { brand: 'Apple', tags: ['Editing'] })
    ]
  }
}

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
  const list = inventories[id]
  if (!list) return null

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
