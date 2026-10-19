// Registers the service worker so the site can be installed as an app
// (Android "Install app" / iOS "Add to Home Screen") and works offline. Also marks the page
// `html.is-installed` when it runs as the installed app, for app-only styling (the nav).
import { isInstalled } from '~/utils/installed.js'

export default defineNuxtPlugin(() => {
  const markInstalled = () =>
    document.documentElement.classList.toggle(
      'is-installed',
      isInstalled({ matchMedia: query => window.matchMedia(query), standalone: navigator.standalone })
    )
  markInstalled()
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', markInstalled)

  if (import.meta.dev || !('serviceWorker' in navigator)) return

  const register = () =>
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service worker registration failed', err)
    })

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
})
