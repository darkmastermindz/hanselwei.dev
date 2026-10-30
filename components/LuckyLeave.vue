<template>
  <!-- Before I'm Feeling Lucky leaves the page: a bubble like a definition's (components/TermTip.vue)
       saying where it's going, and a bar in the XP timeline's colours (components/AboutCard.vue)
       that empties as the time runs out. Go now, or Cancel (or Escape) to stay. -->
  <div class="lucky-leave" role="dialog" aria-label="Leaving this page" @keydown.esc.stop="cancel">
    <p class="lucky-leave__where">{{ where }}</p>
    <p class="lucky-leave__title">{{ title }}</p>
    <div class="lucky-leave__bar" aria-hidden="true">
      <span class="lucky-leave__fill" :style="{ '--leave-ms': `${ms}ms` }" />
    </div>
    <p class="lucky-leave__time" aria-live="polite">Going in {{ left }} {{ left === 1 ? 'second' : 'seconds' }}</p>
    <div class="lucky-leave__buttons">
      <button type="button" class="lucky-leave__button lucky-leave__button--go" @click="go">Go now</button>
      <button ref="cancelButton" type="button" class="lucky-leave__button" @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<script setup>
// title: what's there; where: where that is; ms: how long until it goes (the parent goes on `go`)
const props = defineProps({
  title: { type: String, required: true },
  where: { type: String, default: 'Taking you to a blog post' },
  ms: { type: Number, default: 5000 }
})
const emit = defineEmits(['go', 'cancel'])

const cancelButton = ref(null)
const left = ref(Math.ceil(props.ms / 1000))
let timer = 0
let ticker = 0
let done = false

const finish = kind => {
  if (done) return
  done = true
  clearTimeout(timer)
  clearInterval(ticker)
  emit(kind)
}
const go = () => finish('go')
const cancel = () => finish('cancel')

onMounted(() => {
  const start = Date.now()
  timer = setTimeout(go, props.ms)
  ticker = setInterval(() => (left.value = Math.max(0, Math.ceil((props.ms - (Date.now() - start)) / 1000))), 250)
  // Ready to cancel straight away, with a key or a tap
  cancelButton.value?.focus()
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  clearInterval(ticker)
})
</script>

<style scoped>
/* The definition bubble's look (components/TermTip.vue) */
.lucky-leave {
  width: min(20rem, 100%);
  margin: 0.75rem auto 0;
  padding: 0.6rem 0.8rem;
  background: #1d232a;
  color: #eee;
  border: 1px solid #9dff5c;
  border-radius: 0.5rem;
  box-shadow: 4px 4px #1d5c3f;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: left;
}

.lucky-leave__where {
  font-weight: 700;
  color: #9dff5c;
  margin-bottom: 0.2rem;
}

.lucky-leave__title {
  font-size: 0.95rem;
}

/* The XP timeline's track (components/AboutCard.vue), emptying from the right */
.lucky-leave__bar {
  height: 0.5rem;
  margin-top: 0.6rem;
  border-radius: 999px;
  background: rgb(192 132 252 / 0.15);
  overflow: hidden;
}

.lucky-leave__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #c084fc, #41b883);
  transform-origin: left;
  animation: lucky-drain var(--leave-ms) linear forwards;
}

@keyframes lucky-drain {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.lucky-leave__time {
  margin-top: 0.3rem;
  color: #bbb;
  font-size: 0.8rem;
}

.lucky-leave__buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.lucky-leave__button {
  padding: 0.3rem 0.8rem;
  border: 1px solid #653496;
  border-radius: 9999px;
  background: #23262a;
  color: #eee;
}

.lucky-leave__button--go {
  border-color: #9dff5c;
  color: #9dff5c;
}

@media (prefers-reduced-motion: no-preference) {
  .lucky-leave {
    animation: lucky-leave-in 0.12s ease-out;
  }
}

/* With reduced motion the bar holds still; the seconds still count down */
@media (prefers-reduced-motion: reduce) {
  .lucky-leave__fill {
    animation: none;
  }
}

@keyframes lucky-leave-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
}
</style>
