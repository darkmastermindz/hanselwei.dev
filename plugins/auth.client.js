// Picks up the Netlify Identity session, and completes sign-in redirects, on every page load
export default defineNuxtPlugin(() => {
  useAuth().start()
})
