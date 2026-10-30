<template>
  <!-- A glossary term (data/glossary.js, README "Glossary terms"): dotted underline, its
       definition as the screen-reader description, and <TermTip> shows it on hover, focus or tap.
       It keeps its own taps and keys, so a tap on it inside the About card doesn't also switch
       the card. -->
  <template v-if="entry">
    <abbr
      class="term"
      :data-term="id"
      tabindex="0"
      :aria-describedby="descId"
      @click.stop
      @pointerdown.stop
      @keydown.enter.space.stop
    ><slot>{{ entry.term }}</slot></abbr><span :id="descId" hidden>{{ entry.short }}</span>
  </template>
  <slot v-else />
</template>

<script setup>
import { glossaryEntry } from '~/data/glossary.js'

const props = defineProps({ id: { type: String, required: true } })
const entry = computed(() => glossaryEntry(props.id))
const descId = `term-${useId()}`
</script>
