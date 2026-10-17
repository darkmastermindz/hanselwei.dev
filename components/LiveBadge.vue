<template>
  <span :class="['badge badge-sm align-middle', live ? 'badge-success' : 'badge-ghost']" :title="title">
    {{ live ? '● live' : '○ cached' }}
  </span>
</template>

<script setup>
const props = defineProps({ live: { type: Boolean, default: false } })
const title = computed(() =>
  props.live ? 'Loaded from the Netlify function' : 'Showing the copy bundled with the site'
)
</script>
