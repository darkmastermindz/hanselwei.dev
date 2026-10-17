<template>
  <main class="outer">
    <div class="flex justify-center pt-6 pb-4">
      <Bitmoji @spin="addSpin" @release="reveal" />
    </div>
    <p class="hint">
      <template v-if="loaded && count">
        🪙 <strong>{{ count }}</strong> {{ count === 1 ? 'spin' : 'spins' }}
        · best hold {{ best }}
        · {{ seenCount }}/{{ total }} discovered
      </template>
      <template v-else>press &amp; hold the token ✨</template>
    </p>
    <SpinFact :fact="current" class="mb-4" />
    <h1 class="title text-4xl md:text-5xl lg:text-6xl">
      <strong>Hansel Wei</strong>
    </h1>

    <div class="px-2 md:px-6">
      <Socials />
    </div>

    <ul class="about">
      <li class="text-green-200">
        { "I am a" : [ "Senior Software Developer", "Full Stack Engineer",
        "Secured Infrastructure Professional", "Data Scientist", "Developer Experience Advocate", "Emerging Tech Fanatic!", "✨" ] },
      </li>
      <li class="text-purple-300 motion-safe:animate-pulse">
        { "My hobbies include" : [ "Hiking", "Photography", "Watching Anime", "Coffee", "Board Games", "Rock Climbing", "🧗🏻‍♂️" ] }
      </li>
    </ul>

    <div class="flex flex-wrap justify-center gap-3 px-4 pb-10">
      <NuxtLink to="/blog" class="button--green">Read the blog ✍️</NuxtLink>
      <NuxtLink to="/gear/outdoor" class="button--grey">Browse my outdoor gear 🏔️</NuxtLink>
    </div>
  </main>
</template>

<script setup>
const { loaded, count, best, current, total, seenCount, addSpin, reveal } = useSpinStats()
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

.about {
  max-width: 48rem;
  margin: 1.5rem auto;
  padding: 0 1.25rem;
  font-family: "Nova Mono", monospace;
  font-size: clamp(0.95rem, 3.6vw, 1.15rem);
  line-height: 1.6;
  overflow-wrap: anywhere;

  li {
    margin-bottom: 1.25rem;
  }
}
</style>
