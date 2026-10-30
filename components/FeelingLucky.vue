<template>
  <!-- I'm Feeling Lucky: a random blog post, home page fact or definition (utils/lucky.mjs). It only
       reads /lucky.json, so it keeps working whatever the pages and components that show those
       things look like. -->
  <div class="feeling-lucky">
    <button ref="luckyButton" type="button" class="feeling-lucky__button liquid-glass liquid-glass-interactive rounded-full" :disabled="busy" @click="feelLucky">
      🍀 I'm Feeling Lucky
    </button>
    <!-- Leaving the page: time to see where, and to cancel -->
    <LuckyLeave
      v-if="leaving"
      :key="leaving.path"
      :title="leaving.title"
      :where="leaving.where"
      @go="leave"
      @cancel="stay"
    />
    <LetMeSearch v-else-if="found" :item="found" />
  </div>
</template>

<script setup>
import { pickLucky } from '~/utils/lucky.mjs'

const found = ref(null)
const leaving = ref(null)
const busy = ref(false)
const luckyButton = ref(null)
let pool = null

const feelLucky = async () => {
  busy.value = true
  try {
    pool ??= await $fetch('/lucky.json').catch(() => null)
    const pick = pickLucky(pool)
    // A post opens, after a moment to cancel; a fact or a definition is searched for, here.
    // Nothing to pick: home, the same way.
    if (!pick || pick.kind === 'post') {
      found.value = null
      leaving.value = pick ? { path: pick.path, title: pick.title, where: 'Taking you to a blog post' } : { path: '/', title: 'The home page', where: 'Taking you home' }
      return
    }
    leaving.value = null
    found.value = pick
  } finally {
    busy.value = false
  }
}

// clearError() also leaves the 404 page (Nuxt's error page) behind; anywhere else it just goes
const leave = () => clearError({ redirect: leaving.value.path })
const stay = () => {
  leaving.value = null
  nextTick(() => luckyButton.value?.focus())
}
</script>

<style scoped>
.feeling-lucky {
  margin-top: 1.5rem;
  text-align: center;
}

.feeling-lucky__button {
  padding: 0.6rem 1.4rem;
  color: #eee;
  font-size: 1rem;
}

.feeling-lucky__button:disabled {
  opacity: 0.7;
}

.feeling-lucky :deep(.let-me-search) {
  text-align: left;
}
</style>
