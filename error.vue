<template>
  <!-- Nuxt's error page: a page that isn't here (prerendered as 404.html, which Netlify serves for
       unknown paths), or one that failed. Lost? Play a classic game (components/LostArcade.vue). -->
  <NuxtLayout>
    <main class="page lost">
      <h1 class="page-title text-[#c084fc]">{{ notFound ? '404 · Page not found' : 'Something went wrong' }}</h1>
      <section class="lost__card">
        <p v-if="notFound">There's nothing at this address. It may have moved, or the link may have a typo.</p>
        <p v-else>This page couldn't load. Try again in a moment.</p>
        <div class="flex flex-wrap gap-3 pt-4">
          <button type="button" class="button--green" @click="home">Take me home 🏠</button>
          <NuxtLink to="/blog" class="button--grey" @click="clearError()">Read the blog 📰</NuxtLink>
        </div>
      </section>
      <p class="lost__hint">While you're here:</p>
      <LostArcade />
    </main>
  </NuxtLayout>
</template>

<script setup>
const props = defineProps({ error: { type: Object, default: () => ({}) } })

const notFound = computed(() => !props.error?.statusCode || props.error.statusCode === 404)

useHead({ title: () => (notFound.value ? 'Page not found · Hansel Wei' : 'Something went wrong · Hansel Wei') })

const home = () => clearError({ redirect: '/' })
</script>

<style scoped>
.lost__card {
  background: #23262a;
  color: #eee;
  padding: 1.25rem;
  box-shadow: 5px 5px #653496;
}

.lost__card .button--green,
.lost__card .button--grey {
  margin: 0;
  background: transparent;
  font: inherit;
}

.lost__hint {
  margin-top: 2rem;
  text-align: center;
  color: #bbb;
}
</style>
