// Foldables (README "Foldables"): which layout the screen gets, and where the fold is.
//
// - Folded part-way, Chromium (138+) and Safari's preview flag (27.1, iPhone Duo) report the
//   screen as two viewport segments with the fold between them: stacked is "tabletop" (a crease
//   across, the top half tilted back like a laptop), side by side is "book".
// - Safari with only its Device Posture flag says "folded" without saying where: the hinge is
//   in the middle of the screen (iPhone Duo, like every foldable so far), so the middle it is,
//   with a wider margin for Safari's own bars moving it a little.
// - Open flat: a near-square touch screen (Android foldables), or iPhone Duo's inner screen
//   held sideways. iPhone Duo is the only iPhone whose page is 500px or more both ways.
// - Anything else: null, the usual layout.
// It also names iPhone Duo's screens (data-device="iphone-duo" inside, "iphone-duo-cover" on the
// front), for the touches made just for it (components/DuoLaptopLid.vue, components/FoldPong.vue).
//
// The script in the page head (nuxt.config.js) runs foldMode before the first paint and again on
// every resize and fold, and sets <html data-fold="tabletop|book|flat"> and the --fold-*
// variables the layouts use (layouts/default.vue, components/AppNav.vue, pages/index.vue).

// Unfolded Android foldables: between phone and tablet sizes, near-square, touch only (no phone,
// tablet or desktop window matches: tests/e2e/foldable.spec.mjs)
export const FLAT_QUERY =
  '(min-width: 600px) and (max-width: 1100px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4) and (pointer: coarse) and (hover: none)'

// segments: [{x, y, width, height}, …] or null; posture: 'folded', 'continuous' or undefined.
// Self-contained: it's also turned into a string for the page head script.
export function foldMode({ segments, posture, flat, iphone, width, height }) {
  const CREASE = 16 // px kept clear on both sides of a known fold (seamless folds report none)
  const GUESSED_CREASE = 32 // where the fold is only guessed (the middle)
  // iPhone Duo's inner screen is the only iPhone page 500px or more both ways; its front (outer)
  // screen is 382px wide upright in Safari, a width no other iPhone has (they're 320-440 in steps
  // of 375, 390, 393, 402, 414, 428, 430, 440)
  const narrow = Math.min(width, height)
  const device = !iphone ? null : narrow >= 500 ? 'iphone-duo' : narrow >= 378 && narrow <= 386 && height > width ? 'iphone-duo-cover' : null
  if (segments && segments.length === 2) {
    const [a, b] = segments
    if (b.y > a.y) return { mode: 'tabletop', device, vars: { 'fold-top-end': a.y + a.height, 'fold-bottom-start': b.y, crease: CREASE } }
    return { mode: 'book', device, vars: { 'fold-left-end': a.x + a.width, 'fold-right-start': b.x, crease: CREASE } }
  }
  if (posture === 'folded') {
    // Held upright the crease runs across (tabletop); sideways it runs down the middle (book)
    if (height > width) return { mode: 'tabletop', device, vars: { 'fold-top-end': height / 2, 'fold-bottom-start': height / 2, crease: GUESSED_CREASE } }
    return { mode: 'book', device, vars: { 'fold-left-end': width / 2, 'fold-right-start': width / 2, crease: GUESSED_CREASE } }
  }
  if (flat || (device && width >= 700 && width > height)) return { mode: 'flat', device, vars: {} }
  return { mode: null, device, vars: {} }
}

// The page head script: `(${watchFold})(${foldMode}, FLAT_QUERY)`. Self-contained (it's turned
// into a string) and old-browser safe; does nothing to pages it isn't folded or flat on.
export function watchFold(foldMode, flatQuery) {
  var root = document.documentElement
  var flat = matchMedia(flatQuery)
  var names = ['fold-top-end', 'fold-bottom-start', 'fold-left-end', 'fold-right-start', 'crease']
  var apply = function () {
    var vp = window.viewport
    var segments = vp && vp.segments ? Array.prototype.map.call(vp.segments, function (s) { return { x: s.x, y: s.y, width: s.width, height: s.height } }) : null
    var r = foldMode({
      segments: segments,
      posture: navigator.devicePosture && navigator.devicePosture.type,
      flat: flat.matches,
      iphone: /iPhone/.test(navigator.userAgent),
      width: innerWidth,
      height: innerHeight
    })
    if (r.mode) root.setAttribute('data-fold', r.mode)
    else root.removeAttribute('data-fold')
    if (r.device) root.setAttribute('data-device', r.device)
    else root.removeAttribute('data-device')
    names.forEach(function (n) {
      if (n in r.vars) root.style.setProperty('--' + n, r.vars[n] + 'px')
      else root.style.removeProperty('--' + n)
    })
  }
  apply()
  addEventListener('resize', apply)
  flat.addEventListener && flat.addEventListener('change', apply)
  ;['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)'].forEach(function (q) {
    var m = matchMedia(q)
    m.addEventListener && m.addEventListener('change', apply)
  })
  if (navigator.devicePosture) navigator.devicePosture.addEventListener('change', apply)
}
