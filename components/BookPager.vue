<template>
  <!-- Only on a foldable in book (<html data-fold="book">): turn to the previous or next chapter
       from the corners of the right page, like a book (utils/pageTurn.mjs) -->
  <!-- Screen readers hear "Previous chapter: Projects" in the "Chapters" landmark, not the
       arrows (they're only drawn) -->
  <nav class="book-pager" aria-label="Chapters">
    <NuxtLink v-if="pages.prev" :to="pages.prev.to" rel="prev" :aria-label="`Previous chapter: ${pages.prev.label}`" class="book-pager__corner book-pager__corner--prev">
      <span aria-hidden="true">‹</span> {{ pages.prev.label }}
    </NuxtLink>
    <NuxtLink
      v-if="pages.next"
      :to="pages.next.to"
      rel="next"
      :aria-label="`Next chapter: ${pages.next.label}`"
      :class="['book-pager__corner book-pager__corner--next', { 'is-hinting': hinting }]"
    >
      {{ pages.next.label }} <span aria-hidden="true">›</span>
    </NuxtLink>
    <!-- The first few times the phone is folded like a book: the corner lifts a little and a note
         says the pages turn (utils/pageTurn.mjs turnHintDue) -->
    <Transition name="hint">
      <p v-if="hinting" class="book-pager__hint" role="status">
        📖 Pages turn like a book: tap the corner, or any link
      </p>
    </Transition>
  </nav>
</template>

<script setup>
import { neighbours, turnHintDue, TURN_HINT_KEY } from '~/utils/pageTurn.mjs'

const route = useRoute()
const pages = computed(() => neighbours(route.path))

const hinting = ref(false)
let hintTimer = 0
const stopHint = () => {
  clearTimeout(hintTimer)
  hinting.value = false
}

// Counted per browser, so it stops after a few times (storage can be off: then it shows each fold)
const timesShown = () => {
  try {
    return Number(localStorage.getItem(TURN_HINT_KEY)) || 0
  } catch {
    return 0
  }
}

const showHint = () => {
  const shown = timesShown()
  if (!turnHintDue(shown) || !pages.value.next) return
  try {
    localStorage.setItem(TURN_HINT_KEY, String(shown + 1))
  } catch {}
  hinting.value = true
  clearTimeout(hintTimer)
  hintTimer = setTimeout(stopHint, 6000)
}

// Shown when the phone is folded into book (the page head script sets data-fold, live)
let watcher = null
let wasBook = false
const onFold = () => {
  const book = document.documentElement.dataset.fold === 'book'
  if (book && !wasBook) showHint()
  if (!book) stopHint()
  wasBook = book
}

onMounted(() => {
  onFold()
  watcher = new MutationObserver(onFold)
  watcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-fold'] })
})
onBeforeUnmount(() => {
  watcher?.disconnect()
  clearTimeout(hintTimer)
})
// Turning a page is the hint taken
watch(() => route.path, stopHint)
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

/* The hint: the corner lifts twice, as if a finger were about to turn it */
.book-pager__corner--next.is-hinting {
  animation: corner-peel 1.6s ease-in-out 0.4s 2;
  transform-origin: right bottom;
}

@keyframes corner-peel {
  0%, 100% { transform: none; }
  40% { transform: perspective(400px) rotateY(-28deg) translateY(-4px); box-shadow: -6px -4px 12px rgba(0, 0, 0, 0.45); }
}

.book-pager__hint {
  position: absolute;
  right: max(1rem, env(safe-area-inset-right));
  bottom: calc(env(safe-area-inset-bottom) + 3rem);
  max-width: 16rem;
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid #653496;
  border-radius: 0.6rem;
  background: #23262a;
  box-shadow: 3px 3px #7cfc00;
  color: #ddd;
  font-size: 0.85rem;
  line-height: 1.35;
}

.hint-enter-active,
.hint-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .book-pager__corner--next.is-hinting {
    animation: none;
  }

  .hint-enter-active,
  .hint-leave-active {
    transition: none;
  }
}

.book-pager__corner:hover,
.book-pager__corner:focus-visible {
  color: #7cfc00;
}
</style>
