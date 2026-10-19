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
const hiking = (category, name, extra) => item('Hiking', category, name, extra)
const backpacking = (category, name, extra) => item('Backpacking', category, name, extra)
const camping = (category, name, extra) => item('Camping', category, name, extra)
const sup = (category, name, extra) => item('SUP', category, name, extra)
const yoga = (category, name, extra) => item('Yoga', category, name, extra)
const running = (category, name, extra) => item('Running', category, name, extra)
const photography = (category, name, extra) => item('Photography', category, name, extra)
const apparel = (category, name, extra) => item('Apparel & Footwear', category, name, extra)

export const inventories = {
  outdoor: {
    title: 'Outdoor Gear',
    emoji: '🏔️',
    description: 'Everything I take outside, starting with my climbing rack.',
    // Display order; sections without items are hidden
    sections: ['Climbing', 'Hiking', 'Backpacking', 'Camping', 'SUP', 'Yoga', 'Running', 'Photography', 'Apparel & Footwear'],
    items: [
      climbing('Climbing Shoes', 'La Sportiva Tarantulace', { brand: 'La Sportiva', tags: ['Neutral', 'Beginner', 'Warmup'] }),
      climbing('Climbing Shoes', "La Sportiva Solution (Men's, Yellow)", { brand: 'La Sportiva', qty: 2, tags: ['Aggressive', 'Sport', 'Main', 'Resoled'] }),
      climbing('Climbing Shoes', 'La Sportiva Solution LV (Orange)', { brand: 'La Sportiva', tags: ['Aggressive', 'Sport', 'Low Volume'] }),
      climbing('Climbing Shoes', 'La Sportiva Theory', { brand: 'La Sportiva', tags: ['Aggressive', 'Bouldering'] }),
      climbing('Climbing Shoes', 'La Sportiva Skwama Vegan', { brand: 'La Sportiva', tags: ['Aggressive'] }),
      climbing('Harness', 'Black Diamond Solution Harness (Honnold Edition)', { brand: 'Black Diamond' }),
      climbing('Helmets', 'Vapor Helmet (Green)', { brand: 'Black Diamond', tags: ['Helmet'] }),
      climbing('Helmets', 'Combi Cliff II Helmet', { brand: 'Beal', qty: 2, tags: ['Helmet'] }),
      climbing('Helmets', 'Crag Sender Helmet (Jade)', { brand: 'Mammut', qty: 2, tags: ['Helmet'] }),
      climbing('Helmets', 'Crag Sender Helmet (White)', { brand: 'Mammut', tags: ['Helmet'] }),
      climbing('Belay / Rappel', 'GridLock Magnetron Carabiner', { brand: 'Black Diamond', qty: 2, tags: ['Belay'] }),
      climbing('Belay / Rappel', 'ATC Pilot', { brand: 'Black Diamond', tags: ['Belay', 'Assisted Braking'] }),
      climbing('Belay / Rappel', 'Beal Birdie Belay Device (Green)', { brand: 'Beal', qty: 2, tags: ['Belay', 'Assisted Braking'] }),
      climbing('Belay / Rappel', 'Pro Guide Lite Belay Device (Purple)', { brand: 'Wild Country', tags: ['Belay', 'Guide Mode'] }),
      climbing('Belay / Rappel', 'ATC-XP Belay/Rappel Device', { brand: 'Black Diamond', tags: ['Rappel'] }),
      climbing('Belay / Rappel', '13mm Dynex Rabbit Runner', { brand: 'Black Diamond', qty: 2, tags: ['Rappel'] }),
      climbing('Sport / Lead', '9.9 FullDry Climbing Rope 60m (Purple)', { brand: 'Black Diamond', tags: ['Rope'] }),
      climbing('Sport / Lead', '9.5 Gym Classic Rope 40m', { brand: 'Mammut', qty: 2, tags: ['Rope', 'Gym'] }),
      climbing('Sport / Lead', '9.5 Crag We Care Classic Rope 40m', { brand: 'Mammut', tags: ['Rope'] }),
      climbing('Sport / Lead', 'Session Quickdraws 12cm, 6-pack (Purple/Green)', { brand: 'Wild Country', qty: 2, tags: ['Quickdraws'] }),
      climbing('Sport / Lead', 'Ohm Assisted Braking Device', { brand: 'Edelrid', tags: ['Belay'] }),
      climbing('Trad', 'Zero Friend Cam Set (#0.1, #0.2, #0.3)', { brand: 'Wild Country', tags: ['Cams'] }),
      climbing('Trad', 'Totem Cam #0.5 (Black)', { brand: 'Totem', tags: ['Cams'] }),
      climbing('Trad', 'Rock Wire Nut Sets (#1–5, #6–10)', { brand: 'Wild Country', qty: 2, tags: ['Nuts'] }),
      climbing('Trad', 'Tricam EVO Set of 4', { brand: 'C.A.M.P.', tags: ['Tricams'] }),
      climbing('Trad', 'Pro Key Nut Tool with Leash', { brand: 'Wild Country', tags: ['Tool'] }),
      climbing('Trad', 'Mydas Ultra Carabiners, 8-pack', { brand: 'Cypher', qty: 4, tags: ['Carabiners', 'Racking'] }),
      climbing('Trad', 'Porter Racking Carabiner', { brand: 'Singing Rock', qty: 8, tags: ['Racking'] }),
      climbing('Trad', 'Alpine Trad Sling 120cm (White)', { brand: 'Mammut', qty: 12, tags: ['Sling'] }),
      climbing('Trad', 'Multi-loop Contour Gear Sling', { brand: 'Metolius', tags: ['Racking'] }),
      climbing('Anchor / Safety', 'Positron Screwgate Carabiner 3-pack', { brand: 'Black Diamond', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'HotForge Screwgate Carabiner 3-pack', { brand: 'Black Diamond', qty: 4, tags: ['Anchor', 'Misc'] }),
      climbing('Anchor / Safety', 'LiteForge Screwgate Carabiner 3-pack', { brand: 'Black Diamond', qty: 2, tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Crag HMS Screwgate Carabiner', { brand: 'Mammut', qty: 3, tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'FS Mini II Carabiner', { brand: 'Metolius', qty: 11, tags: ['Accessory'] }),
      climbing('Anchor / Safety', 'Link Personal Anchor System', { brand: 'Black Diamond', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Dynamic PAS', { brand: 'Metolius', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Alpine Personal Anchor System', { brand: 'Metolius', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Connect Adjust Lanyard (Orange)', { brand: 'Petzl', tags: ['Anchor'] }),
      climbing('Anchor / Safety', 'Equalizer with Built-In Storage Pocket', { brand: 'Metolius', tags: ['Anchor'] }),
      climbing('Anchor / Safety', '18mm Nylon Sling', { brand: 'Metolius', qty: 2, tags: ['Rappel'] }),
      climbing('Anchor / Safety', '18mm Nylon Runner', { brand: 'Black Diamond', qty: 3, tags: ['Sling'] }),
      climbing('Anchor / Safety', 'Contact Sling 8.0 60cm (Red)', { brand: 'Mammut', qty: 8, tags: ['Sling'] }),
      climbing('Anchor / Safety', 'Contact Sling 8.0 120cm (Blue)', { brand: 'Mammut', qty: 6, tags: ['Sling'] }),
      climbing('Anchor / Safety', 'Contact Sling 8.0 180cm (Yellow)', { brand: 'Mammut', qty: 2, tags: ['Sling'] }),
      climbing('Anchor / Safety', '6.8mm HollowBlock2 Loop 13.5"', { brand: 'Sterling', qty: 2, tags: ['Rappel', 'Rescue'], notes: 'Replaces prusiks' }),
      climbing('Anchor / Safety', 'Titan Dyneema Cord 5.5 mm × 6 m (Green)', { brand: 'BlueWater', tags: ['Cord'] }),
      climbing('Anchor / Safety', '7mm Accessory Cord', { brand: 'PMI', tags: ['Cord'] }),
      climbing('Anchor / Safety', '6mm Accessory Cord (Black)', { tags: ['Cord'] }),
      climbing('Rope Access', 'Speleo II 9mm Static Rope', { brand: 'Edelweiss', tags: ['Rope', 'Static'] }),
      climbing('Rope Access', 'A&D Ascender/Descender (Right)', { brand: 'Grivel', tags: ['Ascending'] }),
      climbing('Rope Access', 'Footer XP Ascender Sling', { brand: 'Singing Rock', tags: ['Ascending'] }),
      climbing('Bouldering', 'Drop Zone Crash Pad', { brand: 'Black Diamond', tags: ['Bouldering'] }),
      climbing('Bouldering', 'Crash Pad Couch (Natural Wood)', { brand: 'Metolius', tags: ['Crash Pad', 'Home'] }),
      climbing('Packs', 'TRAD 35 (Wild Cumin)', { brand: 'Ortovox', tags: ['Climbing Pack'] }),
      climbing('Accessories', 'Alpine Chalk Bag (Pepper)', { brand: 'Mammut', tags: ['Chalk'] }),
      climbing('Accessories', 'Belt for Chalk Bags', { brand: 'Cypher', qty: 2, tags: ['Chalk'] }),
      climbing('Accessories', 'Liner Rope Bag (Night/Oasis)', { brand: 'Edelrid', tags: ['Rope Bag'] }),
      climbing('Accessories', 'S-Biner MicroLock Stainless, 5-pack', { brand: 'Nite Ize', tags: ['Organization'] }),
      climbing('Accessories', 'Climber Swiss Army Knife (Sapphire)', { brand: 'Victorinox', tags: ['Tool'] }),
      climbing('Accessories', 'Ion Keychain Light (Octane)', { brand: 'Black Diamond', tags: ['Light'] }),
      climbing('Accessories', 'Oclip Pro S Clip Light', { brand: 'Olight', qty: 3, tags: ['Light'] }),
      climbing('First Aid', 'First Aid Bag for Harnesses', { brand: 'Singing Rock', tags: ['First Aid'] }),
      hiking('Footwear', 'Ducan Mid GTX Boots', { brand: 'Mammut', tags: ['Hiking', 'Waterproof'] }),
      hiking('Packs', 'Outdoor Sling 7L (Cloud)', { brand: 'Peak Design', tags: ['Sling'] }),
      hiking('Hydration', 'Crux 3L Reservoir (Blue)', { brand: 'CamelBak', tags: ['Reservoir'] }),
      hiking('Hydration', 'Bottle Belt', { brand: 'Liberty Mountain', qty: 3 }),
      hiking('Navigation', 'VERTIX 2S GPS Watch', { brand: 'COROS', tags: ['GPS', 'Watch'] }),
      hiking('Navigation', 'VERTIX 2 Carabiner Mount', { brand: 'COROS', tags: ['Watch'] }),
      hiking('Accessories', 'Gear Tie ProPack 3in, 24-pack', { brand: 'Nite Ize', tags: ['Organization'] }),
      hiking('Accessories', 'Packing Cube Protect S', { brand: 'Mammut', qty: 5, tags: ['Organization'] }),
      backpacking('Sleep', 'Benchmark 0 (Regular)', { brand: 'Big Agnes' }),
      backpacking('Shelter', 'DoubleNest Hammock (Navy/Seafoam)', { brand: 'ENO', tags: ['Hammock'] }),
      backpacking('Shelter', 'Helios XL Ultralight Hammock Suspension (Gray)', { brand: 'ENO', tags: ['Hammock'] }),
      backpacking('Kitchen', 'Flash Java Kit (Ecto)', { brand: 'Jetboil', tags: ['Stove', 'Coffee'] }),
      backpacking('Kitchen', 'Kinetic Ultra Ti Stove + XTS Pot Combo', { brand: 'Olicamp', tags: ['Stove'] }),
      backpacking('Kitchen', 'Space Saver Mug (Lime, Gold)', { brand: 'Olicamp', qty: 2, tags: ['Mug'] }),
      backpacking('Kitchen', 'Space Saver Mug Lid', { brand: 'Olicamp', qty: 2, tags: ['Mug'] }),
      backpacking('Kitchen', 'Sparkler Fire Starter', { brand: 'Olicamp', qty: 3, tags: ['Fire'] }),
      backpacking('First Aid', 'Mini Wound Closure MOD', { brand: 'My Medic', qty: 6, tags: ['First Aid'] }),
      backpacking('First Aid', 'Super Strips', { brand: 'My Medic', qty: 5, tags: ['First Aid'] }),
      backpacking('First Aid', 'Sprain and Fracture MOD', { brand: 'My Medic', tags: ['First Aid'] }),
      backpacking('First Aid', 'Mini Sprain and Fracture MOD', { brand: 'My Medic', tags: ['First Aid'] }),
      backpacking('First Aid', 'Mini Medication MOD', { brand: 'My Medic', tags: ['First Aid', 'Consumable'] }),
      backpacking('First Aid', 'Liquid Skin, 5-pack', { brand: 'My Medic', tags: ['First Aid', 'Consumable'] }),
      backpacking('First Aid', 'Povidone Iodine Prep Solution 4 oz', { brand: 'My Medic', tags: ['First Aid', 'Consumable'] }),
      camping('Shelter', 'Northwood II 4P Tent (Green)', { brand: 'Mountain Summit Gear', tags: ['Tent', 'Car Camping'] }),
      camping('Camp Comfort', 'Wallace Lake Sherpa Blanket (Copper Clay)', { brand: 'REI Co-op', tags: ['Blanket'] }),
      camping('Camp Comfort', 'Wallace Lake Sherpa Blanket (Sargasso Sea)', { brand: 'REI Co-op', qty: 2, tags: ['Blanket'] }),
      camping('Camp Comfort', 'Pocket Blanket', { tags: ['Blanket'] }),
      camping('Camp Comfort', 'Edison Pendant String Lights', { brand: 'Barebones', tags: ['Light'] }),
      camping('Camp Comfort', 'Water Buddha Portable Shower', { brand: 'JBL', tags: ['Shower'] }),
      sup('Boards', 'WULF Aero 10\'4" Inflatable SUP', { brand: 'BOTE', qty: 2, tags: ['iSUP'], notes: 'One with MagnaPod' }),
      sup('Safety', 'Zephyr Inflatable PFD (Black)', { brand: 'NRS', tags: ['PFD'] }),
      sup('Safety', 'Vista PFD (Green)', { brand: 'NRS', tags: ['PFD'] }),
      sup('Accessories', 'AeroPump Mini', { brand: 'BOTE', tags: ['Pump'] }),
      sup('Accessories', 'SUP Adhesive Lashing Tab', { brand: 'Airhead', qty: 2, tags: ['Rigging'] }),
      sup('Accessories', 'Delta Deck Pack', { brand: 'Kokopelli', tags: ['Bag'] }),
      yoga('Mats', 'PROlite Yoga Mat (Dark Deep Sea)', { brand: 'Manduka', tags: ['Mat'] }),
      yoga('Mats', 'Verde Large Yoga Mat (Cargo Green)', { brand: 'prAna', tags: ['Mat'] }),
      yoga('Mats', 'TPE Yoga Mat 6mm (Bermuda Blue)', { brand: 'New Balance', tags: ['Mat'] }),
      yoga('Props', 'Recycled Foam Yoga Block (Thunder)', { brand: 'Manduka', tags: ['Block'] }),
      yoga('Carriers', 'Go Play Mat Carrier', { brand: 'Manduka', tags: ['Carrier'] }),
      yoga('Carriers', 'Go Move Mat Sling (Thunder)', { brand: 'Manduka', tags: ['Carrier'] }),
      yoga('Recovery', 'Vyper 3 Vibrating Roller (Black)', { brand: 'Hyperice', tags: ['Recovery'] }),
      yoga('Recovery', 'Hypersphere (Black)', { brand: 'Hyperice', tags: ['Recovery'] }),
      yoga('Recovery', 'Hypersphere Mini', { brand: 'Hyperice', tags: ['Recovery'] }),
      running('Hydration', 'AeroZip 1L Hydration Race Vest', { brand: 'Nathan', tags: ['Vest'] }),
      running('Hydration', 'Race Number Belt', { brand: 'Nathan', qty: 3, tags: ['Race'] }),
      running('Footwear', 'Ghost 14 (Green Gecko)', { brand: 'Brooks', tags: ['Road'] }),
      running('Accessories', 'Trail Midweight Mini-Crew Socks', { brand: 'Injinji', qty: 3, tags: ['Socks'] }),
      photography('Straps & Clips', 'Slide Lite 2.0 Strap (Coyote)', { brand: 'Peak Design', tags: ['Strap'] }),
      photography('Straps & Clips', 'Clutch 3.0 Hand Strap', { brand: 'Peak Design', tags: ['Strap'] }),
      photography('Straps & Clips', 'Capture 3.0 Clip (Silver)', { brand: 'Peak Design', tags: ['Clip'] }),
      photography('Bags', 'Tech Pouch (Coyote)', { brand: 'Peak Design', tags: ['Pouch'] }),
      photography('Bags', 'Small Tech Pouch (Sage)', { brand: 'Peak Design', tags: ['Pouch'] }),
      apparel('Footwear', 'Session Approach Shoes (Black/Gum)', { brand: 'Black Diamond', tags: ['Approach'] }),
      apparel('Footwear', 'Technician Pro Approach Shoes (Steel-Black)', { brand: 'Black Diamond', tags: ['Approach'] }),
      apparel('Outerwear', 'Houdini Jacket', { brand: 'Patagonia', tags: ['Wind Shell'] }),
      apparel('Outerwear', 'Aenergy TR WB Hybrid Vest (White)', { brand: 'Mammut', tags: ['Vest'] }),
      apparel('Tops', 'Capilene Cool Sun Hoody (Water People Banner)', { brand: 'Patagonia', tags: ['Sun'] }),
      apparel('Tops', 'Dirt Bag Tee (Nov 2019)', { brand: 'Black Diamond', tags: ['T-Shirt'] }),
      apparel('Tops', 'Riveter Tee', { tags: ['T-Shirt'] }),
      apparel('Tops', 'Inner Peaks Skull Tee', { brand: 'Inner Peaks', tags: ['T-Shirt'] }),
      apparel('Bottoms', 'Terrebonne Shorts', { brand: 'Patagonia', tags: ['Shorts'] }),
      apparel('Accessories', 'Aviator Sunglasses', { brand: 'Ray-Ban', tags: ['Sunglasses'] }),
      apparel('Accessories', 'Out There Graphic Bandana', { brand: 'REI Co-op', tags: ['Bandana'] }),
      apparel('Accessories', 'Star Wars Jedi Order Bandana', { brand: 'Heroes & Villains', tags: ['Bandana'] }),
      apparel('Accessories', 'Chaco Promotional Bandana', { brand: 'Chaco', tags: ['Bandana'] })
    ]
  },
  camera: {
    title: 'Camera Gear',
    emoji: '📷',
    description: 'Cameras, lenses, video kit and the accessories that carry them.',
    sections: ['Cameras & Lenses', 'Video', 'Accessories'],
    items: [
      item('Cameras & Lenses', 'Cameras', 'X-T5', { brand: 'Fujifilm', tags: ['Mirrorless', 'X-Mount'] }),
      item('Cameras & Lenses', 'Cameras', 'Snap Digital Instant Camera (Red)', { brand: 'Polaroid', tags: ['Instant'] }),
      item('Cameras & Lenses', 'Lenses', 'XF 56mm F1.2 R WR', { brand: 'Fujifilm', tags: ['Portrait', 'Prime', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'DispoLens for X-Mount', { brand: 'DispoStudio', tags: ['Fun Lens', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'TripleLens for X-Mount', { brand: 'DispoStudio', tags: ['Fun Lens', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'XF 18-55mm F2.8-4 R LM OIS', { brand: 'Fujifilm', tags: ['Zoom', 'X-Mount'], notes: 'X-T5 kit lens' }),
      item('Cameras & Lenses', 'Lenses', 'XF 16mm F2.8 R WR (Black)', { brand: 'Fujifilm', tags: ['Wide', 'Prime', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'XF 18mm F1.4 R LM WR', { brand: 'Fujifilm', tags: ['Wide', 'Prime', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'XF 35mm F2 R WR (Black)', { brand: 'Fujifilm', tags: ['Prime', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'XF 70-300mm F4-5.6 R LM OIS WR', { brand: 'Fujifilm', tags: ['Telephoto', 'Zoom', 'X-Mount'] }),
      item('Cameras & Lenses', 'Lenses', 'XF2X TC WR Teleconverter', { brand: 'Fujifilm', tags: ['Teleconverter', 'X-Mount'] }),
      item('Video', 'Cameras', 'OBSBOT Me / iPhone 11', { tags: ['Phone'] }),
      item('Video', 'Cameras', 'Spectacles v1 (Black)', { brand: 'Snap', tags: ['Wearable'], status: 'retired' }),
      item('Video', 'Cameras', 'Spectacles v1 (Cyan)', { brand: 'Snap', tags: ['Wearable'], status: 'retired' }),
      item('Video', 'Cameras', 'Spectacles v2 (Nico)', { brand: 'Snap', tags: ['Wearable'], status: 'retired' }),
      item('Video', 'Cameras', 'BRIO 4K Ultra HD Webcam', { brand: 'Logitech', tags: ['Webcam', '4K'] }),
      item('Video', 'Capture', 'ShadowCast Capture', { brand: 'Genki', qty: 2, tags: ['Capture Card'] }),
      item('Video', 'Software', 'Final Cut Pro', { brand: 'Apple', tags: ['Editing'] }),
      item('Accessories', 'Straps', 'LemurStrap with Bronze Baseplate', { brand: 'LemurStrap', tags: ['Strap'] }),
      item('Accessories', 'Cases', 'X-T5 Half Case (Green)', { brand: 'MUZIRI KINOKOO', tags: ['Case'] }),
      item('Accessories', 'Power', 'NP-W235 Battery', { brand: 'Fujifilm', tags: ['Battery'] }),
      item('Accessories', 'Power', 'BC-W235 Dual Battery Charger', { brand: 'Fujifilm', tags: ['Charger'] }),
      item('Accessories', 'Power', 'NP-W235 Dual Fast Charger', { brand: 'llano', tags: ['Charger'] }),
      item('Accessories', 'Filters', 'MC UV Filter (43mm, 49mm, 58mm)', { brand: 'K&F Concept', qty: 3, tags: ['Filter', 'UV'] }),
      item('Accessories', 'Filters', 'Variable ND2-ND32 Filter (58mm, 67mm)', { brand: 'K&F Concept', qty: 2, tags: ['Filter', 'ND'] }),
      item('Accessories', 'Filters', '49mm Center-Pinch Lens Cap', { brand: 'K&F Concept', tags: ['Lens Cap'] }),
      item('Accessories', 'Lighting', 'EF-X8 Clip-On Flash', { brand: 'Fujifilm', tags: ['Flash'] }),
      item('Accessories', 'Support', 'Mini Flexible Tripod', { brand: 'ULANZI', tags: ['Tripod'] }),
      item('Accessories', 'Printing', 'Instax SP-3 Mobile Printer (Black)', { brand: 'Fujifilm', tags: ['Instax', 'Printer'] })
    ]
  }
}

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
