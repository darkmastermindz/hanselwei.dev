// Registers the service worker so the site can be installed as an app
// (Android "Install app" / iOS "Add to Home Screen") and works offline.
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return

  const register = () =>
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service worker registration failed', err)
    })

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
