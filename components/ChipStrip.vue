<template>
  <!-- A row of chips: wraps naturally up to 3 rows on phones and 4 on wider screens, then
       scrolls sideways in balanced rows (utils/chips.js). Each chip comes from the slot, so
       pages keep their own buttons, links and colours. -->
  <div ref="root" class="chip-strip" :class="{ 'is-scroll': layout.mode === 'scroll' }" role="group" :aria-label="label">
    <template v-if="layout.mode === 'scroll'">
      <div v-for="(row, r) in layout.rows" :key="r" class="chip-strip__row">
        <span v-for="i in row" :key="keyOf(items[i], i)" class="chip-strip__item">
          <slot :item="items[i]" :index="i" />
        </span>
      </div>
    </template>
    <template v-else>
      <span v-for="(item, i) in items" :key="keyOf(item, i)" class="chip-strip__item">
        <slot :item="item" :index="i" />
      </span>
    </template>
  </div>
</template>

<script setup>
import { chipRows, maxRowsFor } from '~/utils/chips.js'

const props = defineProps({
  items: { type: Array, required: true },
  // A field of each item, or a function, giving a stable key (defaults to the item itself)
  itemKey: { type: [String, Function], default: null },
  label: { type: String, default: undefined }
})

const keyOf = (item, index) => {
  if (typeof props.itemKey === 'function') return props.itemKey(item)
  if (props.itemKey && item && typeof item === 'object') return item[props.itemKey]
  return typeof item === 'object' ? index : item
}

const root = ref(null)
// The prerendered page wraps; a long list switches to sideways rows once measured
const layout = ref({ mode: 'wrap' })

const measure = () => {
  const el = root.value
  if (!el) return
  const widths = [...el.querySelectorAll('.chip-strip__item')].map(chip => chip.getBoundingClientRect().width)
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0
  const next = chipRows(widths, el.clientWidth, gap, maxRowsFor(window.innerWidth))
  if (JSON.stringify(next) !== JSON.stringify(layout.value)) layout.value = next
}

let frame = 0
const remeasure = () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

let observer = null
onMounted(() => {
  measure()
  observer = new ResizeObserver(remeasure)
  if (root.value) observer.observe(root.value)
})
// New or filtered items: measure again once they are on the page
watch(() => props.items, () => nextTick(remeasure))
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<style scoped>
.chip-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* Too many for the row limit: balanced rows that scroll sideways (not the page) */
.chip-strip.is-scroll {
  flex-direction: column;
  flex-wrap: nowrap;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  padding-bottom: 0.25rem;
}

.chip-strip__row {
  display: flex;
  gap: 0.4rem;
  width: max-content;
}

.chip-strip__item {
  display: inline-flex;
  flex: none;
}
</style>
