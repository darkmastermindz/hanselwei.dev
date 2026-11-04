<template>
  <main class="page">
    <article v-if="post" class="post">
      <NuxtLink :to="post.series ? '/blog/feed' : '/blog'" class="back">
        ← {{ post.series ? 'Curiosity Feed' : 'All posts' }}
      </NuxtLink>
      <img v-if="post.cover" :src="post.cover" alt="" class="cover" />
      <h1>{{ post.title }}</h1>
      <p class="meta">
        <time v-if="post.date" :datetime="post.date">{{ formatDate(post.date) }}</time>
        · {{ post.readingTime }} min read
        <span v-if="post.series" class="series">· 🔁 {{ post.series }} #{{ post.seriesNumber }}</span>
        <template v-if="post.tags.length">
          · <span v-for="tag in post.tags" :key="tag" class="tag">{{ hashtag(tag) }}</span>
        </template>
      </p>
      <p v-if="post.source === 'dev.to'" class="mirror">
        Originally published on
        <a :href="post.canonical" target="_blank" rel="noopener">dev.to</a>.
      </p>
      <div ref="body" class="prose prose-invert prose-purple max-w-none" v-html="post.html" />
      <p class="post-actions">
        <span v-if="kudos.available.value">Enjoyed this post?</span>
        <KudosButton :id="`post-${slug}`" :name="post.title" />
        <ShareButton :path="`/blog/${slug}`" :title="post.title" />
      </p>
    </article>
  </main>
</template>

<script setup>
import { hashtag } from '~/utils/chips.js'

const route = useRoute()
const slug = String(route.params.slug)

const { data: post, error } = await useFetch(`/api/blog/${slug}`)
if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useHead({
  title: `${post.value.title} · Hansel Wei`,
  meta: [
    { name: 'description', content: post.value.description },
    // The post's tags, for search engines and site search
    ...(post.value.tags.length ? [{ name: 'keywords', content: post.value.tags.join(', ') }] : [])
  ],
  link: post.value.canonical ? [{ rel: 'canonical', href: post.value.canonical }] : []
})

// Kudos for the post (components/KudosButton.vue), live while it's open; sharing is
// components/ShareButton.vue
const kudos = useKudos()
kudos.watchActive(() => true)

// Tables wider than the post scroll sideways (server/utils/blog.js wraps them): flag the ones
// that overflow so they show a hint and an edge fade, and which ends still have more to see
const body = ref(null)
const markTables = () => {
  for (const scroller of body.value?.querySelectorAll('.table-scroll') ?? []) {
    const more = scroller.scrollWidth - scroller.clientWidth
    const wrap = scroller.closest('.table-wrap')
    wrap.toggleAttribute('data-overflow', more > 1)
    wrap.toggleAttribute('data-more-left', scroller.scrollLeft > 1)
    wrap.toggleAttribute('data-more-right', scroller.scrollLeft < more - 1)
  }
}
// The first time an overflowing table comes into view (or gets keyboard focus), it peeks a little
// way right and back so it's obvious it scrolls, and the hint's arrow nudges. Never with reduced
// motion, and never once the reader has started scrolling it themselves.
const PEEK = 56
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const touched = new WeakSet()
const peek = scroller => {
  const wrap = scroller.closest('.table-wrap')
  if (!wrap.hasAttribute('data-overflow') || wrap.hasAttribute('data-peeked')) return
  wrap.setAttribute('data-peeked', '')
  if (reducedMotion() || touched.has(scroller) || scroller.scrollLeft > 1) return
  scroller.scrollTo({ left: Math.min(PEEK, scroller.scrollWidth - scroller.clientWidth), behavior: 'smooth' })
  setTimeout(() => {
    if (!touched.has(scroller)) scroller.scrollTo({ left: 0, behavior: 'smooth' })
  }, 700)
}
let resizes, sightings
onMounted(() => {
  resizes = new ResizeObserver(markTables)
  sightings = new IntersectionObserver(
    entries => entries.filter(e => e.isIntersecting).forEach(e => peek(e.target)),
    { threshold: 0.6 }
  )
  for (const scroller of body.value?.querySelectorAll('.table-scroll') ?? []) {
    resizes.observe(scroller)
    sightings.observe(scroller)
    scroller.addEventListener('scroll', markTables, { passive: true })
    for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown']) {
      scroller.addEventListener(type, () => touched.add(scroller), { passive: true })
    }
    scroller.addEventListener('focus', () => scroller.matches(':focus-visible') && peek(scroller))
  }
  markTables()
})
onBeforeUnmount(() => {
  resizes?.disconnect()
  sightings?.disconnect()
})

const formatDate = iso =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
</script>

<style lang="scss" scoped>
@keyframes table-hint-nudge {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(0.35rem);
  }
}

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

  :deep(.table-wrap) {
    margin: 1.5em 0;

    table {
      margin: 0;
      overflow-wrap: normal;
    }

    code {
      white-space: nowrap;
    }
  }

  // Shown (with the fades and a roomier scrollbar) only on tables that overflow
  :deep(.table-hint) {
    display: none;
    margin: 0 0 0.4rem;
    text-align: right;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #c084fc;
  }

  :deep(.table-wrap[data-overflow] .table-hint) {
    display: block;
  }

  :deep(.table-hint-arrow) {
    display: inline-block;
  }

  :deep(.table-wrap[data-peeked] .table-hint-arrow) {
    animation: table-hint-nudge 0.7s ease-in-out 3;
  }

  @media (prefers-reduced-motion: reduce) {
    :deep(.table-wrap[data-peeked] .table-hint-arrow) {
      animation: none;
    }
  }

  :deep(.table-frame) {
    position: relative;

    // Edge fades over whichever side has more table to scroll to
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0.9rem;
      width: 3rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1;
    }

    &::before {
      left: 0;
      background: linear-gradient(to right, #2c2f33, transparent);
    }

    &::after {
      right: 0;
      background: linear-gradient(to left, #2c2f33, transparent);
    }
  }

  :deep(.table-wrap[data-more-left] .table-frame::before),
  :deep(.table-wrap[data-more-right] .table-frame::after) {
    opacity: 1;
  }

  :deep(.table-scroll) {
    overflow-x: auto;
    scrollbar-color: #c084fc rgba(192, 132, 252, 0.15);

    &::-webkit-scrollbar {
      height: 0.5rem;
    }

    &::-webkit-scrollbar-track {
      background: rgba(192, 132, 252, 0.15);
      border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb {
      background: #c084fc;
      border-radius: 1rem;
    }

    &:focus-visible {
      outline: 2px solid #c084fc;
      outline-offset: 2px;
    }
  }

  :deep(.table-wrap[data-overflow] .table-scroll) {
    padding-bottom: 0.4rem;
  }

  :deep(figure) {
    margin: 2em 0;

    img {
      width: 100%;
      border-radius: 0.875rem;
    }

    figcaption {
      color: #a8a3b8;
      font-size: 0.85rem;
      margin-top: 0.6em;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.post-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  color: #cbd5e1;
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

.series {
  color: #9dff5c;
}

.mirror {
  font-size: 0.85rem;
  padding: 0.6rem 0.9rem;
  border-left: 3px solid #c084fc;
  background: rgba(192, 132, 252, 0.08);
  margin-bottom: 1.5rem;
}
</style>
