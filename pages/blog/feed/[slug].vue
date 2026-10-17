<template>
  <main class="page">
    <article v-if="entry" class="entry">
      <NuxtLink to="/blog/feed" class="back">← Curiosity Feed</NuxtLink>
      <h1>{{ entry.title }}</h1>
      <p class="meta">
        <time v-if="entry.date" :datetime="entry.date">{{ formatDate(entry.date) }}</time>
        <template v-if="entry.series"> · 🔁 {{ entry.series }} #{{ entry.seriesNumber }}</template>
        <template v-if="entry.tags.length">
          · <span v-for="tag in entry.tags" :key="tag" class="tag">#{{ tag }}</span>
        </template>
      </p>
      <div class="prose prose-invert prose-purple max-w-none" v-html="entry.html" />
      <a v-if="entry.link" :href="entry.link" target="_blank" rel="noopener" class="link">🔗 {{ entry.link }}</a>
    </article>
  </main>
</template>

<script setup>
const route = useRoute()
const slug = String(route.params.slug)

const { data: entry, error } = await useFetch(`/api/feed/${slug}`)
if (error.value || !entry.value) {
  throw createError({ statusCode: 404, statusMessage: 'Entry not found', fatal: true })
}

useHead({
  title: `${entry.value.title} · Curiosity Feed`,
  meta: [{ name: 'description', content: entry.value.description }]
})

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
</script>

<style lang="scss" scoped>
.entry {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
  overflow-wrap: anywhere;

  h1 {
    font-size: clamp(1.6rem, 6vw, 2.3rem);
    line-height: 1.2;
    margin: 1rem 0 0.5rem;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.back,
.link {
  color: #c084fc;
}

.link {
  display: inline-block;
  margin-top: 1rem;
}

.meta {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
}

.tag {
  margin-right: 0.35rem;
}
</style>
