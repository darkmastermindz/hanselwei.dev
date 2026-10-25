<template>
  <main class="page">
    <h1 class="page-title text-[#41b883]">{{ inventory.emoji }} Hansel's {{ inventory.title }}</h1>
    <p class="intro">
      {{ inventory.description }}
      <LiveBadge :live="live" />
    </p>

    <!-- The owner's editor (README "Editing gear lists"): changes collect here and go to the
         "Gear updates" pull request when sent -->
    <div v-if="user" class="editor-bar">
      <button type="button" class="btn btn-sm editor-toggle" :class="{ 'is-on': editor.editing.value }" :aria-pressed="editor.editing.value" @click="editor.editing.value = !editor.editing.value">
        {{ editor.editing.value ? 'Done editing' : '✏️ Edit list' }}
      </button>
      <button v-if="editor.editing.value && !adding" type="button" class="btn btn-sm btn-outline btn-success" @click="startAdd({})">＋ Add item</button>
      <p v-if="editor.sent.value" class="editor-note" role="status">
        Sent. The changes go into the <a :href="PR_URL" target="_blank" rel="noopener">Gear updates pull request</a> at its next run: weekly, whenever a pull request merges, or
        <a :href="WORKFLOW_URL" target="_blank" rel="noopener">now</a>.
      </p>
    </div>
    <GearItemForm
      v-if="adding && !adding.category"
      :defaults="adding"
      :sections="shown.sections"
      :categories="categories"
      :tags="allTags"
      @save="item => { editor.add(item); adding = null }"
      @cancel="adding = null"
    />

    <nav v-if="showSectionHeadings" class="sections" aria-label="Sections">
      <ChipStrip v-slot="{ item: name }" :items="shown.sections" label="Jump to a section">
        <a :href="`#${slugify(name)}`" class="badge badge-lg badge-success badge-outline">{{ name }}</a>
      </ChipStrip>
    </nav>

    <div class="filters">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full sm:max-w-xs"
        placeholder="Search gear…"
        aria-label="Search gear"
      />
      <ChipStrip v-if="inventory.statuses.length > 1" v-slot="{ item: key }" :items="inventory.statuses" label="Filter by status">
        <button
          type="button"
          :class="['badge badge-lg', activeStatus === key ? 'badge-warning' : 'badge-outline text-gray-300']"
          :aria-pressed="activeStatus === key"
          @click="activeStatus = activeStatus === key ? null : key"
        >
          {{ statuses[key].emoji }} {{ statuses[key].label }}
        </button>
      </ChipStrip>
      <button v-if="activeTag" type="button" class="badge badge-lg badge-success self-start" @click="activeTag = null">
        ✕ {{ hashtag(activeTag) }}
      </button>
      <ChipStrip v-slot="{ item: tag }" :items="inventory.tags" label="Filter by tag">
        <button
          type="button"
          :class="['badge badge-lg', activeTag === tag ? 'badge-success' : 'badge-outline text-gray-300']"
          :aria-pressed="activeTag === tag"
          @click="activeTag = activeTag === tag ? null : tag"
        >
          {{ hashtag(tag) }}
        </button>
      </ChipStrip>
    </div>

    <p v-if="!grouped.length" class="empty">No gear matches that filter.</p>

    <section v-for="section in grouped" :id="slugify(section.name)" :key="section.name" class="gear-section">
      <h2 v-if="showSectionHeadings" class="section-title">{{ section.name }}</h2>
      <div v-for="group in section.categories" :key="group.category" class="category">
        <h3>{{ group.category }}</h3>
        <ul>
          <li v-for="item in group.items" :key="item.id">
            <GearItemForm
              v-if="editingId === item.id"
              :item="item"
              :sections="shown.sections"
              :categories="categories"
              :tags="allTags"
              @save="changed => { editor.update(item.id, changed); editingId = null }"
              @cancel="editingId = null"
            />
            <template v-else>
            <div class="item">
              <span class="name">
                {{ item.name }}
                <span v-if="item.qty > 1" class="qty">×{{ item.qty }}</span>
              </span>
              <span v-if="item.brand" class="brand">{{ item.brand }}</span>
            </div>
            <p v-if="item.notes" class="notes"><TermText :text="item.notes" /></p>
            <div v-if="item.status !== 'owned' || item.tags.length" class="item-tags">
              <span v-if="item.status !== 'owned'" :class="['status', `status--${item.status}`]">
                {{ statuses[item.status]?.emoji }} {{ statuses[item.status]?.label ?? item.status }}
              </span>
              <span v-for="tag in item.tags" :key="tag" class="tag"><TermText :text="hashtag(tag)" /></span>
            </div>
            <div v-if="editor.editing.value" class="item-actions">
              <button type="button" class="btn btn-xs" :aria-label="`Edit ${item.name}`" @click="editingId = item.id">Edit</button>
              <button type="button" class="btn btn-xs btn-error btn-outline" :aria-label="`Remove ${item.name}`" @click="editor.remove(item.id)">Remove</button>
            </div>
            </template>
          </li>
        </ul>
        <GearItemForm
          v-if="adding && adding.section === section.name && adding.category === group.category"
          :defaults="adding"
          :sections="shown.sections"
          :categories="categories"
          :tags="allTags"
          @save="item => { editor.add(item); adding = null }"
          @cancel="adding = null"
        />
        <button
          v-else-if="editor.editing.value"
          type="button"
          class="btn btn-xs btn-ghost add-here"
          @click="startAdd({ section: section.name, category: group.category })"
        >＋ Add to {{ group.category }}</button>
      </div>
    </section>

    <aside v-if="user && editor.pending.value.length" :class="['pending', { 'is-docked': !editingId && !adding }]" aria-label="Unsent gear changes">
      <h2>{{ editor.pending.value.length }} unsent change{{ editor.pending.value.length === 1 ? '' : 's' }}</h2>
      <ol>
        <li v-for="(line, i) in editor.changes.value" :key="i">
          {{ line }}
          <button type="button" class="btn btn-xs btn-ghost" :aria-label="`Undo: ${line}`" @click="editor.undo(i)">Undo</button>
        </li>
      </ol>
      <p v-if="editor.problem.value" class="pending__problem" role="alert">{{ editor.problem.value }}</p>
      <div class="pending__buttons">
        <button type="button" class="btn btn-sm editor-send" :disabled="editor.sending.value" @click="editor.send()">
          {{ editor.sending.value ? 'Sending…' : 'Send for review' }}
        </button>
        <button type="button" class="btn btn-sm btn-ghost" :disabled="editor.sending.value" @click="editor.discard()">Discard all</button>
      </div>
    </aside>

    <p class="other">
      <NuxtLink to="/gear">← All gear lists</NuxtLink>
    </p>
  </main>
</template>

<script setup>
import { hashtag, searchText, tagSearchText } from '~/utils/chips.js'
import { hasInventory, inventories, statuses } from '~/data/inventory.mjs'

const route = useRoute()
const id = String(route.params.list)

if (!hasInventory(id)) {
  throw createError({ statusCode: 404, statusMessage: 'Gear list not found', fatal: true })
}

const { inventory, live } = useInventory(id)
const { user } = useAuth()
const editor = useGearEditor(id, inventory)
const PR_URL = 'https://github.com/darkmastermindz/hanselwei.dev/pulls?q=is%3Apr+is%3Aopen+head%3Agear-updates'
const WORKFLOW_URL = 'https://github.com/darkmastermindz/hanselwei.dev/actions/workflows/gear-updates.yml'
// The list as shown: with the owner's unsent changes in, while there are any
const shown = computed(() => (user.value ? editor.preview.value : inventory.value))
const categories = computed(() => [...new Set(shown.value.items.map(i => i.category))])
const allTags = computed(() => [...new Set(shown.value.items.flatMap(i => i.tags))].sort())
const editingId = ref(null)
const adding = ref(null) // { section?, category? } while the add form is open
const startAdd = defaults => {
  editingId.value = null
  adding.value = { ...defaults }
}
useHead({ title: () => `${inventory.value.title} · Hansel Wei` })

const search = ref('')
const activeTag = ref(null)
const activeStatus = ref(null)

const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const showSectionHeadings = computed(() => shown.value.sections.length > 1)

// section -> category -> items, in the list's section order
const grouped = computed(() => {
  const needle = searchText(search.value).toLowerCase() // "#climbing" finds climbing
  const sections = new Map(shown.value.sections.map(name => [name, new Map()]))

  for (const item of shown.value.items) {
    if (activeTag.value && !item.tags.includes(activeTag.value)) continue
    if (activeStatus.value && item.status !== activeStatus.value) continue
    if (needle) {
      const haystack = [item.name, item.brand, item.notes, item.section, item.category, tagSearchText(item.tags)].filter(Boolean).join(' ')
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

.empty {
  color: #ccc;
}

.sections {
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

/* A deeper green than the site's #41b883 so the white text reads (5.3:1, WCAG AA) */
.category {
  background: #277a55;
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
  font-weight: 400; /* set apart by weight, not dimming: dimmed it fell below WCAG AA */
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

.editor-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 1rem;
}

/* The theme's own button colours read as grey here; the site's green marks the main actions */
.editor-toggle,
.editor-send {
  background: #9dff5c;
  border-color: #9dff5c;
  color: #1d232a;

  &:hover {
    background: #7cfc00;
    border-color: #7cfc00;
  }
}

.editor-toggle.is-on {
  background: #fde68a;
  border-color: #fde68a;
}

.editor-note {
  color: #ccc;
  font-size: 0.9rem;

  a {
    color: #9dff5c;
    text-decoration: underline;
  }
}

.item-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.add-here {
  margin-top: 0.4rem;
  color: #fff;
}

/* Docked to the bottom of the screen, except while a form is open (it would cover the form) */
.pending.is-docked {
  position: sticky;
  bottom: 0.75rem;
  z-index: 5;
}

.pending {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #1d232a;
  color: #eee;
  border: 2px solid #9dff5c;
  box-shadow: 5px 5px #1d5c3f;

  h2 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  ol {
    max-height: 30vh;
    overflow-y: auto;
    margin-bottom: 0.75rem;
    padding-left: 1.25rem;
    list-style: decimal;
    font-size: 0.9rem;
  }
}

.pending__problem {
  color: #fca5a5;
  margin-bottom: 0.5rem;
}

.pending__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.other a {
  color: #41b883;
}
</style>
