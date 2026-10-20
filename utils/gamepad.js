// Game controller input for plugins/navigation.client.js, kept pure so it can be unit tested.
// Uses the standard mapping (Xbox / PlayStation / Switch Pro layouts in modern browsers).
export const STICK_DEADZONE = 0.5 // left stick: how far it must lean to count as a direction
export const SCROLL_DEADZONE = 0.2 // right stick: drift below this doesn't scroll
export const SCROLL_PX_PER_FRAME = 18 // right stick fully over
export const REPEAT_DELAY_MS = 400 // a held direction repeats after this...
export const REPEAT_EVERY_MS = 120 // ...this often

const BUTTONS = { 0: 'activate', 1: 'back', 4: 'prev', 5: 'next', 12: 'up', 13: 'down', 14: 'left', 15: 'right' }
const REPEATS = new Set(['up', 'down', 'left', 'right', 'prev', 'next'])

const pressed = button => (typeof button === 'object' ? Boolean(button?.pressed) : button > 0.5)

// Only real controllers: browsers give them the standard mapping. Phones also list other hardware
// as gamepads (fingerprint readers, sensor hubs) with mapping "" and axes stuck at ±1, which would
// otherwise scroll the page every frame and pin it in place.
export const isController = pad => pad?.mapping === 'standard'

// Whether someone has used a pad: a button pressed, or a stick moved well away from where it sat
// when the page first saw it (`rest`, its first axes reading). Until then it's ignored, so a
// stick that rests off-centre can't scroll or move focus on its own.
export const padActivity = (pad, rest = []) =>
  Boolean(pad?.buttons?.some(pressed)) ||
  Boolean(pad?.axes?.some((value, i) => Math.abs(value - (rest[i] ?? 0)) > STICK_DEADZONE))

// The intents held on a pad right now: D-pad, face buttons, bumpers and the left stick
export const buttonsDown = pad => {
  const held = new Set()
  if (!pad) return held
  pad.buttons?.forEach((button, i) => {
    if (Object.hasOwn(BUTTONS, i) && pressed(button)) held.add(BUTTONS[i])
  })
  const [x = 0, y = 0] = pad.axes ?? []
  if (Math.abs(x) >= STICK_DEADZONE || Math.abs(y) >= STICK_DEADZONE) {
    if (Math.abs(x) > Math.abs(y)) held.add(x > 0 ? 'right' : 'left')
    else held.add(y > 0 ? 'down' : 'up')
  }
  return held
}

// Page scroll for this frame from the right stick, as { x, y } pixels
export const stickScroll = pad => {
  const axis = value => {
    if (!(Math.abs(value) >= SCROLL_DEADZONE)) return 0
    const strength = (Math.abs(value) - SCROLL_DEADZONE) / (1 - SCROLL_DEADZONE)
    return Math.sign(value) * Math.round(strength * strength * SCROLL_PX_PER_FRAME)
  }
  return { x: axis(pad?.axes?.[2] ?? 0), y: axis(pad?.axes?.[3] ?? 0) }
}

// Which intents fire this frame. `state` maps each held intent to { since, last } (ms) and is
// returned updated: a new press fires at once, a held direction repeats after the delay, and
// `released` lists the intents let go this frame (A's release finishes a press-and-hold).
export const pressesFor = (state, held, now) => {
  const next = new Map()
  const fired = []
  for (const intent of held) {
    const was = state.get(intent)
    if (!was) {
      fired.push(intent)
      next.set(intent, { since: now, last: now })
    } else if (REPEATS.has(intent) && now - was.since >= REPEAT_DELAY_MS && now - was.last >= REPEAT_EVERY_MS) {
      fired.push(intent)
      next.set(intent, { since: was.since, last: now })
    } else {
      next.set(intent, was)
    }
  }
  const released = [...state.keys()].filter(intent => !held.has(intent))
  return { state: next, fired, released }
}
