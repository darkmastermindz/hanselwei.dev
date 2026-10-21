<template>
  <main class="page">
    <article class="bio">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <ClientOnly>
        <PinnedPhoto />
      </ClientOnly>
      <h1>{{ bio.title }}</h1>
      <div class="prose prose-invert max-w-none" v-html="bio.html" />

      <section v-if="bio.readme" class="readme" aria-labelledby="readme-title">
        <h2 id="readme-title">From my GitHub profile</h2>
        <div class="prose prose-invert max-w-none" v-html="bio.readme" />
        <a href="https://github.com/darkmastermindz/darkmastermindz/blob/main/README.md" target="_blank" rel="noopener">
          Read it on GitHub
        </a>
      </section>
    </article>
  </main>
</template>

<script setup>
const { data: bio, error } = await useFetch('/api/bio')
if (error.value || !bio.value) {
  throw createError({ statusCode: 404, statusMessage: 'Bio not found', fatal: true })
}

useHead({
  title: `${bio.value.title} · Hansel Wei`,
  meta: [
    { name: 'description', content: bio.value.description },
    // The pinned photo isn't for AI training or image search (also sent as headers by /api/bio-photo)
    { name: 'robots', content: 'noai, noimageai' }
  ]
})
</script>

<style lang="scss" scoped>
.bio {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
  overflow-wrap: anywhere;

  h1 {
    font-size: clamp(1.8rem, 7vw, 2.75rem);
    line-height: 1.2;
    margin: 1rem 0 0.5rem;
  }

  .readme {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #333;

    h2 {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
    }

    a {
      color: #fbbf24;
    }
  }
}

.back {
  color: #fbbf24;
}
</style>
