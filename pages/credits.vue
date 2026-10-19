<template>
  <main class="page">
    <article class="credits">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h1>Open source software &lt;3</h1>
      <p class="intro">
        This site is built with open-source software. Thank you to everyone who makes and maintains
        it. Each project is credited here under its license, with a link to its source on GitHub.
      </p>

      <ul class="list">
        <li v-for="pkg in credits.packages" :key="pkg.name" class="card">
          <h2>
            <a v-if="pkg.url" :href="pkg.url" target="_blank" rel="noopener">{{ pkg.name }}</a>
            <template v-else>{{ pkg.name }}</template>
            <span v-if="pkg.version" class="version">{{ pkg.version }}</span>
          </h2>
          <p class="use">{{ pkg.use }}</p>
          <p class="legal">
            <span v-if="pkg.license" class="license">{{ pkg.license }}</span>
            <span v-if="pkg.copyright">{{ pkg.copyright }}</span>
          </p>
        </li>
      </ul>

      <h2 class="section">Fonts</h2>
      <ul class="list">
        <li v-for="font in credits.fonts" :key="font.name" class="card">
          <h2><a :href="font.url" target="_blank" rel="noopener">{{ font.name }}</a></h2>
          <p class="use">{{ font.use }}, by {{ font.author }}</p>
          <p class="legal">
            <a :href="font.licenseUrl" target="_blank" rel="noopener" class="license">{{ font.license }}</a>
          </p>
        </li>
      </ul>

      <p class="note">
        The full license text of each package ships with it and is in its GitHub repository.
      </p>
    </article>
  </main>
</template>

<script setup>
// Generated at build time from the installed packages (scripts/build-credits.mjs)
import credits from '~/data/credits.generated.json'

useHead({
  title: 'Open source software · hanselwei.dev',
  meta: [{ name: 'description', content: 'The open-source software hanselwei.dev is built with, and their licenses.' }]
})
</script>

<style scoped>
.credits {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
}

h1 {
  font-size: clamp(1.8rem, 7vw, 2.5rem);
  margin: 1rem 0 0.75rem;
}

.intro,
.note {
  line-height: 1.7;
  margin-bottom: 1.25rem;
}

.note {
  color: #999;
  font-size: 0.85rem;
  margin-top: 1.5rem;
}

.section {
  font-size: 1.3rem;
  margin: 1.75rem 0 0.75rem;
}

.list {
  display: grid;
  gap: 0.6rem;
}

@media (min-width: 640px) {
  .list {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  padding: 0.75rem 0.9rem;
  background: #23262a;
  border: 1px solid #3a3d42;
  border-radius: 0.5rem;
  overflow-wrap: anywhere;
}

.card h2 {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.card a {
  color: #c084fc;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.version {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #888;
}

.use {
  font-size: 0.85rem;
  color: #bbb;
}

.legal {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #999;
}

.license {
  padding: 0 0.4rem;
  border: 1px solid #41b883;
  border-radius: 9999px;
  color: #41b883;
}

.legal a.license {
  color: #41b883;
  text-decoration: none;
}

.back {
  color: #fbbf24;
}
</style>
