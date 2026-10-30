<template>
  <!-- The one definition bubble for every glossary term on the page (README "Glossary terms"):
       <Term> in Vue text and the <abbr data-term> in rendered markdown alike. Opens on hover, on
       focus and on tap; stays while the pointer is on it; Escape, a tap elsewhere or scrolling
       closes it (WCAG 1.4.13). A tap on the bubble itself dismisses it too, as its hint says, and
       a dismissal goes "poof". -->
  <div
    v-if="entry"
    ref="tipEl"
    class="term-tip"
    :class="{ 'term-tip--poof': poofing }"
    tabindex="-1"
    role="dialog"
    :aria-label="`${entry.term}: what it means`"
    :style="position"
    @pointerenter="cancelClose"
    @pointerleave="scheduleClose"
  >
    <p class="term-tip__term">{{ entry.term }}</p>
    <p class="term-tip__short">{{ entry.short }}</p>
    <a
      v-if="link"
      ref="linkEl"
      class="term-tip__link"
      :href="link.href"
      v-bind="link.external ? { target: '_blank', rel: 'noopener' } : {}"
    >{{ link.external ? 'Source ↗' : 'More →' }}</a>
    <p class="term-tip__hint" aria-hidden="true">
      <span class="term-tip__hint--touch">Tap to dismiss</span><span class="term-tip__hint--mouse">Click to dismiss</span>
    </p>
    <!-- The poof: little puffs of smoke flying out as it goes -->
    <template v-if="poofing">
      <span v-for="n in 8" :key="n" class="term-tip__puff" :style="{ '--puff-angle': `${n * 45}deg` }" aria-hidden="true" />
    </template>
  </div>
</template>

<script setup>
import { glossaryEntry } from '~/data/glossary.js'
import { safeUrl } from '~/utils/safeUrl.js'

const MARGIN = 16 // keep the bubble this far from the screen's edges
const OPEN_DELAY = 120
const CLOSE_DELAY = 250

const termEl = shallowRef(null)
const tipEl = ref(null)
const linkEl = ref(null)
const pinned = ref(false) // opened by a tap, a click or a key: stays until dismissed
const poofing = ref(false) // going away in a puff of smoke (then close())
const POOF_MS = 320
const position = ref({ left: '0px', top: '0px', visibility: 'hidden' })
const entry = computed(() => glossaryEntry(termEl.value?.dataset.term))
const link = computed(() => {
  const href = safeUrl(entry.value?.href)
  return href ? { href, external: /^https?:/i.test(href) } : null
})

let openTimer = 0
let closeTimer = 0
let poofTimer = 0
let quietFocus = null
const termOf = target => target?.closest?.('[data-term]') ?? null
const inTip = target => Boolean(target && tipEl.value?.contains(target))

const place = async () => {
  await nextTick()
  const term = termEl.value
  const tip = tipEl.value
  if (!term || !tip) return
  const r = term.getBoundingClientRect()
  const { width, height } = tip.getBoundingClientRect()
  const below = r.bottom + 8
  const top = below + height + MARGIN <= innerHeight ? below : Math.max(MARGIN, r.top - 8 - height)
  const left = Math.min(Math.max(MARGIN, r.left + r.width / 2 - width / 2), innerWidth - width - MARGIN)
  position.value = { left: `${left}px`, top: `${top}px`, visibility: 'visible' }
}

const open = (el, { pin = false, focusLink = false } = {}) => {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  clearTimeout(poofTimer)
  poofing.value = false
  if (!glossaryEntry(el?.dataset.term)) return
  termEl.value?.removeAttribute('data-open')
  termEl.value = el
  pinned.value = pin || (pinned.value && termEl.value === el)
  el.setAttribute('data-open', '')
  position.value = { ...position.value, visibility: 'hidden' }
  place().then(() => focusLink && linkEl.value?.focus())
}

const close = ({ refocus = false } = {}) => {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  clearTimeout(poofTimer)
  poofing.value = false
  const el = termEl.value
  el?.removeAttribute('data-open')
  termEl.value = null
  pinned.value = false
  if (refocus && el) {
    // Back on the term after Escape: that focus mustn't open it again
    quietFocus = el
    el.focus()
  }
}

// Dismissed on purpose (a tap or a click, Escape): poof, then gone. With reduced motion the
// puffs are left out and it just fades.
const poof = (options = {}) => {
  if (!termEl.value || poofing.value) return
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  poofing.value = true
  poofTimer = setTimeout(() => close(options), POOF_MS)
}

const cancelClose = () => clearTimeout(closeTimer)
const scheduleClose = () => {
  if (pinned.value) return
  clearTimeout(closeTimer)
  closeTimer = setTimeout(close, CLOSE_DELAY)
}

// Captured, so terms can stop their taps from reaching what's around them (the About card)
const onPointerOver = event => {
  if (event.pointerType !== 'mouse') return
  const el = termOf(event.target)
  if (el) {
    clearTimeout(closeTimer)
    if (el !== termEl.value) {
      clearTimeout(openTimer)
      openTimer = setTimeout(() => open(el), OPEN_DELAY)
    }
  }
}
const onPointerOut = event => {
  if (event.pointerType !== 'mouse' || !termOf(event.target)) return
  clearTimeout(openTimer)
  if (!inTip(event.relatedTarget) && termOf(event.relatedTarget) !== termEl.value) scheduleClose()
}
const onClick = event => {
  const el = termOf(event.target)
  if (el) {
    if (el === termEl.value && pinned.value) poof()
    else open(el, { pin: true })
  } else if (inTip(event.target)) {
    // On the bubble, anywhere but its link: dismissed
    if (!event.target.closest('a')) poof()
  } else if (termEl.value) {
    poof()
  }
}
const onFocusIn = event => {
  const el = termOf(event.target)
  const quiet = el && el === quietFocus
  quietFocus = null
  if (el && !quiet && el !== termEl.value) open(el)
}
const onFocusOut = event => {
  const next = event.relatedTarget
  if (termEl.value && !inTip(next) && termOf(next) !== termEl.value) poof()
}
const onKeyDown = event => {
  if (event.key === 'Escape' && termEl.value) {
    poof({ refocus: true })
    return
  }
  const el = termOf(event.target)
  if (el && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault() // Space would scroll the page
    open(el, { pin: true, focusLink: true })
  }
}
const onScroll = () => {
  if (termEl.value) close()
}

const listeners = [
  ['pointerover', onPointerOver],
  ['pointerout', onPointerOut],
  ['click', onClick],
  ['focusin', onFocusIn],
  ['focusout', onFocusOut],
  ['keydown', onKeyDown]
]
onMounted(() => {
  for (const [type, fn] of listeners) document.addEventListener(type, fn, true)
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  for (const [type, fn] of listeners) document.removeEventListener(type, fn, true)
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  clearTimeout(poofTimer)
})

// A new page: nothing stays open
const route = useRoute()
watch(() => route.fullPath, () => close())
</script>

<style>
/* The terms themselves, in Vue text and in rendered markdown */
.term {
  text-decoration: underline dotted;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  cursor: help;
  border-radius: 2px;
}

.term:focus-visible {
  outline: 2px solid #9dff5c;
  outline-offset: 2px;
}

.term[data-open] {
  text-decoration-style: solid;
}
</style>

<style scoped>
.term-tip {
  position: fixed;
  z-index: 200;
  width: max-content;
  max-width: min(20rem, calc(100vw - 32px));
  padding: 0.6rem 0.8rem;
  background: #1d232a;
  color: #eee;
  border: 1px solid #9dff5c;
  border-radius: 0.5rem;
  box-shadow: 4px 4px #1d5c3f;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: left;
  white-space: normal;
}

.term-tip__term {
  font-weight: 700;
  color: #9dff5c;
  margin-bottom: 0.2rem;
}

.term-tip__link {
  display: inline-block;
  margin-top: 0.35rem;
  color: #9dff5c;
  text-decoration: underline;
}

/* How to make it go away: "Tap" on touch screens, "Click" with a mouse */
.term-tip__hint {
  margin-top: 0.35rem;
  color: #9a9a9a;
  font-size: 0.72rem;
}

.term-tip__hint--mouse {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .term-tip__hint--touch {
    display: none;
  }

  .term-tip__hint--mouse {
    display: inline;
  }
}

.term-tip {
  cursor: pointer;
}

/* Focusable only so a tap on it keeps focus inside (and doesn't close it before the tap lands) */
.term-tip:focus {
  outline: none;
}

.term-tip__link {
  cursor: revert;
}

/* Poof: the bubble swells, blurs and fades while puffs of smoke fly out */
.term-tip.term-tip--poof {
  pointer-events: none;
  animation: term-tip-poof 0.32s ease-out forwards;
}

@keyframes term-tip-poof {
  to {
    opacity: 0;
    transform: scale(1.12);
    filter: blur(4px);
  }
}

.term-tip__puff {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.1rem;
  height: 1.1rem;
  margin: -0.55rem 0 0 -0.55rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(238 238 238 / 0.9), rgb(157 255 92 / 0.35) 60%, transparent 70%);
  animation: term-tip-puff 0.32s ease-out forwards;
}

@keyframes term-tip-puff {
  from {
    opacity: 0.9;
    transform: rotate(var(--puff-angle)) translateY(0) scale(0.4);
  }
  to {
    opacity: 0;
    transform: rotate(var(--puff-angle)) translateY(-2.6rem) scale(1.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .term-tip.term-tip--poof {
    animation: term-tip-fade 0.2s ease-out forwards;
  }

  .term-tip__puff {
    display: none;
  }
}

@keyframes term-tip-fade {
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .term-tip {
    animation: term-tip-in 0.12s ease-out;
  }
}

@keyframes term-tip-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
}
</style>
