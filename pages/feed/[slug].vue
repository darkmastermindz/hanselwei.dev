<template>
  <main class="page">
    <article v-if="post" class="post">
      <NuxtLink to="/feed" class="back">← Curiosity Feed</NuxtLink>
      <img v-if="post.cover" :src="post.cover" alt="" class="cover" />
      <h1>{{ post.title }}</h1>
      <p class="meta">
        <time v-if="post.date" :datetime="post.date">{{ formatDate(post.date) }}</time>
        · {{ post.readingTime }} min read
        <template v-if="post.tags.length">
          · <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
        </template>
      </p>
      <p v-if="post.source === 'dev.to'" class="mirror">
        Originally published on
        <a :href="post.canonical" target="_blank" rel="noopener">dev.to</a>.
      </p>
      <div class="prose prose-invert prose-purple max-w-none" v-html="post.html" />
    </article>
  </main>
</template>

<script setup>
const route = useRoute()
const slug = String(route.params.slug)

const { data: post, error } = await useFetch(`/api/blog/${slug}`)
if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useHead({
  title: `${post.value.title} · hanselwei.dev`,
  meta: [{ name: 'description', content: post.value.description }],
  link: post.value.canonical ? [{ rel: 'canonical', href: post.value.canonical }] : []
})

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
</script>

<style lang="scss" scoped>
.post {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
  overflow-wrap: anywhere;

  h1 {
    font-size: clamp(1.8rem, 7vw, 2.75rem);
    line-height: 1.2;
    margin: 1rem 0 0.5rem;
  }

  :deep(pre) {
    overflow-x: auto;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.back,
.mirror a {
  color: #c084fc;
}

.cover {
  width: 100%;
  border-radius: 0.75rem;
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

.mirror {
  font-size: 0.85rem;
  padding: 0.6rem 0.9rem;
  border-left: 3px solid #c084fc;
  background: rgba(192, 132, 252, 0.08);
  margin-bottom: 1.5rem;
}
</style>
