<template>
  <!-- I'm Feeling Lucky: a random blog post, home page fact or definition (utils/lucky.mjs). It only
       reads /lucky.json, so it keeps working whatever the pages and components that show those
       things look like. -->
  <div class="feeling-lucky">
    <button type="button" class="feeling-lucky__button liquid-glass liquid-glass-interactive rounded-full" :disabled="busy" @click="feelLucky">
      🍀 I'm Feeling Lucky
    </button>
    <LetMeSearch v-if="found" :item="found" />
  </div>
</template>

<script setup>
import { pickLucky } from '~/utils/lucky.mjs'

const found = ref(null)
const busy = ref(false)
let pool = null

const feelLucky = async () => {
  busy.value = true
  try {
    pool ??= await $fetch('/lucky.json').catch(() => null)
    const pick = pickLucky(pool)
    // A post opens; a fact or a definition is searched for, here. Nothing to pick: home.
    // clearError() also leaves the 404 page (Nuxt's error page) behind; anywhere else it just goes.
    if (!pick || pick.kind === 'post') return await clearError({ redirect: pick?.path ?? '/' })
    found.value = pick
  } finally {
    busy.value = false
  }
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
