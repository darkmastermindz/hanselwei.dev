<template>
  <!-- Only on an iPad held sideways (<html data-device="ipad">, utils/foldMode.mjs): reads the
       site as a book, like a foldable folded down the middle (README "Foldables") -->
  <button
    type="button"
    class="book-toggle btn btn-ghost btn-sm md:btn-md normal-case dim"
    aria-label="Book layout"
    :aria-pressed="on ? 'true' : 'false'"
    @click="toggle"
  >
    <span aria-hidden="true">📖</span>
  </button>
</template>

<script setup>
const KEY = 'book:chosen'
const on = ref(false)

onMounted(() => {
  on.value = document.documentElement.hasAttribute('data-book-chosen')
})

// The page head script (utils/foldMode.mjs watchFold) reads the choice and lays the page out
const toggle = () => {
  on.value = !on.value
  document.documentElement.toggleAttribute('data-book-chosen', on.value)
  try {
    if (on.value) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new CustomEvent('bookchange', { detail: on.value }))
}
</script>

<style scoped>
.book-toggle {
  display: none;
}

:root[data-device='ipad'] .book-toggle {
  display: inline-flex;
  margin-left: auto;
}

/* In the book layout the menu is on the left page; the button stays with it */
:root[data-device='ipad'][data-fold='book'] .book-toggle {
  margin-left: 0;
}

.book-toggle[aria-pressed='true'] {
  background-color: rgba(0, 0, 0, 0.25);
}
</style>
