<template>
  <footer class="site-footer">
    <!-- During an event (config.toml [coin_bubble] footer_code, through its last day) -->
    <p v-if="eventCode" class="site-footer__code">{{ eventCode }}</p>
    <p class="site-footer__line">Designed &amp; created with &lt;3 by Hansel Wei • ©️ 2026 hanselwei.dev</p>
    <p><NuxtLink to="/terms">Terms of Service</NuxtLink> • <NuxtLink to="/credits">Open source software &lt;3</NuxtLink></p>
  </footer>
</template>

<script setup>
import eventSettings from '~/data/coinBubble.generated.mjs'
import { bubbleActive } from '~/utils/coinBubble.mjs'

// In the prerendered page while the event is on at build time; the browser drops it once it's over
const eventCode = ref(bubbleActive(eventSettings) ? eventSettings.footerCode : null)
onMounted(() => {
  if (!bubbleActive(eventSettings)) eventCode.value = null
})
</script>

<style scoped>
.site-footer {
  margin-top: auto; /* the bottom of the screen on short pages (.app-shell is a column) */
  padding: 1.5rem 1rem 1.75rem;
  border-top: 1px solid #3a3d42;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #999;
}

/* One line: the text shrinks a little on phones instead of wrapping. Only the smallest screens
   (under 340px), where it would be too small to read, let it wrap. */
.site-footer__line {
  font-size: clamp(0.6rem, calc((100vw - 2rem) / 34), 0.8rem); /* the line is about 34 font-sizes wide */
}

@media (min-width: 340px) {
  .site-footer__line {
    white-space: nowrap;
  }
}

.site-footer__code {
  font-family: 'Nova Mono', monospace;
  letter-spacing: 0.15em;
  color: #7cfc00;
}

.site-footer a {
  color: #c084fc;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.site-footer a:hover {
  color: #7cfc00;
}
</style>
