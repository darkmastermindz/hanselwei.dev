<template>
  <!-- Plain display text with its glossary terms marked (the first use of each, utils/glossary.js) -->
  <template v-for="(part, i) in parts" :key="i"><Term v-if="part.id" :id="part.id">{{ part.text }}</Term><template v-else>{{ part.text }}</template></template>
</template>

<script setup>
import { findTerms } from '~/utils/glossary.js'

const props = defineProps({ text: { type: String, default: '' } })
const parts = computed(() => findTerms(props.text))
</script>
