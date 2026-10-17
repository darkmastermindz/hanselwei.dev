// Picks up the owner's session on every page load, and reads a refused sign-in from the
// URL hash. The hash is read straight away; the check waits until the app has finished
// loading, so the router's first navigation doesn't put a tidied-away hash back.
export default defineNuxtPlugin(() => {
  const auth = useAuth()
  const router = useRouter()
  const landingHash = location.hash
  const clearHash = () => router.replace({ ...router.currentRoute.value, hash: '' })
  onNuxtReady(() => auth.start({ landingHash, clearHash }))
})
