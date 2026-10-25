<template>
  <section id="xp" ref="cardEl" class="about-card" @keydown="onCardKey">
    <div class="about-card__tabs" role="tablist" aria-label="About Hansel" @keydown="onTabsKey">
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

    <!-- Holding does nothing on the fact view, so the tip only says tapping switches categories -->
    <p v-if="view === 'fact'" class="about-card__hint" aria-hidden="true"><span class="hint__touch">tap</span><span class="hint__mouse">click</span> to switch categories</p>
    <p v-else class="about-card__hint" aria-hidden="true">
      <span class="hint__touch">tap</span><span class="hint__mouse">click</span> to switch · <span class="hint__touch">tap and hold</span><span class="hint__mouse">alt-click or hold</span> for {{ readable ? 'JSON' : 'plain English' }}
    </p>
    <!-- In plain English, a link to read it in the visitor's own language (detected from the browser) -->
    <p v-if="readable && translateTo" class="about-card__hint about-card__translate">
      <a
        :href="translateHref"
        target="_blank"
        rel="noopener noreferrer"
        :hreflang="translateTo.code"
        :aria-label="`Translate this into ${translateTo.name} with Google Translate`"
        @click="onTranslate"
      >🌐 Translate to <span :lang="translateTo.code">{{ translateTo.name }}</span> ↗</a>
    </p>
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
      :title="view === 'fact' ? 'Tap to switch categories' : `Tap to switch, tap and hold for ${readable ? 'JSON' : 'plain English'}`"
      @click="onTap"
      @keydown.enter.space.exact.prevent="next()"
      @keydown.shift.enter.prevent="toggleReadable()"
      @pointerdown="startHold"
      @pointermove="onHoldMove"
      @pointerup="endHold"
      @pointercancel="endHold"
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
          :class="['json--hobbies soft-pulse', readable ? 'prose-line' : 'json']"
        >
          <template v-if="readable">My hobbies include {{ sentence(hobbyPhrases) }}. 🧗🏻‍♂️</template>
          <template v-else>{ "My hobbies include" : [ {{ quoted([...hobbies, '🧗🏻‍♂️']) }} ] }</template>
        </p>
        <div v-else key="edu" data-content class="xp-timeline">
          <!-- Presses on the track stay here: they don't start a hold or switch views -->
          <div
            class="xp-track"
            role="slider"
            tabindex="0"
            aria-label="Experience timeline, by year"
            :aria-valuemin="yearMin"
            :aria-valuemax="yearMax"
            :aria-valuenow="xpYear"
            :aria-valuetext="`${xpYear}, ${yearEntries.length} ${yearEntries.length === 1 ? 'entry' : 'entries'}`"
            @pointerdown.stop="startDrag"
            @pointermove="dragTo"
            @pointerup.stop="endDrag"
            @pointercancel.stop="endDrag"
            @click.stop
            @keydown.stop="onTrackKey"
          >
            <span v-for="segment in yearSegments" :key="segment.year" class="xp-year" :style="{ flexGrow: segment.weight }">
              <span class="xp-dot" />
            </span>
            <span class="xp-thumb" :style="{ left: thumbLeft }" aria-hidden="true" />
          </div>
          <p class="xp-timeline__label">{{ xpYear }} · {{ yearEntries.length }} {{ yearEntries.length === 1 ? 'entry' : 'entries' }}</p>
          <!-- The text swaps between JSON and plain English; the year track and label stay above in both -->
          <Transition :name="transitionName" mode="out-in" type="transition">
            <ul v-if="readable" key="edu-readable" class="json--edu prose-line edu-list">
              <!-- The same entries as the JSON for the selected year -->
              <li v-for="(entry, i) in yearEntries" :key="entry.text">
                <span class="xp-entry__icon" aria-hidden="true">{{ CATEGORY_ICON[entry.category] }}</span>
                <span class="xp-entry__count" aria-hidden="true">{{ i + 1 }}/{{ yearEntries.length }}</span>
                <span class="visually-hidden">Entry {{ i + 1 }} of {{ yearEntries.length }}, {{ entry.category }}: </span>
                <strong>{{ entry.label }}</strong> · {{ entry.text }}
                <!-- Live kudos (composables/useKudos.js): the count is in the label, not read out on every refresh -->
                <button
                  v-if="kudos.available.value"
                  type="button"
                  :class="['kudos', { 'kudos--given': kudos.given.value.has(entry.id) }]"
                  :aria-label="kudos.given.value.has(entry.id) ? `Kudos given: ${entry.name}, ${kudos.counts.value[entry.id] ?? 0} in all` : `Give kudos: ${entry.name}, ${kudos.counts.value[entry.id] ?? 0} so far`"
                  :aria-disabled="kudos.given.value.has(entry.id) ? 'true' : undefined"
                  @click.stop="kudos.give(entry.id)"
                  @pointerdown.stop
                  @pointerup.stop
                  @keydown.stop
                >
                  <span aria-hidden="true">👏 {{ kudos.counts.value[entry.id] ?? 0 }}</span>
                </button>
              </li>
            </ul>
            <p v-else key="edu-json" class="json json--edu json--xp soft-pulse">{{ yearJson }}</p>
          </Transition>
        </div>
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
  </section>
</template>

<script setup>
import { safeUrl } from '~/utils/safeUrl.js'
import { languageName, translateTarget, translateUrl } from '~/utils/translate.js'
import { swipeIntent, swipeYears, WHEEL_STEP_PX, wheelDx, wheelDy } from '~/utils/swipe.js'
import { isActionTarget } from '~/utils/actionTarget.js'
import { opensXp } from '~/utils/aboutCard.js'
import { achievements, education, experience, xpId } from '~/data/xp.mjs'
import { useKudos } from '~/composables/useKudos.js'

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
  { id: 'edu', label: '💚 XP' }
])

// Prerender shows Skills; each visit then opens on Skills or Hobbies at random, or on XP
// when linked as /#xp (the Bio page links there)
const view = ref('skills')
const route = useRoute()
onMounted(() => {
  if (opensXp(route.hash)) {
    view.value = 'edu'
    cardEl.value?.scrollIntoView({ block: 'start' })
  } else if (Math.random() < 0.5) view.value = 'hobbies'
})

const skills = [
  'Senior Software Engineer',
  'Full-Stack Engineer',
  'Secure Infrastructure Specialist',
  'Data Scientist',
  'Developer Experience Advocate',
  'Emerging Tech Fanatic!'
]

const hobbies = [
  'Hiking', 'Photography', 'Watching Anime', 'Coffee', 'Board Games', 'Rock Climbing',
  'Paddleboarding', 'Yoga', 'Running', 'Stargazing', 'Community Building', 'Maker', 'Stained Glass'
]
// How a hobby reads in the plain-English sentence, where its label alone would be awkward
// (stained glass is folded into the makerspace phrase, so it's left out on its own)
const hobbyWords = { Maker: 'makerspace things (3D printing, crafting, stained glass)', 'Stained Glass': null }
const hobbyPhrases = hobbies.map(hobby => (hobby in hobbyWords ? hobbyWords[hobby] : hobby.toLowerCase())).filter(Boolean)

// Valid JSON on one line, like the other About views, built from the fields so quoting is right
const jsonValue = value => {
  if (Array.isArray(value)) return `[ ${value.map(jsonValue).join(', ')} ]`
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).filter(([, v]) => v !== undefined).map(([key, v]) => `${JSON.stringify(key)} : ${jsonValue(v)}`).join(', ')} }`
  }
  return JSON.stringify(value)
}
const withoutText = item => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'readable' && key !== 'date'))
// The XP timeline by year: the slider picks a year, and the card shows every entry active in
// that year (education and work history) as minified JSON
const CURRENT_YEAR = new Date().getFullYear()
const yearOf = text => Number(String(text).match(/\d{4}/)?.[0])
// Each entry has its JSON (for the card) and its plain-English line (for holding), so both views
// always show the same things
// One icon per category in the XP data (every category used has an entry)
const CATEGORY_ICON = {
  Certification: '📜',
  Education: '🎓',
  Work: '💼',
  Volunteer: '🤝',
  'Career break': '⏸️',
  Achievement: '🏅'
}

const timeline = [
  ...education.map(entry => {
    const to = yearOf(entry.graduated ?? entry.passed)
    return {
      id: xpId(entry),
      name: entry.program === 'YTT200' ? 'Yoga Teacher Training' : entry.program ?? entry.certification,
      from: entry.started ?? to,
      to,
      label: entry.date,
      category: entry.category,
      text: entry.readable,
      json: `{ "education" : ${jsonValue(withoutText(entry))} }`
    }
  }),
  ...experience.map(job => ({
    id: xpId(job),
    name: job.company ? `${job.role} at ${job.company}` : job.role,
    from: yearOf(job.start),
    to: job.end === 'Present' ? CURRENT_YEAR : yearOf(job.end),
    label: job.start === job.end ? job.start : `${job.start} – ${job.end}`,
    category: job.category,
    text: `${job.role}${job.company ? ` at ${job.company}` : ''}${job.location ? ` (${job.location})` : ''}${job.highlight ? `. ${job.highlight}.` : '.'}`,
    json: `{ "experience" : ${jsonValue(job.highlight ? job : { ...job, highlight: undefined })} }`
  })),
  ...achievements.map(item => ({
    id: xpId(item),
    name: item.event,
    from: yearOf(item.date),
    to: yearOf(item.date),
    label: item.date,
    category: item.category,
    text: item.readable,
    json: `{ "achievement" : ${jsonValue(Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'readable')))} }`
  }))
]
const yearMin = Math.min(...timeline.map(entry => entry.from))
const yearMax = CURRENT_YEAR

const quoted = items => items.map(i => `"${i}"`).join(', ')
// "a, b and c" (drops a trailing "!" so the sentence can end with a period)
const sentence = items => {
  const words = items.map(i => i.replace(/!$/, ''))
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
}

// The slider starts on this year, and goes back to it whenever the card changes view
const xpYear = ref(yearMax)
watch(view, () => (xpYear.value = yearMax))
// The pull-down reset (composables/useHardRefresh.js) starts the token over, and the XP slider with it
const resetAt = useState('token:resetAt', () => 0)
watch(resetAt, () => (xpYear.value = yearMax))
const yearEntries = computed(() => timeline.filter(entry => entry.from <= xpYear.value && xpYear.value <= entry.to))
const yearJson = computed(() => `{ "${xpYear.value}" : [ ${yearEntries.value.map(entry => entry.json).join(', ')} ] }`)

// Each year gets room in proportion to its entries (plus one, so an empty year still has a dot)
const yearSegments = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => {
  const year = yearMin + i
  return { year, weight: 1 + timeline.filter(entry => entry.from <= year && year <= entry.to).length }
})
const totalWeight = yearSegments.reduce((sum, segment) => sum + segment.weight, 0)
let before = 0
for (const segment of yearSegments) {
  segment.centre = ((before + segment.weight / 2) / totalWeight) * 100
  before += segment.weight
}
const thumbLeft = computed(() => `${yearSegments.find(segment => segment.year === xpYear.value)?.centre ?? 0}%`)

const setYear = year => (xpYear.value = Math.min(yearMax, Math.max(yearMin, year)))

// Dragging across the track picks the year under the pointer
let dragging = false
const pickYear = event => {
  const rect = event.currentTarget.getBoundingClientRect()
  const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  let edge = 0
  for (const segment of yearSegments) {
    edge += segment.weight / totalWeight
    if (fraction <= edge) return setYear(segment.year)
  }
}
const startDrag = event => {
  dragging = true
  event.currentTarget.setPointerCapture(event.pointerId)
  pickYear(event)
}
const dragTo = event => {
  if (dragging) pickYear(event)
}
const endDrag = () => (dragging = false)

// Arrow keys step a year, Home and End jump to the ends
const onTrackKey = event => {
  const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key]
  if (step) {
    event.preventDefault()
    setYear(xpYear.value + step)
  } else if (event.key === 'Home') setYear(yearMin)
  else if (event.key === 'End') setYear(yearMax)
  // PageUp / PageDown (a controller's bumpers) step a year too
  else if (event.key === 'PageUp' || event.key === 'PageDown') {
    event.preventDefault()
    setYear(xpYear.value + (event.key === 'PageDown' ? 1 : -1))
  }
}

// The wheel on the XP view moves the years: a sideways wheel (trackpad swipe, tilt wheel,
// Shift+wheel) or the up/down wheel (down = later). It applies while the pointer is over the
// card, or while a keyboard or controller has focus in it; at the first or last year the page
// scrolls on as usual (utils/swipe.js)
let wheelTravel = 0
let wheelTimer = null
const onWheel = event => {
  if (view.value !== 'edu' || event.defaultPrevented || event.ctrlKey) return
  const card = cardEl.value
  const input = document.documentElement.dataset.input
  const focusedHere = (input === 'keyboard' || input === 'gamepad') && card?.contains(document.activeElement)
  if (!card?.contains(event.target) && !focusedHere) return
  const travel = wheelDx(event) || wheelDy(event)
  if (!travel) return
  // Already at the end it's heading for: let the page scroll
  if ((travel > 0 && xpYear.value >= yearMax) || (travel < 0 && xpYear.value <= yearMin)) {
    wheelTravel = 0
    return
  }
  event.preventDefault()
  clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => (wheelTravel = 0), 250)
  wheelTravel += travel
  const steps = Math.trunc(wheelTravel / WHEEL_STEP_PX)
  if (!steps) return
  wheelTravel -= steps * WHEEL_STEP_PX
  setYear(xpYear.value + steps)
  lockSocials() // the entries change height under the pointer
  releaseSocials()
}

// Press and hold (or Shift+Enter) flips the JSON views into plain English with a
// "poof": the old words fall away and sparkles burst from the press. It stays through
// scrolling and taps on the background; holding again, or a real action elsewhere (a link,
// a button, tabbing away, leaving the page), flips back.
const HOLD_MS = 900
const HOLD_SLOP_PX = 10 // moving further than this (e.g. scrolling) cancels the hold
const TAP_MAX_MS = 300 // a press longer than this that lets go early is an abandoned hold, not a tap
const readable = ref(false)
// Kudos on each plain-English XP entry, live while that list is on screen
const kudos = useKudos()
kudos.watchActive(() => view.value === 'edu' && readable.value)
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
  fallingClass.value = content.className.replace(/json-bounce|soft-pulse/g, '')
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

// The plain-English text in the visitor's language, through Google Translate. Only offered
// when the browser's preferred language isn't English.
const translateTo = ref(null)
const translateHref = ref(null)
onMounted(() => {
  const code = translateTarget(navigator.languages?.length ? navigator.languages : navigator.language)
  if (!code) return
  translateTo.value = { code, name: languageName(code) }
  translateHref.value = safeUrl(translateUrl('', code))
})
// The link carries the text on screen, read when it's followed (the text changes with the tab)
const onTranslate = event => {
  const text = panelEl.value?.querySelector('[data-content]')?.innerText
  const href = safeUrl(translateUrl(text, translateTo.value.code))
  if (href) event.currentTarget.href = href
}
const revert = options => setReadable(false, options)

const cancelHold = () => {
  clearTimeout(holdTimer)
  charging.value = false
}

const startHold = event => {
  held = false
  swiping = false
  pressStart = performance.now()
  pressType = event.pointerType
  cancelHold()
  if (view.value === 'fact') return
  holdOrigin = { x: event.clientX, y: event.clientY }
  swipeFrom = view.value === 'edu' ? { year: xpYear.value, decided: false } : null
  charging.value = true
  holdTimer = setTimeout(() => {
    charging.value = false
    held = true
    lockSocials() // the card changes height, so the links below move under the finger
    toggleReadable({ origin: holdOrigin })
    navigator.vibrate?.(15)
  }, HOLD_MS)
}

const onHoldMove = event => {
  if (swipeMove(event) || !charging.value) return
  const moved = Math.hypot(event.clientX - holdOrigin.x, event.clientY - holdOrigin.y)
  if (moved > HOLD_SLOP_PX) cancelHold()
}

// On the XP view, a sideways swipe moves the year slider (utils/swipe.js); up and down still
// scroll the page. Returns true while the press is a swipe.
let swipeFrom = null
let swiping = false
const swipeMove = event => {
  if (!swipeFrom || held) return false
  const dx = event.clientX - holdOrigin.x
  if (!swipeFrom.decided) {
    const intent = swipeIntent(dx, event.clientY - holdOrigin.y)
    if (!intent) return false
    swipeFrom.decided = true
    if (intent === 'scroll') {
      swipeFrom = null
      return false
    }
    swiping = true
    cancelHold()
    lockSocials() // the entries change with the year, so the links below move
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  setYear(swipeFrom.year + swipeYears(dx))
  return true
}
const endSwipe = () => {
  if (swiping) endPause()
  swipeFrom = null
}

const endHold = () => {
  endSwipe()
  cancelHold()
}

// The social links pause from the switch. With a mouse they come back a moment after the press
// ends. On touch they stay paused while the card is in use (no flashing between presses) and
// come back once the visitor moves on: the card scrolled away, a tap elsewhere, or a tap on the
// links themselves (Socials.vue).
const { lockSocials, releaseSocials, unlockSocials } = useSocialsLock()
let pressType = ''
const endPause = () => {
  if (pressType !== 'touch' && pressType !== 'pen') releaseSocials()
}
// Wherever the press ends: lifted off the card, cancelled by a scroll or the system's long-press
const onPressEndAnywhere = () => {
  if (held) endPause()
}

// Back to JSON once the visitor does something else. A click (not a pointerdown) so a scroll
// that starts on a link doesn't count.
const onClickAnywhere = event => {
  if (cardEl.value?.contains(event.target)) return
  if (!event.target?.closest?.('.socials')) unlockSocials()
  if (isActionTarget(event.target)) revert()
}
const onFocusOut = event => {
  if (event.relatedTarget && !cardEl.value?.contains(event.relatedTarget)) revert()
}
const onVisibility = () => {
  if (document.hidden) {
    revert({ animate: false })
    unlockSocials()
  }
}
let observer = null
onMounted(() => {
  document.addEventListener('click', onClickAnywhere, true)
  document.addEventListener('pointerup', onPressEndAnywhere, true)
  document.addEventListener('pointercancel', onPressEndAnywhere, true)
  document.addEventListener('visibilitychange', onVisibility)
  cardEl.value?.addEventListener('focusout', onFocusOut)
  // Scrolling the card mostly out of view counts as moving on: the links come back (the text
  // stays as it is)
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio < 0.25) unlockSocials()
    },
    { threshold: [0, 0.25] }
  )
  if (cardEl.value) observer.observe(cardEl.value)
  // On the document (capture), so it runs before the wheel's focus moves elsewhere on the page
  document.addEventListener('wheel', onWheel, { capture: true, passive: false })
})

onBeforeUnmount(() => {
  cancelHold()
  clearTimeout(fxTimer)
  document.removeEventListener('click', onClickAnywhere, true)
  document.removeEventListener('pointerup', onPressEndAnywhere, true)
  document.removeEventListener('pointercancel', onPressEndAnywhere, true)
  unlockSocials()
  document.removeEventListener('visibilitychange', onVisibility)
  cardEl.value?.removeEventListener('focusout', onFocusOut)
  observer?.disconnect()
  document.removeEventListener('wheel', onWheel, { capture: true })
  clearTimeout(wheelTimer)
})

// Tapping the card cycles through whatever views are available
const next = (step = 1) => {
  const ids = tabs.value.map(tab => tab.id)
  view.value = ids[(ids.indexOf(view.value) + step + ids.length) % ids.length]
}

// Keyboard and controller (plugins/navigation.client.js): Left/Right move between the tabs,
// PageUp/PageDown (the bumpers) switch tabs from anywhere on the card, and Escape takes plain
// English back to JSON before it goes back a page
const onTabsKey = event => {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key]
  if (!step) return
  event.preventDefault()
  next(step)
  nextTick(() => document.getElementById(`about-tab-${view.value}`)?.focus())
}
const onCardKey = event => {
  if (event.defaultPrevented) return
  if (event.key === 'PageUp' || event.key === 'PageDown') {
    event.preventDefault()
    next(event.key === 'PageDown' ? 1 : -1)
  } else if (event.key === 'Escape' && readable.value) {
    event.preventDefault()
    revert()
  }
}

// A hold (or a hold let go early) also ends in a click; only a quick tap switches views.
// On desktop, alt-click flips the text the same way a hold does.
const onTap = event => {
  if (held || swiping) {
    held = false
    swiping = false
    return
  }
  if (event.altKey) {
    lockSocials()
    releaseSocials()
    toggleReadable({ origin: { x: event.clientX, y: event.clientY } })
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
  scroll-margin-top: 1rem; /* /#xp lands with a little room above the card */
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

/* XP: sideways swipes move the year slider (handled in script); vertical still scrolls */
#about-panel-edu {
  touch-action: pan-y;
}

.about-card__panel:focus-visible {
  outline: 2px dashed #7cfc00;
  outline-offset: 4px;
  border-radius: 0.4rem;
}

.about-card__hint {
  margin-bottom: 0.4rem;
  font-size: 0.7rem;
  text-align: right;
  /* #999: 5.3:1 on the card, WCAG AA for small text (#777 was 3.4:1) */
  color: #999;
}

.about-card__translate {
  margin-top: -0.25rem;
}

.about-card__translate a {
  color: #9a9a9a;
  text-decoration: underline;
  text-decoration-color: rgba(192, 132, 252, 0.5);
  text-underline-offset: 2px;
}

.about-card__translate a:hover,
.about-card__translate a:focus-visible {
  color: #c084fc;
}

/* Phones say "tap and hold"; a mouse says "alt-click or hold" */
.hint__mouse {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .hint__touch {
    display: none;
  }

  .hint__mouse {
    display: inline;
  }
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

/* The XP timeline: a year's JSON, with a bold track underneath (a dot per year, wider for busier years) */
.xp-track {
  position: relative;
  display: flex;
  height: 2.6rem;
  margin-top: 0.4rem;
  align-items: center;
  touch-action: none; /* a drag moves the year instead of scrolling the page */
  cursor: pointer;
  user-select: none;
}

.xp-track::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 0.5rem;
  transform: translateY(-50%);
  border-radius: 999px;
  background: linear-gradient(90deg, #c084fc, #41b883);
  opacity: 0.6;
}

.xp-year {
  position: relative;
  flex: 0 0 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.xp-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc, #41b883);
}

.xp-thumb {
  position: absolute;
  top: 50%;
  width: 1.4rem;
  height: 1.4rem;
  border: 3px solid #0f172a;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc, #41b883);
  box-shadow: 0 0 0 2px #c084fc66;
  transform: translate(-50%, -50%);
  /* SwiftUI's .snappy spring: a quick slide to the picked year with a hint of overshoot */
  transition: left var(--spring-snappy-duration) var(--spring-snappy);
  pointer-events: none;
}

.xp-track:focus-visible {
  outline: 2px dashed #7cfc00;
  outline-offset: 4px;
  border-radius: 0.4rem;
}

@media (prefers-reduced-motion: reduce) {
  .xp-thumb {
    transition: none;
  }
}

.xp-entry__icon,
.xp-entry__count {
  margin-right: 0.3rem;
}

.xp-entry__count {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Text for screen readers only (the same rule pages/projects.vue uses) */
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

.xp-timeline__label {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #cbd5e1; /* readable even while the tab fades in (#94a3b8 dipped under 4.5:1) */
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

/* A gentle breathing pulse on the Hobbies and XP text. It only dims to 75%, which stays above
   WCAG AA (5.5:1 at its faintest); Tailwind's animate-pulse dims to 50% (3.3:1) */
@media (prefers-reduced-motion: no-preference) {
  .soft-pulse {
    animation: soft-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

@keyframes soft-pulse {
  50% {
    opacity: 0.75;
  }
}

.json--edu {
  color: #bae6fd;
}

.prose-line {
  font-size: clamp(0.95rem, 3.6vw, 1.1rem);
  line-height: 1.55;
}

.kudos {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  min-width: 24px;
  margin-left: 0.4rem;
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

.edu-list li + li {
  margin-top: 0.45rem;
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
