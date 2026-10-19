<template>
  <main class="page">
    <article class="terms">
      <NuxtLink to="/" class="back">← Home</NuxtLink>
      <h1>Terms of Service</h1>
      <p>©️ 2026 hanselwei.dev. All rights reserved.</p>
      <p>The contents of this website may not be reproduced without written permission.</p>
      <p>
        To ask for permission, email
        <a href="mailto:hello+hansel@hanselwei.dev">hello+hansel@hanselwei.dev</a>.
      </p>
    </article>
  </main>
</template>

<script setup>
useHead({
  title: 'Terms of Service · hanselwei.dev',
  meta: [{ name: 'description', content: 'The contents of hanselwei.dev may not be reproduced without written permission.' }]
})
</script>

<style scoped>
.terms {
  max-width: 46rem;
  margin: 0 auto;
  color: #ddd;
  line-height: 1.7;
}

.terms h1 {
  font-size: clamp(1.8rem, 7vw, 2.5rem);
  margin: 1rem 0;
}

.terms p {
  margin-bottom: 1rem;
}

.terms a {
  color: #fbbf24;
}

.back {
  color: #fbbf24;
}
</style>
