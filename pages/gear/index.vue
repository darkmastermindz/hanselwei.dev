<template>
  <main class="page">
    <h1 class="page-title text-[#41b883]">Gear Inventory</h1>
    <p class="intro">
      Lists of the stuff I use, served by a
      <a href="/api/inventory" target="_blank" rel="noopener">Netlify function</a>.
      <LiveBadge :live="live" />
    </p>
    <div class="lists">
      <NuxtLink v-for="list in lists" :key="list.id" :to="`/gear/${list.id}`" class="list-card">
        <span class="emoji">{{ list.emoji }}</span>
        <span>
          <strong>{{ list.title }}</strong>
          <span class="count">{{ list.count }} {{ list.count === 1 ? 'item' : 'items' }}</span>
          <span class="desc">{{ list.description }}</span>
        </span>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup>
useHead({ title: 'Gear · Hansel Wei' })
const { lists, live } = useInventoryLists()
</script>

<style scoped>
.intro {
  color: #ccc;
  margin-bottom: 1.25rem;
}
.intro a {
  color: #41b883;
  text-decoration: underline; /* links in running text need more than colour */
}
.lists {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}
.list-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: #277a55; /* deep enough for the white text (5.3:1, WCAG AA) */
  color: #fff;
  text-decoration: none;
  box-shadow: 5px 5px #1d5c3f;
  transition: transform 0.15s ease;
}
.list-card:hover {
  transform: translateY(-2px);
}
.list-card strong {
  display: block;
  font-size: 1.25rem;
}
.emoji {
  font-size: 2.5rem;
  line-height: 1;
}
.count {
  display: block;
  font-size: 0.85rem; /* not dimmed: dimmed it fell below WCAG AA on the green */
}
.desc {
  display: block;
  margin-top: 0.4rem;
}
</style>
