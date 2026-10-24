<template>
  <main class="out">
    <p class="out__text">{{ link ? `Opening ${link.label}…` : 'Taking you back…' }}</p>
    <a class="out__back" href="/">Back to hanselwei.dev</a>
  </main>
</template>

<script setup>
// The hand-off page for social links on phones and tablets (components/SocialFlipLink.vue opens
// /out/<id> in a new tab). It sends the tab on to the link. When the phone hands the link
// to an app instead, the tab stays here, so once the visitor comes back from the app it closes
// itself (where it can't, it goes back to the site). The id in the path only ever names a link
// in utils/outbound.js, so this can't send anyone to an address from the URL.
import { outboundFor } from '~/utils/outbound.js'

definePageMeta({ layout: false })
useHead({ title: 'Opening… · Hansel Wei', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const link = ref(null)

const leave = () => {
  window.close()
  // Still open (it wasn't a fresh tab): back where the visitor was, or the home page
  setTimeout(() => (history.length > 1 ? history.back() : location.replace('/')), 300)
}

onMounted(() => {
  link.value = outboundFor(route.params.id)
  // No such link, or Back from the link's page: nothing to open here
  if (!link.value || history.state?.handedOff) return leave()
  history.replaceState({ ...history.state, handedOff: true }, '')

  // Hidden and then shown again while still here: an app took the link
  let away = false
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) away = true
    else if (away) leave()
  })
  // Back from the link's page, with this one restored from the browser's cache
  addEventListener('pageshow', event => {
    if (event.persisted) leave()
  })
  location.href = link.value.href
})
</script>

<style scoped>
.out {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-content: center;
  gap: 1rem;
  padding: 1rem;
  text-align: center;
  color: #fff;
  background: #2c2f33; /* no site layout here */
}

.out__text {
  font-size: 1.25rem;
  font-weight: 700;
}

.out__back {
  color: #7cfc00;
}
</style>
