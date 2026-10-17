<template>
  <main class="page">
    <h1 class="page-title text-[#41b883]">{{ inventory.emoji }} Hansel's {{ inventory.title }}</h1>
    <p class="intro">
      {{ inventory.description }}
      <LiveBadge :live="live" />
    </p>

    <nav v-if="showSectionHeadings" class="sections" aria-label="Sections">
      <a v-for="name in inventory.sections" :key="name" :href="`#${slugify(name)}`" class="badge badge-lg badge-success badge-outline">
        {{ name }}
      </a>
    </nav>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full sm:max-w-xs"
        placeholder="Search gear…"
        aria-label="Search gear"
      />
      <div v-if="inventory.statuses.length > 1" class="tags" role="group" aria-label="Filter by status">
        <button
          v-for="key in inventory.statuses"
          :key="key"
          type="button"
          :class="['badge badge-lg', activeStatus === key ? 'badge-warning' : 'badge-outline text-gray-300']"
          :aria-pressed="activeStatus === key"
          @click="activeStatus = activeStatus === key ? null : key"
        >
          {{ statuses[key].emoji }} {{ statuses[key].label }}
        </button>
      </div>
      <button v-if="activeTag" type="button" class="badge badge-lg badge-success self-start" @click="activeTag = null">
        ✕ {{ activeTag }}
      </button>
      <div class="tag-strip" role="group" aria-label="Filter by tag">
        <div v-for="(row, i) in tagRows" :key="i" class="tag-row">
          <button
            v-for="tag in row"
            :key="tag"
            type="button"
            :class="['badge badge-lg', activeTag === tag ? 'badge-success' : 'badge-outline text-gray-300']"
            :aria-pressed="activeTag === tag"
            @click="activeTag = activeTag === tag ? null : tag"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="!grouped.length" class="empty">No gear matches that filter.</p>

    <section v-for="section in grouped" :id="slugify(section.name)" :key="section.name" class="gear-section">
      <h2 v-if="showSectionHeadings" class="section-title">{{ section.name }}</h2>
      <div v-for="group in section.categories" :key="group.category" class="category">
        <h3>{{ group.category }}</h3>
        <ul>
          <li v-for="item in group.items" :key="item.name">
            <div class="item">
              <span class="name">
                {{ item.name }}
                <span v-if="item.qty > 1" class="qty">×{{ item.qty }}</span>
              </span>
              <span v-if="item.brand" class="brand">{{ item.brand }}</span>
            </div>
            <p v-if="item.notes" class="notes">{{ item.notes }}</p>
            <div v-if="item.status !== 'owned' || item.tags.length" class="item-tags">
              <span v-if="item.status !== 'owned'" :class="['status', `status--${item.status}`]">
                {{ statuses[item.status]?.emoji }} {{ statuses[item.status]?.label ?? item.status }}
              </span>
              <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <p class="other">
      <NuxtLink to="/gear">← All gear lists</NuxtLink>
    </p>
  </main>
</template>

<script setup>
import { inventories, statuses } from '~/data/inventory.mjs'

const route = useRoute()
const id = String(route.params.list)

if (!inventories[id]) {
  throw createError({ statusCode: 404, statusMessage: 'Gear list not found', fatal: true })
}

const { inventory, live } = useInventory(id)
useHead({ title: () => `${inventory.value.title} · hanselwei.dev` })

const search = ref('')
const activeTag = ref(null)
const activeStatus = ref(null)

const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const showSectionHeadings = computed(() => inventory.value.sections.length > 1)

// Split the alphabetical tags into three rows of roughly equal width (by characters),
// keeping each row in order, so the strip scrolls sideways instead of growing tall
const TAG_ROWS = 3
const tagRows = computed(() => {
  const tags = inventory.value.tags
  const width = tag => tag.length + 4 // chip padding and gap, in characters
  const target = tags.reduce((sum, tag) => sum + width(tag), 0) / TAG_ROWS
  const rows = [[]]
  let used = 0
  for (const tag of tags) {
    if (used >= target && rows.length < TAG_ROWS) {
      rows.push([])
      used = 0
    }
    rows[rows.length - 1].push(tag)
    used += width(tag)
  }
  return rows
})

// section -> category -> items, in the list's section order
const grouped = computed(() => {
  const needle = search.value.trim().toLowerCase()
  const sections = new Map(inventory.value.sections.map(name => [name, new Map()]))

  for (const item of inventory.value.items) {
    if (activeTag.value && !item.tags.includes(activeTag.value)) continue
    if (activeStatus.value && item.status !== activeStatus.value) continue
    if (needle) {
      const haystack = [item.name, item.brand, item.notes, item.section, item.category, ...item.tags].filter(Boolean).join(' ')
      if (!haystack.toLowerCase().includes(needle)) continue
    }
    if (!sections.has(item.section)) sections.set(item.section, new Map())
    const categories = sections.get(item.section)
    if (!categories.has(item.category)) categories.set(item.category, [])
    categories.get(item.category).push(item)
  }

  return [...sections]
    .filter(([, categories]) => categories.size)
    .map(([name, categories]) => ({
      name,
      categories: [...categories].map(([category, items]) => ({ category, items }))
    }))
})
</script>

<style lang="scss" scoped>
.intro {
  color: #ccc;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

// Long tag lists stay at three rows and scroll sideways instead of filling the screen
.tag-strip {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  padding-bottom: 0.25rem;
}

.tag-row {
  display: flex;
  gap: 0.4rem;
  width: max-content;
}

.empty {
  color: #ccc;
}

.sections {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.gear-section {
  scroll-margin-top: 4.5rem; /* clear the sticky nav when jumping to a section */
  margin-bottom: 2rem;
}

.section-title {
  color: #9dff5c;
  font-size: clamp(1.4rem, 5vw, 1.9rem);
  margin-bottom: 0.75rem;
  border-bottom: 2px dashed #41b883;
  padding-bottom: 0.25rem;
}

.category {
  background: #41b883;
  color: #fff;
  padding: 1rem;
  margin-bottom: 1.25rem;
  box-shadow: 5px 5px #1d5c3f;

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }

  h3 {
    display: inline-block;
    font-size: 1.25rem;
    padding: 0.4rem 0.9rem;
    margin-bottom: 0.75rem;
    background: #2c2f33;
    box-shadow: 4px 4px #1d5c3f;
  }

  li {
    padding: 0.6rem 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.35);

    &:last-child {
      border-bottom: 0;
    }
  }
}

.item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
}

.name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.qty {
  font-weight: 400;
  opacity: 0.85;
}

.brand {
  font-size: 0.85rem;
  opacity: 0.9;
}

.notes {
  font-size: 0.85rem;
  font-style: italic;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background: #fef3c7;
  color: #92400e;
}

.status--unknown {
  background: #fee2e2;
  color: #991b1b;
}

.status--returned,
.status--retired {
  background: #e5e7eb;
  color: #374151;
}

.tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background: #e0e7ff;
  color: #3730a3;
}

.other a {
  color: #41b883;
}
</style>
