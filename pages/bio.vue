<template>
  <main class="page">
    <article class="bio">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h1>{{ bio.title }}</h1>
      <div class="prose prose-invert max-w-none" v-html="bio.html" />
    </article>
  </main>
</template>

<script setup>
const { data: bio, error } = await useFetch('/api/bio')
if (error.value || !bio.value) {
  throw createError({ statusCode: 404, statusMessage: 'Bio not found', fatal: true })
}

useHead({
  title: `${bio.value.title} · hanselwei.dev`,
  meta: [{ name: 'description', content: bio.value.description }]
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
}

.back {
  color: #fbbf24;
}
</style>
