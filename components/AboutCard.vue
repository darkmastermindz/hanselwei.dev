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
      tabindex="0"
      :aria-labelledby="`about-tab-${view}`"
      aria-live="polite"
      title="Tap to switch, press and hold for plain English"
      @click="onTap"
      @keydown.enter.space.exact.prevent="next"
      @keydown.shift.enter.prevent="toggleReadable"
      @pointerdown="startHold"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @pointerleave="cancelHold"
      @contextmenu.prevent
    >
      <!-- type="transition": the bounce/pulse animations are infinite, so never wait on them -->
      <Transition name="swap" mode="out-in" type="transition">
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
        <p v-else-if="view === 'skills'" :key="`skills-${readable}`" :class="['json--skills json-bounce', readable ? 'prose-line' : 'json']">
          <template v-if="readable">I'm a {{ sentence(skills) }}. ✨</template>
          <template v-else>{ "I am a" : [ {{ quoted([...skills, '✨']) }} ] }</template>
        </p>
        <p
          v-else-if="view === 'hobbies'"
          :key="`hobbies-${readable}`"
          :class="['json--hobbies motion-safe:animate-pulse', readable ? 'prose-line' : 'json']"
        >
          <template v-if="readable">My hobbies include {{ sentence(hobbies.map(h => h.toLowerCase())) }}. 🧗🏻‍♂️</template>
          <template v-else>{ "My hobbies include" : [ {{ quoted([...hobbies, '🧗🏻‍♂️']) }} ] }</template>
        </p>
        <ul v-else-if="readable" key="edu-readable" class="json--edu prose-line edu-list">
          <li v-for="entry in education" :key="entry.year"><strong>{{ entry.year }}</strong> · {{ entry.readable }}</li>
        </ul>
        <p v-else key="edu" class="json json--edu">
          { "Education" : [
          <span v-for="(entry, i) in education" :key="entry.year" class="json__line">
            "{{ [entry.year, ...entry.parts].join(' · ') }}"{{ i < education.length - 1 ? ',' : '' }}
          </span>
          ] }
        </p>
      </Transition>
    </div>
    <p class="about-card__hint" aria-hidden="true">
      tap to switch · hold for {{ readable ? 'JSON' : 'plain English' }}
    </p>
  </section>
</template>

<script setup>
// One card under the contact button: the token's latest fact, or the "I am a"
// (skills), hobbies and education JSON, switched with the toggle on top.
const props = defineProps({
  fact: { type: Object, default: null },
  // Bumped by the parent whenever the token reveals a new fact
  revealCount: { type: Number, default: 0 }
})

// Skills / Hobbies / Edu, plus Fact once the token has revealed one
const tabs = computed(() => [
  ...(props.fact ? [{ id: 'fact', label: '✨ Fact' }] : []),
  { id: 'skills', label: '🧑‍💻 Skills' },
  { id: 'hobbies', label: '🧗 Hobbies' },
  { id: 'edu', label: '🎓 Edu' }
])

// Prerender shows Skills; each visit then opens on Skills or Hobbies at random
const view = ref('skills')
onMounted(() => {
  if (Math.random() < 0.5) view.value = 'hobbies'
})

const skills = [
  'Senior Software Developer',
  'Full Stack Engineer',
  'Secured Infrastructure Professional',
  'Data Scientist',
  'Developer Experience Advocate',
  'Emerging Tech Fanatic!'
]

const hobbies = [
  'Hiking', 'Photography', 'Watching Anime', 'Coffee', 'Board Games', 'Rock Climbing',
  'Yoga', 'Running', 'Community Building', 'Maker', 'Stained Glass'
]

// `parts` is the JSON line; `readable` is the plain-English version
const education = [
  {
    year: 2026,
    parts: ['Single Pitch Instructor Course', 'Pisgah Climbing School', 'Brevard, NC'],
    readable: 'Single Pitch Instructor Course at Pisgah Climbing School in Brevard, NC'
  },
  {
    year: 2025,
    parts: ['Chakra Flow University', 'YTT200', 'Whitewater Center', 'Charlotte, NC'],
    readable: '200-hour Yoga Teacher Training with Chakra Flow University at the Whitewater Center in Charlotte, NC'
  },
  {
    year: 2019,
    parts: ['UNC Charlotte', 'Computer Science, BS / Communication Studies Minor', 'Charlotte, NC'],
    readable: 'BS in Computer Science with a minor in Communication Studies from UNC Charlotte'
  }
]

const quoted = items => items.map(i => `"${i}"`).join(', ')
// "a, b and c" (drops a trailing "!" so the sentence can end with a period)
const sentence = items => {
  const words = items.map(i => i.replace(/!$/, ''))
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
}

// Press and hold (or Shift+Enter) flips the JSON views into plain English and back
const HOLD_MS = 500
const readable = ref(false)
let holdTimer = null
let held = false

const toggleReadable = () => {
  if (view.value === 'fact') return
  readable.value = !readable.value
}

const startHold = () => {
  held = false
  clearTimeout(holdTimer)
  holdTimer = setTimeout(() => {
    if (view.value === 'fact') return
    held = true
    toggleReadable()
    navigator.vibrate?.(15)
  }, HOLD_MS)
}

const cancelHold = () => clearTimeout(holdTimer)

onBeforeUnmount(cancelHold)

// Tapping the card cycles through whatever views are available
const next = () => {
  const ids = tabs.value.map(tab => tab.id)
  view.value = ids[(ids.indexOf(view.value) + 1) % ids.length]
}

// A hold also ends in a click; don't let it switch views too
const onTap = () => {
  if (held) {
    held = false
    return
  }
  next()
}

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
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none; /* no iOS text menu on press-and-hold */
  user-select: none;
}

.about-card__panel:focus-visible {
  outline: 2px dashed #7cfc00;
  outline-offset: 4px;
  border-radius: 0.4rem;
}

.about-card__hint {
  margin-top: 0.6rem;
  font-size: 0.7rem;
  text-align: right;
  color: #777;
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

.json {
  font-family: 'Nova Mono', monospace;
  font-size: clamp(0.9rem, 3.4vw, 1.05rem);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.json--skills {
  color: #bbf7d0;
}

/* The bounce the skills line had on main, scaled down to stay inside the card */
.json-bounce {
  animation: json-bounce 1s infinite;
}

@keyframes json-bounce {
  0%,
  100% {
    transform: translateY(-6px);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .json-bounce {
    animation: none;
  }
}

.json--hobbies {
  color: #d8b4fe;
}

.json--edu {
  color: #bae6fd;
}

.prose-line {
  font-size: clamp(0.95rem, 3.6vw, 1.1rem);
  line-height: 1.55;
}

.edu-list li + li {
  margin-top: 0.45rem;
}

/* One school per line, indented inside the array */
.json__line {
  display: block;
  padding-left: 1.25rem;
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
