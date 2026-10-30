<template>
  <main class="page">
    <h1 class="page-title text-purple-300">Curiosity Feed</h1>
    <BlogTabs />
    <p class="intro">
      Short, recurring updates over time: series I post to regularly, newsletter-style.
      One-off write-ups are under <NuxtLink to="/blog">Posts</NuxtLink>.
      <a href="/feed.xml" class="rss">Subscribe via RSS</a>
    </p>

    <ChipStrip v-if="seriesList.length" v-slot="{ item: name }" :items="seriesList" class="tags" label="Filter by series">
      <button
        type="button"
        :class="['badge badge-lg', activeSeries === name ? 'badge-success' : 'badge-outline text-gray-300']"
        :aria-pressed="activeSeries === name"
        @click="activeSeries = activeSeries === name ? null : name"
      >
        🔁 {{ name }}
      </button>
    </ChipStrip>

    <ChipStrip v-if="tags.length" v-slot="{ item: tag }" :items="tags" class="tags" label="Filter by tag">
      <button
        type="button"
        :class="['badge badge-lg', activeTag === tag ? 'badge-secondary' : 'badge-outline text-gray-300']"
        :aria-pressed="activeTag === tag"
        @click="activeTag = activeTag === tag ? null : tag"
      >
        {{ hashtag(tag) }}
      </button>
    </ChipStrip>

    <p v-if="!filtered.length" class="intro">Nothing here yet.</p>

    <section v-for="group in grouped" :key="group.month" class="issue">
      <h2 class="issue__month">{{ group.month }}</h2>
      <article v-for="entry in group.entries" :id="entry.slug" :key="entry.slug" class="entry">
        <p class="entry__meta">
          <time v-if="entry.date" :datetime="entry.date">{{ formatDate(entry.date) }}</time>
          <span v-if="entry.series" class="entry__series">🔁 {{ entry.series }} #{{ entry.seriesNumber }}</span>
          <span v-for="tag in entry.tags" :key="tag">{{ hashtag(tag) }}</span>
        </p>
        <h3 class="entry__title">
          <NuxtLink :to="`/blog/${entry.slug}`">{{ entry.title }}</NuxtLink>
        </h3>
        <div class="prose prose-invert prose-purple max-w-none entry__body" v-html="entry.html" />
        <a v-if="entry.link" :href="entry.link" target="_blank" rel="noopener" class="entry__link">
          🔗 {{ hostname(entry.link) }}
        </a>
        <p class="entry__actions">
          <KudosButton :id="`post-${entry.slug}`" :name="entry.title" />
          <ShareButton :path="`/blog/${entry.slug}`" :title="entry.title" />
        </p>
      </article>
    </section>
  </main>
</template>

<script setup>
import { hashtag } from '~/utils/chips.js'

useHead({ title: 'Curiosity Feed · Hansel Wei' })

const { data: entries } = await useFetch('/api/blog/feed', { default: () => [] })
// Kudos on each entry (components/KudosButton.vue), live while the feed is open
const kudos = useKudos()
kudos.watchActive(() => true)

const activeTag = ref(null)
const activeSeries = ref(null)
const tags = computed(() => [...new Set(entries.value.flatMap(e => e.tags))].sort())
const seriesList = computed(() => [...new Set(entries.value.map(e => e.series).filter(Boolean))].sort())
const filtered = computed(() =>
  entries.value.filter(
    e => (!activeTag.value || e.tags.includes(activeTag.value)) && (!activeSeries.value || e.series === activeSeries.value)
  )
)

// Newsletter-style: one "issue" per month
const grouped = computed(() => {
  const groups = new Map()
  for (const entry of filtered.value) {
    const month = entry.date
      ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' })
      : 'Undated'
    if (!groups.has(month)) groups.set(month, [])
    groups.get(month).push(entry)
  }
  return [...groups].map(([month, entries]) => ({ month, entries }))
})

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

const hostname = url => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
</script>

<style lang="scss" scoped>
.intro {
  color: #ccc;
  margin-bottom: 1rem;

  a {
    color: #c084fc;
  }
}

.rss {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;
  border: 1px solid currentColor;
  border-radius: 9999px;
  white-space: nowrap;
}

.tags {
  margin-bottom: 1.5rem;
}

.issue {
  max-width: 46rem;
  margin: 0 auto 2rem;
}

.issue__month {
  font-size: 1.1rem;
  color: #9dff5c;
  border-bottom: 2px dashed #653496;
  padding-bottom: 0.25rem;
  margin-bottom: 1rem;
}

.entry {
  position: relative;
  padding: 0 0 1.5rem 1.25rem;
  margin-left: 0.4rem;
  border-left: 2px solid #3a3f45;
  color: #ddd;
  overflow-wrap: anywhere;
  scroll-margin-top: 4.5rem;

  /* timeline dot */
  &::before {
    content: '';
    position: absolute;
    left: -7px;
    top: 0.35rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #c084fc;
    box-shadow: 0 0 0 3px #2c2f33;
  }
}

.entry__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #999;
}

.entry__series {
  color: #9dff5c;
}

.entry__title {
  font-size: 1.2rem;
  margin: 0.15rem 0 0.4rem;

  a {
    color: #eee;
    text-decoration: none;
  }
  a:hover {
    color: #c084fc;
  }
}

.entry__body :deep(img) {
  max-width: 100%;
  height: auto;
}

.entry__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
}

.entry__link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  padding: 0.2rem 0.7rem;
  border-radius: 9999px;
  background: rgba(192, 132, 252, 0.12);
  color: #c084fc;
}
</style>
