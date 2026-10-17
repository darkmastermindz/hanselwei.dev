// Single source of truth for Hansel's gear inventories.
// Served live by the Netlify function at /api/inventory (netlify/functions/inventory.mjs)
// and bundled into the static pages as a fallback, so edit items here.
const item = (category, name, extra = {}) => ({ category, name, qty: 1, tags: [], ...extra })

export const inventories = {
  climbing: {
    title: 'Climbing Gear',
    emoji: '🧗',
    description: 'Everything on my rack, from shoes to anchor-building kit.',
    items: [
      item('Climbing Shoes', 'La Sportiva Tarantulace', { brand: 'La Sportiva', tags: ['Neutral', 'Beginner', 'Warmup'] }),
      item('Climbing Shoes', 'La Sportiva Solutions', { brand: 'La Sportiva', tags: ['Aggressive', 'Sport', 'Main'] }),
      item('Climbing Shoes', 'La Sportiva Theory', { brand: 'La Sportiva', tags: ['Aggressive', 'Bouldering'] }),
      item('Harness', 'Black Diamond Solution Harness (Honnold Edition)', { brand: 'Black Diamond' }),
      item('Belay / Rappel', 'GridLock Magnetron Carabiner', { brand: 'Black Diamond', tags: ['Belay'] }),
      item('Belay / Rappel', 'Beal Birdie Belay Device (Green)', { brand: 'Beal', tags: ['Belay', 'Assisted Braking'] }),
      item('Belay / Rappel', 'ATC-XP Belay/Rappel Device', { brand: 'Black Diamond', tags: ['Rappel'] }),
      item('Belay / Rappel', '13mm Dynex Rabbit Runner', { brand: 'Black Diamond', qty: 2, tags: ['Rappel'] }),
      item('Sport / Lead', '9.9 FullDry Climbing Rope 60m (Purple)', { brand: 'Black Diamond', tags: ['Rope'] }),
      item('Sport / Lead', 'Session Quickdraws 12cm, 6-pack (Purple/Green)', { brand: 'Wild Country', qty: 2, tags: ['Quickdraws'] }),
      item('Sport / Lead', 'Ohm Assisted Braking Device', { brand: 'Edelrid', tags: ['Belay'] }),
      item('Anchor / Safety', 'Positron Screwgate Carabiner 3-pack', { brand: 'Black Diamond', tags: ['Anchor'] }),
      item('Anchor / Safety', 'HotForge Screwgate Carabiner 3-pack', { brand: 'Black Diamond', qty: 4, tags: ['Anchor', 'Misc'] }),
      item('Anchor / Safety', 'Link Personal Anchor System', { brand: 'Black Diamond', tags: ['Anchor'] }),
      item('Anchor / Safety', 'Equalizer with Built-In Storage Pocket', { brand: 'Metolius', tags: ['Anchor'] }),
      item('Anchor / Safety', '18mm Nylon Sling', { brand: 'Metolius', tags: ['Rappel'] }),
      item('Anchor / Safety', '6.8mm HollowBlock2 Loop 13.5"', { brand: 'Sterling', qty: 2, tags: ['Rappel', 'Rescue'], notes: 'Replaces prusiks' }),
      item('Bouldering', 'Drop Zone Crash Pad', { brand: 'Black Diamond', tags: ['Bouldering'] }),
      item('Apparel', 'Session Approach Shoes (Black/Gum)', { brand: 'Black Diamond', tags: ['Approach'] }),
      item('Apparel', 'Dirt Bag Tee (Nov 2019)', { brand: 'Black Diamond', tags: ['T-Shirt'] }),
      item('Apparel', 'Riveter Tee', { tags: ['T-Shirt'] }),
      item('Apparel', 'Inner Peaks Skull Tee', { brand: 'Inner Peaks', tags: ['T-Shirt'] }),
      item('Apparel', 'Out There Graphic Bandana', { brand: 'REI Co-op', tags: ['Bandana'] }),
      item('Apparel', 'Star Wars Jedi Order Bandana', { brand: 'Heroes & Villains', tags: ['Bandana'] }),
      item('Apparel', 'Chaco Promotional Bandana', { brand: 'Chaco', tags: ['Bandana'] })
    ]
  },
  video: {
    title: 'Video Gear',
    emoji: '🎥',
    description: 'Cameras, capture cards and software I make videos with.',
    items: [
      item('Cameras', 'OBSBOT Me / iPhone 11', { tags: ['Phone'] }),
      item('Cameras', 'Spectacles v1 (Black)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Cameras', 'Spectacles v1 (Cyan)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Cameras', 'Spectacles v2 (Nico)', { brand: 'Snap', tags: ['Wearable'] }),
      item('Cameras', 'Snap Digital Instant Camera (Red)', { brand: 'Polaroid', tags: ['Instant'] }),
      item('Cameras', 'BRIO 4K Ultra HD Webcam', { brand: 'Logitech', tags: ['Webcam', '4K'] }),
      item('Capture', 'ShadowCast Capture', { brand: 'Genki', qty: 2, tags: ['Capture Card'] }),
      item('Software', 'Final Cut Pro', { brand: 'Apple', tags: ['Editing'] })
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

// Filters a list by ?category=, ?tag= and free-text ?q= (matches name, brand, notes, tags).
export const queryInventory = (id, { category, tag, q } = {}) => {
  const list = inventories[id]
  if (!list) return null

  const needle = q?.trim().toLowerCase()
  const items = list.items.filter(i => {
    if (category && i.category.toLowerCase() !== category.toLowerCase()) return false
    if (tag && !i.tags.some(t => t.toLowerCase() === tag.toLowerCase())) return false
    if (needle) {
      const haystack = [i.name, i.brand, i.notes, i.category, ...i.tags].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })

  return {
    id,
    title: list.title,
    emoji: list.emoji,
    description: list.description,
    categories: [...new Set(list.items.map(i => i.category))],
    tags: [...new Set(list.items.flatMap(i => i.tags))].sort(),
    count: items.length,
    items
  }
}
