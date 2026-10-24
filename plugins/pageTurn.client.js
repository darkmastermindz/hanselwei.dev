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
  let target = null // where the turn in progress is going
  const settle = () => {
    rendered?.()
    rendered = null
  }

  // The middle of the screen, from the top of the right page: the turn's vanishing point, so a
  // long page turns like the part of it on screen, not like a page as tall as all of it
  const middle = name => {
    const page = document.querySelector('.page, .home__deck')
    if (page) root.style.setProperty(`--turn-${name}-middle`, `${innerHeight / 2 - page.getBoundingClientRect().top}px`)
  }

  router.beforeResolve((to, from) => {
    if (to.path === from.path || root.dataset.fold !== 'book' || still.matches) return
    settle()
    // Nuxt scrolls the new page on the next frame (to the top, or back and forward to where it
    // was: the router keeps the place in the history entry), and there's none until the turn is
    // drawn: the page would turn in scrolled wrong and then jump. So the turn scrolls first.
    const state = history.state
    const restore = state?.current === to.fullPath && state.scroll ? state.scroll : to.hash || to.meta.scrollToTop === false ? null : { left: 0, top: 0 }
    target = to.fullPath
    const turn = ++turns
    root.dataset.pageTurn = turnDirection(from.path, to.path)
    delete root.dataset.pageTurned
    middle('old')
    const pageShown = new Promise(resolve => {
      rendered = resolve
      setTimeout(resolve, 1500) // never hold the old page longer than this
    })
    // The navigation goes on once the old page has been captured
    return new Promise(resolve => {
      const transition = document.startViewTransition(async () => {
        resolve()
        await pageShown
        if (turn !== turns) return // another turn has taken over
        if (restore) scrollTo(restore.left ?? 0, restore.top ?? 0)
        // The new right page gets its own name: the old one turns from where it was on screen
        // (a long page scrolled down turns the part being read, not its top)
        root.dataset.pageTurned = ''
        middle('new')
      })
      // A turn that's skipped (tapped again mid-turn, or Safari skipping it while the tab is
      // hidden) rejects `ready`; the page still changes, so it's not an error worth logging
      transition.ready.catch(() => {})
      transition.finished.finally(() => {
        if (turn !== turns) return
        delete root.dataset.pageTurn
        delete root.dataset.pageTurned
      })
    })
  })

  // A turn whose navigation doesn't end on a page (cancelled, or failed) doesn't hold the old page
  router.afterEach((to, from, failure) => failure && to.fullPath === target && settle())
  nuxtApp.hook('page:finish', settle)
  nuxtApp.hook('vue:error', settle)
})
