<template>
  <section ref="cardEl" class="about-card">
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
      ref="panelEl"
      class="about-card__panel"
      :class="{ 'is-charging': charging }"
      :style="{ '--hold-ms': `${HOLD_MS}ms` }"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`about-tab-${view}`"
      aria-live="polite"
      title="Tap to switch, press and hold for plain English"
      @click="onTap"
      @keydown.enter.space.exact.prevent="next"
      @keydown.shift.enter.prevent="toggleReadable()"
      @pointerdown="startHold"
      @pointermove="onHoldMove"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @pointerleave="cancelHold"
      @contextmenu.prevent
    >
      <!-- type="transition": the bounce/pulse animations are infinite, so never wait on them -->
      <Transition :name="transitionName" mode="out-in" type="transition" @after-enter="transitionName = 'swap'">
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
        <p v-else-if="view === 'skills'" data-content :key="`skills-${readable}`" :class="['json--skills json-bounce', readable ? 'prose-line' : 'json']">
          <template v-if="readable">I'm a {{ sentence(skills) }}. ✨</template>
          <template v-else>{ "I am a" : [ {{ quoted([...skills, '✨']) }} ] }</template>
        </p>
        <p
          v-else-if="view === 'hobbies'"
          data-content
          :key="`hobbies-${readable}`"
          :class="['json--hobbies motion-safe:animate-pulse', readable ? 'prose-line' : 'json']"
        >
          <template v-if="readable">My hobbies include {{ sentence(hobbies.map(h => h.toLowerCase())) }}. 🧗🏻‍♂️</template>
          <template v-else>{ "My hobbies include" : [ {{ quoted([...hobbies, '🧗🏻‍♂️']) }} ] }</template>
        </p>
        <ul v-else-if="readable" key="edu-readable" data-content class="json--edu prose-line edu-list">
          <li v-for="entry in education" :key="entry.program"><strong>{{ entry.graduated }}</strong> · {{ entry.readable }}</li>
        </ul>
        <p v-else key="edu" data-content class="json json--edu">
          { "Education" : [
          <span
            v-for="(line, i) in educationJson"
            :key="i"
            :class="['json__line', `json__line--${line.depth}`]"
          >{{ line.text }}</span>
          ] }
        </p>
      </Transition>

      <!-- Fills up while the press is held, so it reads as a deliberate long press -->
      <span class="hold-charge" aria-hidden="true" />

      <!-- The old text falling away, and a sparkle burst where the press happened -->
      <div v-if="falling.length" :class="['poof-words', fallingClass]" aria-hidden="true">
        <span
          v-for="word in falling"
          :key="word.id"
          class="poof-word"
          :style="{ '--dx': `${word.dx}px`, '--rot': `${word.rot}deg`, animationDelay: `${word.delay}ms` }"
        >{{ word.text }}</span>
      </div>
      <span
        v-for="spark in sparkles"
        :key="spark.id"
        class="poof-sparkle"
        :style="{ left: `${spark.x}px`, top: `${spark.y}px`, '--dx': `${spark.dx}px`, '--dy': `${spark.dy}px` }"
        aria-hidden="true"
      >{{ spark.char }}</span>
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
  'Paddleboarding', 'Yoga', 'Running', 'Community Building', 'Maker', 'Stained Glass'
]

// `graduated` is the graduation date; `readable` is the plain-English version
const education = [
  {
    graduated: 2026,
    program: 'Single Pitch Instructor Course',
    school: 'Pisgah Climbing School',
    location: 'Brevard, NC',
    readable: 'Single Pitch Instructor Course at Pisgah Climbing School in Brevard, NC'
  },
  {
    graduated: 2025,
    program: 'YTT200',
    school: 'Chakra Flow University',
    location: 'Charlotte, NC',
    readable: '200-hour Yoga Teacher Training with Chakra Flow University at the Whitewater Center in Charlotte, NC'
  },
  {
    graduated: 2019,
    program: 'Computer Science, BS / Communication Studies Minor',
    school: 'UNC Charlotte',
    location: 'Charlotte, NC',
    readable: 'Bachelor of Science in Computer Science with a minor in Communication Studies from UNC Charlotte in Charlotte, NC'
  }
]

// Valid JSON, one value per line, written out from the fields so quoting and commas are right
const educationJson = education.flatMap((entry, i) => {
  const fields = ['graduated', 'program', 'school', 'location'].map(key => [key, entry[key]])
  const last = i === education.length - 1
  return [
    { depth: 1, text: '{' },
    ...fields.map(([key, value], j) => ({
      depth: 2,
      text: `${JSON.stringify(key)} : ${JSON.stringify(value)}${j < fields.length - 1 ? ',' : ''}`
    })),
    { depth: 1, text: `}${last ? '' : ','}` }
  ]
})

const quoted = items => items.map(i => `"${i}"`).join(', ')
// "a, b and c" (drops a trailing "!" so the sentence can end with a period)
const sentence = items => {
  const words = items.map(i => i.replace(/!$/, ''))
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
}

// Press and hold (or Shift+Enter) flips the JSON views into plain English with a
// "poof": the old words fall away and sparkles burst from the press. Holding again,
// or moving on (tap/tab elsewhere, scroll the card away, leave the page), flips back.
const HOLD_MS = 900
const HOLD_SLOP_PX = 10 // moving further than this (e.g. scrolling) cancels the hold
const TAP_MAX_MS = 300 // a press longer than this that lets go early is an abandoned hold, not a tap
const readable = ref(false)
const charging = ref(false)
const transitionName = ref('swap')
const cardEl = ref(null)
const panelEl = ref(null)
const falling = ref([])
const fallingClass = ref('')
const sparkles = ref([])
let holdTimer = null
let holdOrigin = null
let held = false
let pressStart = 0
let fxId = 0
let fxTimer = null

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const poof = origin => {
  const panel = panelEl.value
  const content = panel?.querySelector('[data-content]')
  if (!content) return
  const box = panel.getBoundingClientRect()
  const x = origin ? origin.x - box.left : box.width / 2
  const y = origin ? origin.y - box.top : box.height / 2

  // Same look as the text being replaced, minus its looping animation
  fallingClass.value = content.className.replace(/json-bounce|motion-safe:animate-pulse/g, '')
  falling.value = content.innerText.split(/\s+/).filter(Boolean).map(text => ({
    id: fxId++,
    text,
    dx: (Math.random() - 0.5) * 70,
    rot: (Math.random() - 0.5) * 80,
    delay: Math.random() * 240
  }))
  sparkles.value = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4
    const distance = 35 + Math.random() * 45
    return { id: fxId++, x, y, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, char: i % 3 ? '✦' : '✨' }
  })
  clearTimeout(fxTimer)
  fxTimer = setTimeout(() => {
    falling.value = []
    sparkles.value = []
  }, 1300)
}

const setReadable = (value, { animate = true, origin } = {}) => {
  if (readable.value === value || view.value === 'fact') return
  const magic = animate && !prefersReducedMotion()
  if (magic) poof(origin)
  transitionName.value = magic ? 'poof' : 'swap'
  readable.value = value
}

const toggleReadable = options => setReadable(!readable.value, options)
const revert = options => setReadable(false, options)

const cancelHold = () => {
  clearTimeout(holdTimer)
  charging.value = false
}

const startHold = event => {
  held = false
  pressStart = performance.now()
  cancelHold()
  if (view.value === 'fact') return
  holdOrigin = { x: event.clientX, y: event.clientY }
  charging.value = true
  holdTimer = setTimeout(() => {
    charging.value = false
    held = true
    toggleReadable({ origin: holdOrigin })
    navigator.vibrate?.(15)
  }, HOLD_MS)
}

const onHoldMove = event => {
  if (!charging.value) return
  const moved = Math.hypot(event.clientX - holdOrigin.x, event.clientY - holdOrigin.y)
  if (moved > HOLD_SLOP_PX) cancelHold()
}

// Back to JSON once attention leaves the card
const onPointerDownAnywhere = event => {
  if (!cardEl.value?.contains(event.target)) revert()
}
const onFocusOut = event => {
  if (event.relatedTarget && !cardEl.value?.contains(event.relatedTarget)) revert()
}
const onVisibility = () => {
  if (document.hidden) revert({ animate: false })
}
let observer = null

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDownAnywhere, true)
  document.addEventListener('visibilitychange', onVisibility)
  cardEl.value?.addEventListener('focusout', onFocusOut)
  // Mostly scrolled out of view counts as moving on
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio < 0.25) revert({ animate: false })
    },
    { threshold: [0, 0.25] }
  )
  if (cardEl.value) observer.observe(cardEl.value)
})

onBeforeUnmount(() => {
  cancelHold()
  clearTimeout(fxTimer)
  document.removeEventListener('pointerdown', onPointerDownAnywhere, true)
  document.removeEventListener('visibilitychange', onVisibility)
  cardEl.value?.removeEventListener('focusout', onFocusOut)
  observer?.disconnect()
})

// Tapping the card cycles through whatever views are available
const next = () => {
  const ids = tabs.value.map(tab => tab.id)
  view.value = ids[(ids.indexOf(view.value) + 1) % ids.length]
}

// A hold (or a hold let go early) also ends in a click; only a quick tap switches views
const onTap = () => {
  if (held) {
    held = false
    return
  }
  if (pressStart && performance.now() - pressStart > TAP_MAX_MS) return
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
  position: relative;
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

/* One value per line, indented inside the array and each object */
.json__line {
  display: block;
  padding-left: 1.25rem;
}

.json__line--2 {
  padding-left: 2.5rem;
}

/* Long-press charge: a glowing bar fills under the text for the length of the hold */
.hold-charge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.45rem;
  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(90deg, #653496, #c084fc, #7cfc00);
  transform: scaleX(0);
  transform-origin: left;
  opacity: 0;
  pointer-events: none;
}

.is-charging .hold-charge {
  opacity: 1;
  transform: scaleX(1);
  box-shadow: 0 0 8px #c084fc;
  transition: transform var(--hold-ms) linear, opacity 0.15s ease;
}

.is-charging [data-content] {
  filter: drop-shadow(0 0 6px rgba(192, 132, 252, 0.7));
  transition: filter var(--hold-ms) ease-in;
}

/* Plain-English swap: the old words tumble away while the new text materialises */
.poof-words {
  position: absolute;
  inset: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  column-gap: 0.4em;
  pointer-events: none;
}

.poof-word {
  display: inline-block;
  animation: word-fall 0.95s cubic-bezier(0.55, 0, 1, 0.45) both;
}

@keyframes word-fall {
  0% {
    transform: none;
    opacity: 1;
  }
  20% {
    transform: translateY(-6px) rotate(calc(var(--rot) * 0.2));
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), 140px) rotate(var(--rot));
    opacity: 0;
    filter: blur(2px);
  }
}

.poof-sparkle {
  position: absolute;
  pointer-events: none;
  font-size: 0.95rem;
  color: #fde68a;
  text-shadow: 0 0 8px #c084fc;
  animation: sparkle-poof 0.75s ease-out forwards;
}

@keyframes sparkle-poof {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.4);
  }
  to {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.2) rotate(90deg);
  }
}

.poof-enter-active {
  transition: opacity 0.5s ease 0.2s, filter 0.5s ease 0.2s, transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1.2) 0.2s;
}

.poof-enter-from {
  opacity: 0;
  filter: blur(8px);
  transform: scale(0.94);
}

/* The falling copy stands in for the old text, so it leaves instantly */
.poof-leave-active {
  transition: none;
}

.poof-leave-to {
  opacity: 0;
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
