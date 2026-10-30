<template>
  <!-- Live kudos (composables/useKudos.js): the count is in the label, not read out on every
       refresh. Presses stop here, so a tap never also counts as a tap on a card around it. -->
  <button
    v-if="kudos.available.value"
    type="button"
    :class="['kudos', { 'kudos--given': given }]"
    :aria-label="given ? `Kudos given: ${name}, ${count} in all` : `Give kudos: ${name}, ${count} so far`"
    :aria-disabled="given ? 'true' : undefined"
    @click.stop="kudos.give(id)"
    @pointerdown.stop
    @pointerup.stop
    @keydown.stop
  >
    <span aria-hidden="true">👏 {{ count }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  // The kudos id: `post-<slug>`
  id: { type: String, required: true },
  // What the kudos is for, in the button's label
  name: { type: String, required: true }
})

const kudos = useKudos()
const given = computed(() => kudos.hasGiven(props.id))
const count = computed(() => kudos.counts.value[props.id] ?? 0)
</script>

<style scoped>
.kudos {
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

.kudos:hover,
.kudos:focus-visible {
  border-color: #94a3b8;
}

.kudos--given {
  border-color: #22c55e;
  cursor: default;
}
</style>
