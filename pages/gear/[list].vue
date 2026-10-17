<template>
  <main class="page">
    <h1 class="page-title text-[#41b883]">{{ inventory.emoji }} Hansel's {{ inventory.title }}</h1>
    <p class="intro">
      {{ inventory.description }}
      <LiveBadge :live="live" />
    </p>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full sm:max-w-xs"
        placeholder="Search gear…"
        aria-label="Search gear"
      />
      <div class="tags" role="group" aria-label="Filter by tag">
        <button
          v-for="tag in inventory.tags"
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

    <p v-if="!grouped.length" class="empty">No gear matches that filter.</p>

    <section v-for="group in grouped" :key="group.category" class="category">
      <h2>{{ group.category }}</h2>
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
          <div v-if="item.tags.length" class="item-tags">
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </li>
      </ul>
    </section>

    <p class="other">
      <NuxtLink to="/gear">← All gear lists</NuxtLink>
    </p>
  </main>
</template>

<script setup>
import { inventories } from '~/data/inventory.mjs'

const route = useRoute()
const id = String(route.params.list)

if (!inventories[id]) {
  throw createError({ statusCode: 404, statusMessage: 'Gear list not found', fatal: true })
}

const { inventory, live } = useInventory(id)
useHead({ title: () => `${inventory.value.title} · hanselwei.dev` })

const search = ref('')
const activeTag = ref(null)

const grouped = computed(() => {
  const needle = search.value.trim().toLowerCase()
  const groups = new Map()

  for (const item of inventory.value.items) {
    if (activeTag.value && !item.tags.includes(activeTag.value)) continue
    if (needle) {
      const haystack = [item.name, item.brand, item.notes, item.category, ...item.tags].filter(Boolean).join(' ')
      if (!haystack.toLowerCase().includes(needle)) continue
    }
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category).push(item)
  }

  return [...groups].map(([category, items]) => ({ category, items }))
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

.empty {
  color: #ccc;
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

  h2 {
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
