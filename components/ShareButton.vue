<template>
  <span class="share">
    <button type="button" class="share__button" :aria-label="`Share: ${title}`" @click.stop="share">
      <span aria-hidden="true">{{ result === 'copied' ? '✓ Link copied' : result === 'failed' ? 'Copy failed' : '↗ Share' }}</span>
    </button>
    <!-- Says what happened, for screen readers -->
    <span class="visually-hidden" role="status">{{ message }}</span>
  </span>
</template>

<script setup>
import { shareLink } from '~/utils/share.js'

const props = defineProps({
  // The page to share, on this site (e.g. /blog/hello-world)
  path: { type: String, required: true },
  // What it is, for the share sheet and the button's label
  title: { type: String, required: true }
})

const result = ref('')
const message = computed(() => ({ copied: 'Link copied', failed: "Couldn't copy the link" })[result.value] ?? '')
let timer = null

const share = async () => {
  clearTimeout(timer)
  result.value = await shareLink({ title: props.title, url: new URL(props.path, window.location.origin).href })
  timer = setTimeout(() => (result.value = ''), 2500)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<style scoped>
.share__button {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  min-width: 24px;
  padding: 0 0.5rem;
  border: 1px solid #475569;
  border-radius: 999px;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
}

.share__button:hover,
.share__button:focus-visible {
  border-color: #94a3b8;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
