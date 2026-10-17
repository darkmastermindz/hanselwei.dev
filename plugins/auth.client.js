// Picks up the Netlify Identity session, and completes sign-in redirects, on every page
// load. The hash is read straight away (the Identity library clears it when it loads);
// the rest waits until the app has finished loading, so the router's first navigation
// doesn't put a tidied-away hash back.
export default defineNuxtPlugin(() => {
  const auth = useAuth()
  const router = useRouter()
  const landingHash = location.hash
  const clearHash = () => router.replace({ ...router.currentRoute.value, hash: '' })
  onNuxtReady(() => auth.start({ landingHash, clearHash }))
})
