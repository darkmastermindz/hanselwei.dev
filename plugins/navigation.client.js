// Keyboard and game controller navigation across the site, detected from what the visitor uses.
// - The focus ring shows only once a keyboard or controller is in use (html[data-input], see
//   layouts/default.vue); a pointer hides it again.
// - Arrow keys / D-pad move focus to the nearest control in that direction (utils/spatialNav.js),
//   once something is focused (until then arrows scroll the page as usual).
// - Enter / A activates, Escape / B goes back (closing a popup first), PageUp/PageDown / the
//   bumpers switch the About card's tabs or XP years. The right stick scrolls.
// - With a keyboard or controller in use, the mouse wheel moves focus to the next / previous
//   control while one is close by (the About card's XP view takes the wheel for its years).
// - A controller's focus gets a sparkling border (one overlay that follows the focus).
// The controller sends the same keys to the focused control, so components only handle keys.
import { FOCUSABLE, pickNext } from '~/utils/spatialNav.js'
import { buttonsDown, isController, padActivity, padSnapshot, pressesFor, stickScroll } from '~/utils/gamepad.js'
import { wheelDy } from '~/utils/swipe.js'

const WHEEL_FOCUS_PX = 80 // wheel travel per focus step
const NEAR_PX = 48 // the wheel only moves focus to a control on (or just off) the screen

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

  // The nearest control in a direction, or, with nothing focused yet (a controller's first
  // press), the first one on screen
  const nextFrom = direction => {
    const from = focused()
    const candidates = focusables().filter(el => el !== from && !el.contains(from))
    if (!from) {
      const onScreen = candidates.filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.bottom > 0 && rect.top < innerHeight
      })
      return onScreen.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] ?? null
    }
    const index = pickNext(from.getBoundingClientRect(), candidates.map(el => el.getBoundingClientRect()), direction)
    return index < 0 ? null : candidates[index]
  }
  // Focus it; false when there's none (the page scrolls instead)
  const move = direction => {
    const el = nextFrom(direction)
    if (el) moveTo(el)
    return Boolean(el)
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
  // The wheel, once a keyboard or controller is in use: next / previous control while the next
  // one is near the screen; otherwise (long text between links) it scrolls as usual. Runs after
  // the About card's own wheel handling, which takes the wheel for its years.
  let wheelTravel = 0
  let wheelTimer = null
  document.addEventListener(
    'wheel',
    event => {
      if (event.defaultPrevented || event.ctrlKey) return
      if (root.dataset.input !== 'keyboard' && root.dataset.input !== 'gamepad') return
      const from = focused()
      const dy = wheelDy(event)
      if (!from || !dy || from.matches(FIELDS)) return
      const direction = dy > 0 ? 'down' : 'up'
      const target = nextFrom(direction)
      const rect = target?.getBoundingClientRect()
      const near = rect && (direction === 'down' ? rect.top < innerHeight + NEAR_PX : rect.bottom > -NEAR_PX)
      if (!near) {
        wheelTravel = 0
        return
      }
      event.preventDefault()
      clearTimeout(wheelTimer)
      wheelTimer = setTimeout(() => (wheelTravel = 0), 250)
      wheelTravel += dy
      if (Math.abs(wheelTravel) < WHEEL_FOCUS_PX) return
      wheelTravel = 0
      moveTo(target)
    },
    { passive: false }
  )

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

  // Controller focus: a sparkling border that follows the focused control (one overlay, so no
  // component's own styles are touched). Hidden for keyboard and pointer.
  let sparkle = null
  let sparkleFrame = 0
  const placeSparkle = () => {
    sparkleFrame = 0
    const el = focused()
    if (root.dataset.input !== 'gamepad' || !el) {
      if (sparkle) sparkle.hidden = true
      return
    }
    if (!sparkle) {
      sparkle = document.createElement('div')
      sparkle.className = 'focus-sparkle'
      sparkle.setAttribute('aria-hidden', 'true')
      sparkle.append(Object.assign(document.createElement('span'), { className: 'focus-sparkle__ring' }))
      for (const char of ['✦', '✧', '✦', '✧']) {
        sparkle.append(Object.assign(document.createElement('span'), { className: 'focus-sparkle__star', textContent: char }))
      }
      document.body.append(sparkle)
    }
    const rect = el.getBoundingClientRect()
    // Follow the control's shape: a round coin gets a round ring
    const radius = getComputedStyle(el).borderTopLeftRadius
    Object.assign(sparkle.style, {
      left: `${rect.left - 5}px`,
      top: `${rect.top - 5}px`,
      width: `${rect.width + 10}px`,
      height: `${rect.height + 10}px`,
      borderRadius: radius.endsWith('%') ? radius : `${Math.min((parseFloat(radius) || 0) + 5, (rect.height + 10) / 2)}px`
    })
    sparkle.hidden = false
  }
  const followFocus = () => {
    if (!sparkleFrame) sparkleFrame = requestAnimationFrame(placeSparkle)
  }
  document.addEventListener('focusin', followFocus)
  document.addEventListener('focusout', followFocus)
  addEventListener('scroll', followFocus, { passive: true, capture: true })
  addEventListener('resize', followFocus, { passive: true })
  new MutationObserver(followFocus).observe(root, { attributes: true, attributeFilter: ['data-input'] })

  let state = new Map()
  let frame = 0
  const pads = () => [...(navigator.getGamepads?.() ?? [])].filter(isController)
  // A pad acts only once someone uses it (padActivity): each pad's reading when it was last put to
  // sleep, and the pads awake since. On a touch-first device (a phone) only a button press wakes
  // a pad, never a stick, and any touch puts every pad back to sleep: a finger on the screen
  // always wins over whatever the phone reports as a controller.
  const touchFirst = window.matchMedia('(pointer: coarse)').matches
  const snapshots = new Map()
  const awake = new Set()
  let fingers = 0
  const inUse = pad => {
    const key = `${pad.index}:${pad.id}`
    if (awake.has(key)) return true
    if (!snapshots.has(key)) snapshots.set(key, padSnapshot(pad))
    if (!padActivity(pad, snapshots.get(key), { sticks: !touchFirst })) return false
    awake.add(key)
    return true
  }
  const sleepPads = () => {
    awake.clear()
    snapshots.clear() // retaken on the next poll, so a button held down now doesn't count
    state = new Map()
  }
  const countFingers = event => {
    if (!event.isTrusted) return
    fingers = event.touches.length
    if (fingers) sleepPads()
  }
  for (const type of ['touchstart', 'touchend', 'touchcancel']) {
    addEventListener(type, countFingers, { passive: true, capture: true })
  }
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
      if (fingers || !inUse(pad)) continue
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
    followFocus() // controls can move (the About card changes size): keep the sparkle on them
    frame = requestAnimationFrame(poll)
  }
  // Poll only while a (standard-mapping) controller is connected and the tab is visible
  const start = () => {
    if (!frame && !document.hidden && pads().length) frame = requestAnimationFrame(poll)
  }
  window.addEventListener('gamepadconnected', start)
  document.addEventListener('visibilitychange', start)
  start()
})
