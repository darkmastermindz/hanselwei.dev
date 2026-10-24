<template>
  <!-- Only on a foldable in book (<html data-fold="book">): turn to the previous or next chapter
       from the corners of the right page, like a book (utils/pageTurn.mjs) -->
  <nav class="book-pager" aria-label="Turn the page">
    <NuxtLink v-if="pages.prev" :to="pages.prev.to" class="book-pager__corner book-pager__corner--prev">
      ‹ {{ pages.prev.label }}
    </NuxtLink>
    <NuxtLink v-if="pages.next" :to="pages.next.to" class="book-pager__corner book-pager__corner--next">
      {{ pages.next.label }} ›
    </NuxtLink>
  </nav>
</template>

<script setup>
import { neighbours } from '~/utils/pageTurn.mjs'

const route = useRoute()
const pages = computed(() => neighbours(route.path))
</script>

<style scoped>
.book-pager {
  display: none;
}

:root[data-fold='book'] .book-pager {
  position: fixed;
  bottom: 0;
  right: 0;
  left: calc(var(--fold-right-start) + var(--crease));
  z-index: 18;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  pointer-events: none;
}

.book-pager__corner {
  pointer-events: auto;
  padding: 0.6rem 0.9rem calc(env(safe-area-inset-bottom) + 0.6rem);
  color: #ccc;
  font-size: 0.85rem;
  text-decoration: none;
  background: rgba(29, 35, 42, 0.92);
}

/* The next page's corner is turned up a little, like a dog-ear, as a hint to turn it */
.book-pager__corner--next {
  margin-left: auto;
  padding-right: max(1.6rem, env(safe-area-inset-right));
  border-top-left-radius: 0.5rem;
  background: linear-gradient(225deg, transparent 0.65rem, #5a616b 0.65rem, #3a3f47 1.3rem, rgba(29, 35, 42, 0.92) 1.3rem);
}

.book-pager__corner--prev {
  border-top-right-radius: 0.5rem;
}

.book-pager__corner:hover,
.book-pager__corner:focus-visible {
  color: #7cfc00;
}
</style>
