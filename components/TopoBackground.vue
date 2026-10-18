<template>
  <svg
    class="topo"
    :viewBox="`0 0 ${TOPO_WIDTH} ${TOPO_HEIGHT}`"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(line, i) in TOPO_PATHS"
      :key="i"
      :d="line.d"
      :class="i % 2 ? 'topo__line--green' : 'topo__line--purple'"
      :style="{
        strokeDasharray: `${line.length} ${line.length}`,
        strokeDashoffset: `${line.length * (1 - levelProgress(drawn, i))}`
      }"
    />
  </svg>
</template>

<script setup>
import { levelProgress, TOPO_HEIGHT, TOPO_PATHS, TOPO_WIDTH } from '~/utils/topo.mjs'

// The lines draw in as the visitor stays: the whole pattern takes this long with the tab visible
const FULL_DRAW_MS = 90 * 1000

// 0 = nothing drawn yet, 1 = the whole pattern
const drawn = ref(0)
let frame = null
let last = 0

const tick = now => {
  if (last && document.visibilityState === 'visible') {
    drawn.value = Math.min(1, drawn.value + (now - last) / FULL_DRAW_MS)
  }
  last = now
  if (drawn.value < 1) frame = requestAnimationFrame(tick)
}

onMounted(() => {
  // Reduced motion: show the finished pattern straight away
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawn.value = 1
    return
  }
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<style scoped>
/* Behind the page content (the layout's root has no stacking context, so -1 sits above
   the page background and below everything else). Decorative only. */
.topo {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.topo path {
  fill: none;
  stroke-width: 1.4;
}

.topo__line--purple {
  stroke: rgba(192, 132, 252, 0.16);
}

.topo__line--green {
  stroke: rgba(65, 184, 131, 0.14);
}
</style>
