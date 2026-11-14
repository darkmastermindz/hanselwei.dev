<template>
  <div v-if="particles.length" :class="['season', `season--${theme.motion}`]" aria-hidden="true">
    <span
      v-for="p in particles"
      :key="p.id"
      class="season__particle"
      :style="{
        left: `${p.x}%`,
        '--size': `${p.size}rem`,
        '--duration': `${p.duration}s`,
        '--delay': `${p.delay}s`,
        '--sway': `${p.sway}s`,
        '--spin': `${p.spin}deg`
      }"
    ><span class="season__emoji">{{ p.emoji }}</span></span>
  </div>
</template>

<script setup>
// This week's theme (config.toml [seasons]): a few themed emoji drifting down (or floating up)
// over the background on every page, behind the content and never in the way of a tap. Off for
// visitors who prefer reduced motion or are saving data. CSS animations only, so nothing runs
// on the main thread once they're placed.
import { particleLayout } from '~/utils/seasons.mjs'
import { wantsLessData } from '~/utils/background.mjs'
import { seasonParticles } from '~/composables/useSeason.js'

const theme = useSeason()
const particles = ref([])

onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lessData = wantsLessData({
    saveData: navigator.connection?.saveData,
    effectiveType: navigator.connection?.effectiveType,
    reducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches
  })
  if (reducedMotion || lessData) return
  // useSeason picks the theme in its own onMounted, which has run by now
  particles.value = particleLayout(theme.value, seasonParticles)
})
</script>

<style scoped>
/* Over the topographic lines, under everything else (see TopoBackground.vue) */
.season {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.season__particle {
  position: absolute;
  top: 0;
  font-size: var(--size);
  line-height: 1;
  opacity: 0.55;
  will-change: transform;
  animation: season-fall var(--duration) linear var(--delay) infinite;
}

.season--rise .season__particle {
  animation-name: season-rise;
}

.season__emoji {
  display: inline-block;
  animation: season-sway var(--sway) ease-in-out infinite alternate;
}

/* Phones: fewer at once */
@media (max-width: 640px) {
  .season__particle:nth-child(n + 9) {
    display: none;
  }
}

@keyframes season-fall {
  from { transform: translateY(-10vh) rotate(0); }
  to { transform: translateY(110vh) rotate(var(--spin)); }
}

@keyframes season-rise {
  from { transform: translateY(110vh) rotate(0); }
  to { transform: translateY(-10vh) rotate(var(--spin)); }
}

@keyframes season-sway {
  from { transform: translateX(-18px); }
  to { transform: translateX(18px); }
}

@media (prefers-reduced-motion: reduce) {
  .season {
    display: none;
  }
}
</style>
