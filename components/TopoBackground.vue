<template>
  <svg
    v-if="settings.enabled"
    class="topo"
    :viewBox="topo ? `0 0 ${topo.width} ${topo.height}` : undefined"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="topo">
      <defs>
        <linearGradient id="topo-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" :x2="topo.width" :y2="topo.height">
          <stop offset="0" stop-color="#c084fc" />
          <stop offset="1" stop-color="#41b883" />
        </linearGradient>
      </defs>
      <path
        v-for="(line, i) in topo.levels"
        :key="i"
        :d="line.d"
        :class="['topo__line', { 'topo__line--index': line.index }]"
        :style="{
          strokeDasharray: `${line.length} ${line.length}`,
          strokeDashoffset: `${line.length * (1 - levelProgress(drawn, i, topo.levels.length))}`
        }"
      />
      <path
        v-for="(trail, i) in topo.trails"
        :key="`trail-${i}`"
        :d="trail.d"
        class="topo__trail"
        :style="{ opacity: trailOpacity(drawn) }"
      />
    </template>
  </svg>
</template>

<script setup>
import { buildTopo, levelProgress, trailOpacity } from '~/utils/topo.mjs'
// config.toml [background], checked at build time (scripts/build-background.mjs)
import settings from '~/data/background.generated.mjs'

// The lines draw in as the visitor stays: the whole pattern takes this long with the tab visible
const FULL_DRAW_MS = settings.drawSeconds * 1000
const PAINT_EVERY_MS = 100 // the draw is slow, so ten updates a second is plenty
const RESIZE_CHANGE = 0.15 // rebuild only for a real size change, not a mobile browser bar

// Built in the browser at the screen's own size (the server renders an empty svg)
const topo = shallowRef(null)
// 0 = nothing drawn yet, 1 = the whole pattern
const drawn = ref(0)

let progress = 0
let frame = null
let last = 0
let lastPaint = 0
let resizeTimer = null
let idle = null
let worker = null
let drawing = false
let reducedMotion = false

// Show a built pattern, and start the draw-in clock the first time
const show = pattern => {
  topo.value = pattern
  if (drawing) return
  drawing = true
  // Reduced motion, or draw_seconds = 0: show the finished pattern straight away
  if (reducedMotion || FULL_DRAW_MS <= 0) {
    progress = 1
    drawn.value = 1
  } else {
    frame = requestAnimationFrame(tick)
  }
}

// Fallback when a worker can't run: build on the main thread while the browser is idle
const buildHere = size => {
  const run = () => show(buildTopo(size))
  idle = 'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1500 }) : setTimeout(run, 200)
}

// Build in a worker (workers/topo.worker.mjs), so the main thread stays free
const build = () => {
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
    contours: settings.contours,
    featureSize: settings.featureSize,
    indexEvery: settings.indexEvery,
    trails: settings.trails
  }
  try {
    worker ??= new Worker(new URL('../workers/topo.worker.mjs', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => show(data)
    worker.onerror = () => {
      worker?.terminate()
      worker = null
      buildHere(size)
    }
    worker.postMessage(size)
  } catch {
    buildHere(size)
  }
}

const tick = now => {
  if (last && document.visibilityState === 'visible') progress = Math.min(1, progress + (now - last) / FULL_DRAW_MS)
  last = now
  if (progress >= 1 || now - lastPaint >= PAINT_EVERY_MS) {
    drawn.value = progress
    lastPaint = now
  }
  if (progress < 1) frame = requestAnimationFrame(tick)
}

const changedEnough = (before, after) => Math.abs(after - before) / before > RESIZE_CHANGE
const onResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const current = topo.value
    if (!current) return
    if (changedEnough(current.width, window.innerWidth) || changedEnough(current.height, window.innerHeight)) build()
  }, 300)
}

onMounted(() => {
  if (!settings.enabled) return
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  build()
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(resizeTimer)
  if ('cancelIdleCallback' in window) cancelIdleCallback(idle)
  clearTimeout(idle)
  worker?.terminate()
  window.removeEventListener('resize', onResize)
})
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
  stroke: url(#topo-gradient);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.topo__line {
  stroke-width: 0.8;
  stroke-opacity: 0.1;
}

/* Every 5th contour, heavier, as on a topo map */
.topo__line--index {
  stroke-width: 1.5;
  stroke-opacity: 0.22;
}

.topo__trail {
  stroke-width: 1;
  stroke-opacity: 0.18;
  stroke-dasharray: 4 6;
}
</style>
