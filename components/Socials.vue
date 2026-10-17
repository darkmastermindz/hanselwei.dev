<template>
  <nav ref="nav" class="socials" :class="{ 'is-lens': layout }" aria-label="Find me elsewhere">
    <SocialFlipLink
      v-for="(link, i) in links"
      :key="link.label"
      v-bind="link"
      :index="i"
      :style="layout ? { order: layout.order[i] } : null"
    />
    <!-- Line breaks between the rows of the lens layout (see arrange below) -->
    <span v-for="o in layout?.breaks ?? []" :key="`break-${o}`" class="socials__break" :style="{ order: o }" aria-hidden="true" />
  </nav>
</template>

<script setup>
const links = [
  { label: 'GitHub', back: '🦄 @darkmastermindz', href: 'https://github.com/darkmastermindz', bg: 'bg-[#24292f]', effect: 'unicorn' },
  { label: 'Mastodon', back: '🐘 Toot at me', href: 'https://hansel.run/mastodon', bg: 'bg-[#563acc]' },
  { label: 'Messenger', back: '💬 Say hi!', href: 'https://m.me/hanselwei', bg: 'bg-blue-600' },
  { label: 'Instagram', back: '📸 See my photos', href: 'https://hansel.rocks', bg: 'bg-[#c7501a]' },
  { label: 'DEV Community', back: '✍️ @hansel', href: 'https://dev.to/hansel', bg: 'bg-black' },
  { label: 'LinkedIn', back: '💼 Let’s connect', href: 'https://linkedin.com/in/hanselwei', bg: 'bg-[#0a66c2]' },
  {
    label: 'Strava',
    back: '🏃 Run with me',
    backs: ['🏃 Run with me', '🗺️ Sidequest with me', '🛶 Paddle with me', '🧗 Rock climb with me'],
    href: 'https://www.strava.com/athletes/129101734',
    bg: 'bg-[#c73e00]'
  },
  { label: 'Send Email', back: '✉️ Drop me a line', href: 'mailto:Hansel Wei (hanselwei.dev) <hello+hansel@hanselwei.dev>', bg: 'bg-[#008856]' }
]

// Lay the pills out as a lens: short top and bottom rows, wider rows in the middle.
// Uses the pills' real widths, so it adapts from phone (1·2·2·2·1) to desktop (2·4·2).
// Only flex `order` and line breaks change, so the links are never re-created.
const nav = ref(null)
const layout = ref(null)

// Every way to split n pills into `rows` rows that bulges in the middle,
// smoothest and most symmetric first
const lensProfiles = (n, rows) => {
  const out = []
  const build = (left, parts) => {
    if (parts.length === rows - 1) {
      out.push([...parts, left])
      return
    }
    for (let k = 1; k <= left - (rows - parts.length - 1); k++) build(left - k, [...parts, k])
  }
  build(n, [])
  const peak = counts => Math.max(...counts)
  const unimodal = counts => {
    let i = 0
    while (i < counts.length - 1 && counts[i] <= counts[i + 1]) i++
    while (i < counts.length - 1 && counts[i] >= counts[i + 1]) i++
    return i === counts.length - 1
  }
  const score = counts =>
    counts.reduce((sum, c, i) => sum + (i ? (c - counts[i - 1]) ** 2 : 0), 0) +
    counts.reduce((sum, c, i) => sum + Math.abs(c - counts[counts.length - 1 - i]), 0)
  return out
    .filter(c => unimodal(c) && c[0] < peak(c) && c[c.length - 1] < peak(c))
    .sort((a, b) => score(a) - score(b))
}

const arrange = () => {
  const el = nav.value
  if (!el) return
  const pills = [...el.querySelectorAll('.flip-link')]
  const style = getComputedStyle(el)
  const room = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const gap = parseFloat(style.columnGap) || 0
  const widths = pills.map(pill => pill.offsetWidth)
  const fits = row => row.reduce((sum, i) => sum + widths[i], 0) + gap * (row.length - 1) <= room

  for (let rows = 3; rows <= pills.length; rows++) {
    for (const counts of lensProfiles(pills.length, rows)) {
      // Narrowest pills go to the busiest rows
      const byWidth = widths.map((w, i) => i).sort((a, b) => widths[a] - widths[b])
      const rowOrder = counts.map((c, r) => r).sort((a, b) => counts[b] - counts[a])
      const grid = counts.map(() => [])
      for (const r of rowOrder) grid[r] = byWidth.splice(0, counts[r]).sort((a, b) => a - b)
      if (!grid.every(fits)) continue

      // Rows of equal length (mirror images) take links in their original order, top first
      for (const size of new Set(counts)) {
        const slots = counts.map((c, r) => r).filter(r => counts[r] === size)
        const sets = slots.map(r => grid[r]).sort((a, b) => a[0] - b[0])
        slots.forEach((r, k) => (grid[r] = sets[k]))
      }

      const order = []
      grid.forEach((row, r) => row.forEach((i, k) => (order[i] = r * 100 + k)))
      layout.value = { order, breaks: grid.slice(0, -1).map((row, r) => r * 100 + 99) }
      return
    }
  }
  layout.value = null // nothing lens-shaped fits: plain centered wrapping
}

let resizeObserver = null
onMounted(() => {
  arrange()
  resizeObserver = new ResizeObserver(() => arrange())
  resizeObserver.observe(nav.value)
  document.fonts?.ready.then(arrange) // pill widths change once the web fonts load
})
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
/* Pills wrap onto centered lines; once measured, `order` and breaks shape them into a lens */
.socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 0.6rem;
  max-width: 44rem;
  margin: 0 auto;
  padding: 0 1rem;
}

/* The breaks are zero-height lines; move row spacing onto the pills so breaks don't double it */
.socials.is-lens {
  row-gap: 0;
}

.socials.is-lens > .flip-link {
  margin: 0.375rem 0;
}

.socials__break {
  flex-basis: 100%;
  height: 0;
}
</style>
