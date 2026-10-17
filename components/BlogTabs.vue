<template>
  <nav class="blog-tabs" aria-label="Blog sections">
    <NuxtLink to="/blog" class="blog-tab" exact-active-class="is-active">✍️ Posts</NuxtLink>
    <NuxtLink to="/blog/feed" class="blog-tab" active-class="is-active">🔁 Curiosity Feed</NuxtLink>
  </nav>
</template>

<style scoped>
.blog-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.blog-tab {
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  border: 1px solid #653496;
  color: #ccc;
  text-decoration: none;
  font-size: 0.95rem;
}

.blog-tab.is-active {
  background: #653496;
  color: #fff;
  border-color: #c084fc;
}
</style>
