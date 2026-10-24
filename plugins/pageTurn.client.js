// Turning the page on a foldable in book (a crease down the middle, <html data-fold="book">):
// going to another page turns the right page over onto the left like a book, and going back turns
// it back (the animation is CSS, in layouts/default.vue). Uses the View Transitions API (Chrome,
// Samsung Internet, Safari 18+); anywhere else, or with reduced motion, pages change as usual.
import { turnDirection } from '~/utils/pageTurn.mjs'

export default defineNuxtPlugin(nuxtApp => {
  if (!document.startViewTransition) return
  const root = document.documentElement
  const still = matchMedia('(prefers-reduced-motion: reduce)')
  const router = useRouter()

  let rendered = null // resolves once the new page is on screen
  let turns = 0
  const settle = () => {
    rendered?.()
    rendered = null
  }

  router.beforeResolve((to, from) => {
    if (to.path === from.path || root.dataset.fold !== 'book' || still.matches) return
    settle()
    const turn = ++turns
    root.dataset.pageTurn = turnDirection(from.path, to.path)
    const pageShown = new Promise(resolve => {
      rendered = resolve
      setTimeout(resolve, 1500) // never hold the old page longer than this
    })
    // The navigation goes on once the old page has been captured
    return new Promise(resolve => {
      const transition = document.startViewTransition(() => {
        resolve()
        return pageShown
      })
      // A turn that's skipped (tapped again mid-turn, or Safari skipping it while the tab is
      // hidden) rejects `ready`; the page still changes, so it's not an error worth logging
      transition.ready.catch(() => {})
      transition.finished.finally(() => {
        if (turn === turns) delete root.dataset.pageTurn
      })
    })
  })

  nuxtApp.hook('page:finish', settle)
  nuxtApp.hook('vue:error', settle)
})
