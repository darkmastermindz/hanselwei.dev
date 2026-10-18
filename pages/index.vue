<template>
  <main class="outer">
    <div class="flex justify-center pt-6 pb-4">
      <Bitmoji @spin="addSpin" @release="onRelease" />
    </div>
    <p class="hint">
      <template v-if="loaded && count">
        🪙 <strong>{{ count }}</strong> {{ count === 1 ? 'spin' : 'spins' }}
        · best hold {{ best }}
        · {{ seenCount }}/{{ total }} discovered
      </template>
      <template v-else><span class="hint__touch">tap</span><span class="hint__mouse">click</span> profile picture coin • discover a new fact</template>
    </p>
    <h1 class="title text-4xl md:text-5xl lg:text-6xl">
      <strong>Hansel Wei</strong>
    </h1>
    <ContactCardButton :unlocked="humanVerified" />

    <AboutCard :fact="current" :reveal-count="reveals" />

    <Socials />

    <div class="flex flex-wrap justify-center gap-3 px-4 pt-10 pb-12">
      <NuxtLink to="/blog" class="button--green">Read the blog 📰</NuxtLink>
      <NuxtLink to="/gear" class="button--grey">Browse my gear lists 🏔️</NuxtLink>
    </div>
  </main>
</template>

<script setup>
const { loaded, count, best, current, total, seenCount, addSpin, reveal } = useSpinStats()

// Spinning the token (with real input) proves there's a human here, which
// unlocks the contact card. Deliberately not persisted: every visit re-checks.
const humanVerified = ref(false)
const reveals = ref(0)
// A 3-second spin, then a tap, also reveals the nav's owner Sign in
const { onTokenRelease } = useOwnerGate()
const onRelease = (spins, heldMs) => {
  reveal(spins)
  reveals.value++
  humanVerified.value = true
  onTokenRelease(spins, heldMs)
}
</script>

<style lang="scss" scoped>
.title {
  font-family: "Roboto Mono", "Quicksand", "Source Sans Pro", -apple-system,
    BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  display: block;
  color: #eee;
  letter-spacing: 1px;
}

.hint {
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
  font-variant-numeric: tabular-nums;

  strong {
    color: #9dff5c;
  }
}
.outer {
  text-align: center;
}

/* Phones say "tap"; a mouse says "click" (the same rule as the About card hint) */
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
</style>
