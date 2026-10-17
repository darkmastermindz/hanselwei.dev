<template>
  <section class="about-card">
    <div class="about-card__tabs" role="tablist" aria-label="About Hansel">
      <button
        v-for="tab in tabs"
        :id="`about-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        class="about-card__tab"
        :class="{ 'is-active': view === tab.id }"
        :aria-selected="view === tab.id"
        :aria-controls="`about-panel-${tab.id}`"
        @click="view = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      :id="`about-panel-${view}`"
      class="about-card__panel"
      role="tabpanel"
      :aria-labelledby="`about-tab-${view}`"
      aria-live="polite"
    >
      <Transition name="swap" mode="out-in">
        <figure v-if="view === 'fact' && fact" :key="fact.id" class="fact">
          <figcaption class="fact__label">
            <span class="fact__emoji">{{ fact.emoji }}</span>
            {{ fact.label }} · {{ fact.type === 'quote' ? 'Motivation' : 'Fun fact' }}
          </figcaption>
          <blockquote v-if="fact.type === 'quote'">
            “{{ fact.text }}”
            <cite>— {{ fact.author }}</cite>
          </blockquote>
          <p v-else>{{ fact.text }}</p>
        </figure>
        <p v-else-if="view === 'fact'" key="fact-empty" class="fact__empty">
          Spin the token above to reveal a fun fact or a bit of motivation ✨
        </p>
        <p v-else-if="view === 'skills'" key="skills" class="json json--skills">
          { "I am a" : [ "Senior Software Developer", "Full Stack Engineer",
          "Secured Infrastructure Professional", "Data Scientist", "Developer Experience Advocate",
          "Emerging Tech Fanatic!", "✨" ] }
        </p>
        <p v-else key="hobbies" class="json json--hobbies">
          { "My hobbies include" : [ "Hiking", "Photography", "Watching Anime", "Coffee", "Board Games",
          "Rock Climbing", "Yoga", "Running", "Community Building", "Maker", "🧗🏻‍♂️" ] }
        </p>
      </Transition>
    </div>
  </section>
</template>

<script setup>
// One card under the contact button: the token's latest fact, or the "I am a"
// (skills) and hobbies JSON, switched with the toggle on top.
const props = defineProps({
  fact: { type: Object, default: null },
  // Bumped by the parent whenever the token reveals a new fact
  revealCount: { type: Number, default: 0 }
})

const tabs = [
  { id: 'fact', label: '✨ Fact' },
  { id: 'skills', label: '🧑‍💻 Skills' },
  { id: 'hobbies', label: '🧗 Hobbies' }
]
const view = ref('skills')

// A new spin brings the fact to the front
watch(() => props.revealCount, () => (view.value = 'fact'))
</script>

<style scoped>
.about-card {
  max-width: 40rem;
  margin: 1.75rem auto 2.25rem;
  padding: 0.9rem 1.1rem 1.1rem;
  border-radius: 0.9rem;
  background: #23262a;
  border: 1px solid #653496;
  box-shadow: 4px 4px #7cfc00;
  text-align: left;
  color: #eee;
}

@media (max-width: 480px) {
  .about-card {
    margin-left: 1rem;
    margin-right: 1rem;
  }
}

.about-card__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.about-card__tab {
  padding: 0.3rem 0.85rem;
  min-height: 36px;
  border-radius: 9999px;
  border: 1px solid #653496;
  color: #ccc;
  font-size: 0.85rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.about-card__tab.is-active {
  background: #653496;
  border-color: #c084fc;
  color: #fff;
}

.about-card__tab:focus-visible {
  outline: 2px dashed #7cfc00;
  outline-offset: 2px;
}

.about-card__panel {
  min-height: 4.5rem;
}

.fact__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9dff5c;
  margin-bottom: 0.35rem;
}

.fact__emoji {
  font-size: 1rem;
  margin-right: 0.15rem;
}

blockquote {
  font-style: italic;
}

cite {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  font-style: normal;
  color: #c084fc;
}

.fact__empty {
  color: #aaa;
}

.json {
  font-family: 'Nova Mono', monospace;
  font-size: clamp(0.9rem, 3.4vw, 1.05rem);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.json--skills {
  color: #bbf7d0;
}

.json--hobbies {
  color: #d8b4fe;
}

.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .swap-enter-active,
  .swap-leave-active {
    transition: opacity 0.15s ease;
  }
  .swap-enter-from,
  .swap-leave-to {
    transform: none;
  }
}
</style>
