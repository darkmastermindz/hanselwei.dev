<template>
  <!-- Searched for you, in the page: a pointer types the question into a search box and
       presses Search, then the results show right here. With config.toml [lucky] search_engine_id
       they're Google's own (its Programmable Search Element, the official way to put Google results
       in a page); without one, a link to the same search on Google. -->
  <section class="let-me-search material rounded-2xl" aria-label="Let me search that for you">
    <p class="let-me-search__step" aria-live="polite">{{ caption }}</p>
    <div class="let-me-search__bar">
      <span class="let-me-search__box" :class="{ 'let-me-search__box--on': stage === 'typing' }">
        <span aria-hidden="true">🔎</span>
        <span class="let-me-search__typed">{{ typed }}<span v-if="stage === 'typing'" class="let-me-search__caret" aria-hidden="true" /></span>
      </span>
      <span class="let-me-search__go" :class="{ 'let-me-search__go--pressed': stage === 'pressing' }" aria-hidden="true">Search</span>
      <span v-if="stage !== 'done'" class="let-me-search__pointer" :class="`let-me-search__pointer--${stage}`" aria-hidden="true">👆</span>
    </div>

    <template v-if="stage === 'done'">
      <blockquote class="let-me-search__found">
        <p><span v-if="item.emoji" aria-hidden="true">{{ item.emoji }} </span><strong v-if="item.term">{{ item.term }}: </strong>{{ item.text }}</p>
        <footer v-if="item.author">— {{ item.author }}</footer>
        <footer v-else-if="item.label">From the home page, on {{ item.label }}</footer>
        <footer v-else>From the site's list of definitions</footer>
      </blockquote>
      <div v-if="searchEngineId" ref="results" class="let-me-search__results" />
      <a class="let-me-search__google" :href="googleSearchUrl(item.query)" target="_blank" rel="noopener">
        See “{{ item.query }}” on Google ↗
      </a>
    </template>
    <button v-else type="button" class="let-me-search__skip" @click="skip">Skip to the answer</button>
  </section>
</template>

<script setup>
import { googleSearchUrl } from '~/utils/lucky.mjs'

// item: a fact or a definition from utils/lucky.mjs's pool ({ text, query, ... })
const props = defineProps({ item: { type: Object, required: true } })

const { searchEngineId } = useRuntimeConfig().public
const stage = ref('moving') // moving → typing → pressing → done
const typed = ref('')
const results = ref(null)
let timers = []

const caption = computed(
  () =>
    ({
      moving: 'Step 1: Click the search box',
      typing: 'Step 2: Type your question',
      pressing: 'Step 3: Click Search',
      done: 'Was that so hard? 😉'
    })[stage.value]
)

const later = (ms, fn) => timers.push(setTimeout(fn, ms))
const clear = () => {
  timers.forEach(clearTimeout)
  timers = []
}

const play = () => {
  clear()
  stage.value = 'moving'
  typed.value = ''
  const query = props.item.query
  const perLetter = Math.max(25, Math.min(70, 2400 / query.length))
  later(900, () => (stage.value = 'typing'))
  for (let i = 1; i <= query.length; i++) later(900 + i * perLetter, () => (typed.value = query.slice(0, i)))
  const typedBy = 900 + query.length * perLetter
  later(typedBy + 500, () => (stage.value = 'pressing'))
  later(typedBy + 1200, show)
}

const skip = () => {
  clear()
  typed.value = props.item.query
  show()
}

const show = async () => {
  stage.value = 'done'
  if (!searchEngineId) return
  await nextTick()
  searchInPage(props.item.query)
}

// Google's Programmable Search Element, rendered on demand (parsetags: explicit) into the results
// box, then asked for this query. Loaded once; later searches reuse it.
const GNAME = 'lucky'
let loading = null
const loadSearch = () => {
  if (window.google?.search?.cse?.element) return Promise.resolve()
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    window.__gcse = { parsetags: 'explicit', initializationCallback: resolve }
    const script = document.createElement('script')
    script.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(searchEngineId)}`
    script.async = true
    script.onerror = reject
    document.head.append(script)
  }).catch(() => {
    loading = null // the link to Google below still works
  })
  return loading
}

const searchInPage = async query => {
  await loadSearch()
  const cse = window.google?.search?.cse?.element
  if (!cse || !results.value) return
  if (!cse.getElement(GNAME)) {
    cse.render({ div: results.value, tag: 'searchresults-only', gname: GNAME, attributes: { linkTarget: '_blank' } })
  }
  cse.getElement(GNAME)?.execute(query)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) skip()
  else play()
})
watch(() => props.item, () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? skip() : play()))
onBeforeUnmount(clear)
</script>

<style scoped>
.let-me-search {
  margin-top: 1.5rem;
  padding: 1.25rem;
  color: #eee;
}

.let-me-search__step {
  margin: 0 0 0.75rem;
  font-family: "Nova Mono", monospace;
}

.let-me-search__bar {
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.let-me-search__box {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.4rem 1rem;
  border: 1px solid #5f6368;
  border-radius: 9999px;
  background: #fff;
  color: #202124;
  overflow: hidden;
}

.let-me-search__box--on {
  border-color: #c084fc;
  box-shadow: 0 0 0 2px rgb(192 132 252 / 0.5);
}

.let-me-search__typed {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.let-me-search__caret {
  display: inline-block;
  width: 1px;
  height: 1.1em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: #202124;
  animation: caret 1s steps(1) infinite;
}

@keyframes caret {
  50% { opacity: 0; }
}

.let-me-search__go {
  padding: 0.55rem 1rem;
  border-radius: 0.5rem;
  background: #3c4043;
  color: #eee;
  transition: transform 0.1s;
}

.let-me-search__go--pressed {
  transform: scale(0.92);
  background: #653496;
}

/* The pointer: in from the corner to the box, then over to Search */
.let-me-search__pointer {
  position: absolute;
  top: 1.6rem;
  left: 90%;
  font-size: 1.6rem;
  pointer-events: none;
  transition: left 0.8s var(--spring-smooth, ease), top 0.8s var(--spring-smooth, ease);
}

.let-me-search__pointer--moving {
  animation: pointer-in 0.85s var(--spring-smooth, ease) both;
}

.let-me-search__pointer--typing {
  left: 30%;
}

.let-me-search__pointer--pressing {
  left: calc(100% - 3rem);
}

@keyframes pointer-in {
  from { left: 90%; top: 4rem; }
  to { left: 30%; top: 1.6rem; }
}

.let-me-search__found {
  margin: 1rem 0 0;
  padding-left: 0.75rem;
  border-left: 3px solid #7cfc00;
}

.let-me-search__found footer {
  margin-top: 0.25rem;
  color: #bbb;
  font-size: 0.9rem;
}

.let-me-search__results {
  margin-top: 1rem;
  color: #202124; /* Google's results draw on their own light background */
}

.let-me-search__google,
.let-me-search__skip {
  display: inline-block;
  margin-top: 1rem;
  color: #c084fc;
  text-decoration: underline;
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .let-me-search__pointer {
    display: none;
  }
}
</style>
