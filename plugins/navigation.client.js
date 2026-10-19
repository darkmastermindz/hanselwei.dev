// Keyboard and game controller navigation across the site, detected from what the visitor uses.
// - The focus ring shows only once a keyboard or controller is in use (html[data-input], see
//   layouts/default.vue); a pointer hides it again.
// - Arrow keys / D-pad move focus to the nearest control in that direction (utils/spatialNav.js),
//   once something is focused (until then arrows scroll the page as usual).
// - Enter / A activates, Escape / B goes back (closing a popup first), PageUp/PageDown / the
//   bumpers switch the About card's tabs or XP years. The right stick scrolls.
// The controller sends the same keys to the focused control, so components only handle keys.
import { FOCUSABLE, pickNext } from '~/utils/spatialNav.js'
import { buttonsDown, pressesFor, stickScroll } from '~/utils/gamepad.js'

const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'PageUp', 'PageDown', 'Home', 'End'])
const DIRECTIONS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', back: 'Escape', prev: 'PageUp', next: 'PageDown' }
// Controls that use the arrow keys themselves. A controller still moves on from text fields and
// selects (its synthetic arrows can't move a caret or change a select, so it would be stuck)
const OWN_ARROWS = 'input, select, textarea, [contenteditable], [role="slider"], [data-own-arrows]'
const FIELDS = 'input, select, textarea, [contenteditable]'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const root = document.documentElement
  const setMode = mode => {
    if (root.dataset.input !== mode) root.dataset.input = mode
  }

  const shown = el => {
    if (el.closest('[aria-hidden="true"], [inert]')) return false
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return false
    return getComputedStyle(el).visibility !== 'hidden'
  }
  const focusables = () => [...document.querySelectorAll(FOCUSABLE)].filter(shown)
  const focused = () => {
    const el = document.activeElement
    return el && el !== document.body && el.matches?.(FOCUSABLE) ? el : null
  }
  const moveTo = el => {
    el.focus({ preventScroll: true, focusVisible: true })
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  // Focus the nearest control in a direction; false when there's none (the page scrolls instead)
  const move = direction => {
    const from = focused()
    const candidates = focusables().filter(el => el !== from && !el.contains(from))
    if (!from) {
      // Nothing focused yet (a controller's first press): start at the top of the screen
      const onScreen = candidates.filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.bottom > 0 && rect.top < innerHeight
      })
      const first = onScreen.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
      if (first) moveTo(first)
      return Boolean(first)
    }
    const index = pickNext(from.getBoundingClientRect(), candidates.map(el => el.getBoundingClientRect()), direction)
    if (index < 0) return false
    moveTo(candidates[index])
    return true
  }

  // Back a page, unless a popup is open (its own Escape closes it) or a field has text (Escape
  // clears it). Only within the site: never off to wherever the visitor came from.
  const goBack = () => {
    if (document.querySelector('[aria-expanded="true"]')) return false
    const el = document.activeElement
    if (el?.matches?.('input, textarea') && el.value) return false
    if (!window.history.state?.back) return false
    router.back()
    return true
  }

  // Runs after the components' own key handlers (they're on elements, this is on the document)
  document.addEventListener('keydown', event => {
    if (event.isTrusted && NAV_KEYS.has(event.key)) setMode('keyboard')
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const direction = DIRECTIONS[event.key]
    if (direction) {
      const from = focused()
      if (event.shiftKey || !from || from.matches(OWN_ARROWS) || from.closest('[data-own-arrows]')) return
      if (move(direction)) event.preventDefault()
    } else if (event.key === 'Escape') {
      if (goBack()) event.preventDefault()
    }
  })
  document.addEventListener(
    'pointerdown',
    event => {
      if (event.isTrusted) setMode('pointer')
    },
    true
  )

  // Controller: send the matching key to the focused control (or the page)
  const send = (type, key) => {
    const target = document.activeElement ?? document.body
    const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event
  }
  const press = intent => {
    if (intent === 'activate') {
      const el = focused()
      // Enter first, so controls with their own Enter handle it; a select opens its list;
      // anything else is clicked
      if (!el || send('keydown', 'Enter').defaultPrevented) return
      if (el.matches('select')) el.showPicker?.()
      else el.click()
    } else if (DIRECTIONS[KEYS[intent]] && (!focused() || focused().matches(FIELDS))) {
      move(intent)
    } else {
      send('keydown', KEYS[intent])
    }
  }
  const release = intent => {
    if (intent === 'activate' && focused()) send('keyup', 'Enter')
  }

  let state = new Map()
  let frame = 0
  const pads = () => [...(navigator.getGamepads?.() ?? [])].filter(Boolean)
  const poll = now => {
    frame = 0
    const list = pads()
    if (!list.length || document.hidden) {
      state = new Map()
      return
    }
    const held = new Set()
    const scroll = { x: 0, y: 0 }
    for (const pad of list) {
      for (const intent of buttonsDown(pad)) held.add(intent)
      const { x, y } = stickScroll(pad)
      scroll.x += x
      scroll.y += y
    }
    const result = pressesFor(state, held, now)
    state = result.state
    if (result.fired.length || scroll.x || scroll.y) setMode('gamepad')
    result.fired.forEach(press)
    result.released.forEach(release)
    if (scroll.x || scroll.y) window.scrollBy(scroll.x, scroll.y)
    frame = requestAnimationFrame(poll)
  }
  // Poll only while a controller is connected and the tab is visible
  const start = () => {
    if (!frame && !document.hidden && pads().length) frame = requestAnimationFrame(poll)
  }
  window.addEventListener('gamepadconnected', start)
  document.addEventListener('visibilitychange', start)
  start()
})
