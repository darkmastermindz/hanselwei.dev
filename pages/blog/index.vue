<template>
  <main class="page">
    <h1 class="page-title text-purple-300">Blog</h1>
    <p class="intro">
      One-shot write-ups: each post stands on its own. Posts from
      <a href="https://dev.to/hansel" target="_blank" rel="noopener">DEV Community</a> are mirrored here too.
      For recurring updates, see the <NuxtLink to="/feed">Curiosity Feed</NuxtLink>.
      <a href="/rss.xml" class="rss">RSS</a>
    </p>

    <div v-if="tags.length" class="tags" role="group" aria-label="Filter by tag">
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        :class="['badge badge-lg', activeTag === tag ? 'badge-secondary' : 'badge-outline text-gray-300']"
        :aria-pressed="activeTag === tag"
        @click="activeTag = activeTag === tag ? null : tag"
      >
        #{{ tag }}
      </button>
    </div>

    <p v-if="!filtered.length" class="intro">No posts yet.</p>

    <div class="posts">
      <NuxtLink v-for="post in filtered" :key="post.slug" :to="`/blog/${post.slug}`" class="post-card">
        <img v-if="post.cover" :src="post.cover" alt="" loading="lazy" class="cover" />
        <div class="body">
          <p class="meta">
            <time v-if="post.date" :datetime="post.date">{{ formatDate(post.date) }}</time>
            · {{ post.readingTime }} min read
            <span v-if="post.source === 'dev.to'" class="badge badge-sm badge-neutral">dev.to</span>
          </p>
          <h2>{{ post.title }}</h2>
          <p class="desc">{{ post.description }}</p>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup>
useHead({ title: 'Blog · hanselwei.dev' })

const { data: posts } = await useFetch('/api/blog', { default: () => [] })

const activeTag = ref(null)
const tags = computed(() => [...new Set(posts.value.flatMap(p => p.tags))].sort())
const filtered = computed(() =>
  activeTag.value ? posts.value.filter(p => p.tags.includes(activeTag.value)) : posts.value
)

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
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
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
}

.posts {
  display: grid;
  gap: 1rem;
}

.post-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #eee;
  color: #171515;
  text-decoration: none;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @media (min-width: 640px) {
    flex-direction: row;

    .cover {
      width: 14rem;
      height: auto;
    }
  }
}

.cover {
  width: 100%;
  height: 10rem;
  object-fit: cover;
  flex-shrink: 0;
}

.body {
  padding: 1rem 1.25rem;
  min-width: 0;

  h2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #6b21a8;
    overflow-wrap: anywhere;
  }
}

.meta {
  font-size: 0.8rem;
  color: #555;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.desc {
  margin-top: 0.35rem;
}
</style>
