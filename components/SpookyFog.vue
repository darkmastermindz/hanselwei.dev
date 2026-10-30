<template>
  <!-- Halloween (config.toml [seasons.spooky]): banks of mist and fog drifting low across the
       background, on every page. Behind the content and never in the way of a tap. -->
  <div v-if="spooky" class="fog" aria-hidden="true">
    <span class="fog__bank fog__bank--far" />
    <span class="fog__bank fog__bank--near" />
    <span class="fog__mist" />
  </div>
</template>

<script setup>
// CSS only: soft gradients sliding sideways, so nothing runs on the main thread. Visitors who
// prefer reduced motion get the fog standing still.
const spooky = useSpooky()
</script>

<style scoped>
/* With the seasonal emoji: over the topographic lines, under everything else */
.fog {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  animation: fog-in 3s ease-out both;
}

/* Each bank is twice the screen's width, its pattern repeating every screen width, so sliding it
   one screen to the side loops without a seam */
.fog__bank {
  position: absolute;
  left: 0;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  will-change: transform;
}

.fog__bank--far {
  bottom: 18%;
  height: 55%;
  opacity: 0.35;
  background-image:
    radial-gradient(ellipse 30% 40% at 20% 60%, rgba(196, 181, 253, 0.55), transparent 70%),
    radial-gradient(ellipse 35% 35% at 65% 45%, rgba(203, 213, 225, 0.5), transparent 70%),
    radial-gradient(ellipse 25% 30% at 90% 70%, rgba(167, 139, 250, 0.45), transparent 70%);
  filter: blur(18px);
  animation: fog-drift 90s linear infinite;
}

.fog__bank--near {
  bottom: -10%;
  height: 50%;
  opacity: 0.6;
  background-image:
    radial-gradient(ellipse 40% 45% at 15% 55%, rgba(226, 232, 240, 0.6), transparent 70%),
    radial-gradient(ellipse 30% 40% at 55% 65%, rgba(249, 115, 22, 0.18), transparent 70%),
    radial-gradient(ellipse 35% 45% at 85% 50%, rgba(226, 232, 240, 0.55), transparent 70%);
  filter: blur(24px);
  animation: fog-drift 55s linear infinite reverse;
}

/* A low haze over the whole screen that slowly breathes */
.fog__mist {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(148, 163, 184, 0.22), rgba(124, 58, 237, 0.06) 45%, transparent 70%);
  animation: fog-breathe 12s ease-in-out infinite alternate;
}

@keyframes fog-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fog-drift {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes fog-breathe {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .fog,
  .fog__bank,
  .fog__mist {
    animation: none;
  }
}
</style>
