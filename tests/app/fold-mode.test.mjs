import { test } from 'node:test'
import assert from 'node:assert/strict'
import { foldMode, watchFold, FLAT_QUERY } from '../../utils/foldMode.mjs'
import { chapterOf, neighbours, turnDirection, turnHintDue, TURN_HINT_TIMES } from '../../utils/pageTurn.mjs'

const base = { segments: null, posture: undefined, flat: false, iphone: false }

test('two stacked segments are tabletop, with the fold where the browser says', () => {
  const r = foldMode({ ...base, width: 1040, height: 932, segments: [{ x: 0, y: 0, width: 1040, height: 456 }, { x: 0, y: 476, width: 1040, height: 456 }] })
  assert.equal(r.mode, 'tabletop')
  assert.deepEqual(r.vars, { 'fold-top-end': 456, 'fold-bottom-start': 476, crease: 16 })
})

test('two side-by-side segments are book', () => {
  const r = foldMode({ ...base, width: 984, height: 1016, segments: [{ x: 0, y: 0, width: 492, height: 1016 }, { x: 492, y: 0, width: 492, height: 1016 }] })
  assert.equal(r.mode, 'book')
  assert.deepEqual(r.vars, { 'fold-left-end': 492, 'fold-right-start': 492, crease: 16 })
})

test('segments win over the posture (a phone folded sideways in landscape is still tabletop)', () => {
  const r = foldMode({ ...base, posture: 'folded', width: 1040, height: 932, segments: [{ x: 0, y: 0, width: 1040, height: 466 }, { x: 0, y: 466, width: 1040, height: 466 }] })
  assert.equal(r.mode, 'tabletop')
})

test('folded with no segments (Safari posture flag, iPhone Duo): the fold is guessed in the middle', () => {
  const book = foldMode({ ...base, iphone: true, posture: 'folded', width: 890, height: 600 })
  assert.equal(book.mode, 'book')
  assert.equal(book.device, 'iphone-duo')
  assert.deepEqual(book.vars, { 'fold-left-end': 445, 'fold-right-start': 445, crease: 32 })
  const tabletop = foldMode({ ...base, iphone: true, posture: 'folded', width: 626, height: 800 })
  assert.equal(tabletop.mode, 'tabletop')
  assert.equal(tabletop.vars['fold-top-end'], 400)
})

test("iPhone Duo's inner screen held sideways is open flat; upright, or the outer screen, is the usual layout", () => {
  assert.equal(foldMode({ ...base, iphone: true, width: 951, height: 600 }).mode, 'flat')
  assert.equal(foldMode({ ...base, iphone: true, width: 890, height: 626 }).device, 'iphone-duo')
  const upright = foldMode({ ...base, iphone: true, width: 626, height: 800 })
  assert.equal(upright.mode, null)
  assert.equal(upright.device, 'iphone-duo')
  assert.deepEqual(foldMode({ ...base, iphone: true, width: 382, height: 580 }), { mode: null, device: 'iphone-duo-cover', vars: {} })
  // The front screen sideways isn't told apart (Safari's bars change its height): the usual layout
  assert.equal(foldMode({ ...base, iphone: true, width: 580, height: 382 }).device, null)
  // Another phone's 382px-wide browser isn't an iPhone Duo
  assert.equal(foldMode({ ...base, iphone: false, width: 382, height: 580 }).device, null)
})

test('no other iPhone is taken for iPhone Duo, upright or sideways', () => {
  for (const [w, h] of [[320, 568], [375, 667], [390, 844], [393, 852], [402, 874], [430, 932], [440, 956]]) {
    assert.deepEqual(foldMode({ ...base, iphone: true, width: w, height: h }), { mode: null, device: null, vars: {} })
    assert.deepEqual(foldMode({ ...base, iphone: true, width: h, height: w }), { mode: null, device: null, vars: {} })
  }
})

test("folded on an iPhone that isn't on iPhone Duo's inner screen: the outer screen, no fold", () => {
  // (Upright, the outer screen is still named, for the touches made for it)
  assert.deepEqual(foldMode({ ...base, iphone: true, apple: true, posture: 'folded', width: 382, height: 580 }), { mode: null, device: 'iphone-duo-cover', vars: {} })
  assert.deepEqual(foldMode({ ...base, iphone: true, apple: true, posture: 'folded', width: 580, height: 382 }), { mode: null, device: null, vars: {} })
  // Android with only the posture: the middle, as before
  assert.equal(foldMode({ ...base, posture: 'folded', width: 412, height: 915 }).mode, 'tabletop')
})

test("Apple devices never get the Android near-square layout: iPads (which say they're Macs) and iPhone Duo upright", () => {
  // iPad windows in Split View or Stage Manager can be near-square and touch-only
  for (const [w, h] of [[820, 820], [744, 900], [1000, 900], [678, 820]]) {
    assert.deepEqual(foldMode({ ...base, apple: true, flat: true, width: w, height: h }), { mode: null, device: null, vars: {} })
    assert.deepEqual(foldMode({ ...base, apple: true, width: h, height: w }), { mode: null, device: null, vars: {} })
  }
  // iPhone Duo upright with Safari's bars showing is just inside 4/5: still the usual layout
  const upright = foldMode({ ...base, iphone: true, apple: true, flat: true, width: 626, height: 760 })
  assert.equal(upright.mode, null)
  assert.equal(upright.device, 'iphone-duo')
  // Sideways it's still two columns
  assert.equal(foldMode({ ...base, iphone: true, apple: true, flat: true, width: 951, height: 600 }).mode, 'flat')
})

test('an unfolded Android foldable (the flat query) is open flat; anything else is unchanged', () => {
  assert.equal(foldMode({ ...base, flat: true, width: 984, height: 1016 }).mode, 'flat')
  assert.deepEqual(foldMode({ ...base, width: 1280, height: 800 }), { mode: null, device: null, vars: {} })
  assert.equal(foldMode({ ...base, posture: 'continuous', width: 412, height: 915 }).mode, null)
})

test('more than two segments (a tri-fold part-way open) get the usual layout, not a fold guessed in the middle', () => {
  const thirds = [0, 1, 2].map(i => ({ x: i * 400, y: 0, width: 400, height: 900 }))
  assert.deepEqual(foldMode({ ...base, segments: thirds, posture: 'folded', width: 1200, height: 900 }), { mode: null, device: null, vars: {} })
  assert.deepEqual(foldMode({ ...base, segments: thirds, flat: true, width: 1200, height: 900 }), { mode: null, device: null, vars: {} })
})

test('the head script works as a string (no outside references)', () => {
  const script = `(${watchFold})(${foldMode}, ${JSON.stringify(FLAT_QUERY)})`
  const attrs = {}
  const style = {}
  const env = {
    document: { documentElement: { setAttribute: (k, v) => (attrs[k] = v), removeAttribute: k => delete attrs[k], style: { setProperty: (k, v) => (style[k] = v), removeProperty: k => delete style[k] } } },
    window: { viewport: { segments: [{ x: 0, y: 0, width: 492, height: 1016 }, { x: 492, y: 0, width: 492, height: 1016 }] } },
    navigator: { userAgent: 'Android', devicePosture: { type: 'folded', addEventListener() {} } },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
    innerWidth: 984,
    innerHeight: 1016
  }
  new Function(...Object.keys(env), script)(...Object.values(env))
  assert.equal(attrs['data-fold'], 'book')
  assert.equal(style['--fold-left-end'], '492px')
  assert.equal(style['--crease'], '16px')
})

// A fake iPhone Duo page for the head script: innerWidth/innerHeight are what's visible, as on iOS,
// and clientWidth/clientHeight the page's own size
const duoPage = ({ ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X)', posture } = {}) => {
  const attrs = {}
  const style = {}
  const listeners = {}
  const queries = []
  let writes = 0
  const root = {
    clientWidth: 951,
    clientHeight: 600,
    setAttribute: (k, v) => ((attrs[k] = v), writes++),
    removeAttribute: k => delete attrs[k],
    style: { setProperty: (k, v) => (style[k] = v), removeProperty: k => delete style[k] }
  }
  const env = {
    document: { documentElement: root },
    window: {},
    navigator: { userAgent: ua, ...(posture && { devicePosture: { type: posture, addEventListener() {} } }) },
    matchMedia: q => {
      const m = { query: q, matches: false, addEventListener: (e, f) => (m.change = f) }
      queries.push(m)
      return m
    },
    addEventListener: (e, f) => (listeners[e] = f),
    innerWidth: 951,
    innerHeight: 600
  }
  const script = `(${watchFold})(${foldMode}, ${JSON.stringify(FLAT_QUERY)})`
  const run = new Function(...Object.keys(env), `${script}; return { set: (k, v) => { eval(k + ' = ' + JSON.stringify(v)) } }`)
  const scope = run(...Object.values(env))
  return { attrs, style, listeners, queries, root, scope, writes: () => writes }
}

test("iPhone Duo sideways keeps its two columns when zoomed in or typing (iOS's innerWidth/innerHeight shrink)", () => {
  const page = duoPage()
  assert.equal(page.attrs['data-fold'], 'flat')
  // Pinch zoom or the keyboard: only what's visible shrinks, the page doesn't
  page.scope.set('innerWidth', 420)
  page.scope.set('innerHeight', 260)
  page.listeners.resize()
  assert.equal(page.attrs['data-fold'], 'flat')
  assert.equal(page.attrs['data-device'], 'iphone-duo')
})

test("a guessed fold doesn't move as Safari's toolbar slides away, and the page isn't restyled for nothing", () => {
  const page = duoPage({ posture: 'folded' })
  page.root.clientWidth = 626
  page.root.clientHeight = 760
  page.listeners.resize()
  assert.equal(page.attrs['data-fold'], 'tabletop')
  assert.equal(page.style['--fold-top-end'], '380px')
  const writes = page.writes()
  for (const h of [780, 800, 820]) {
    page.scope.set('innerHeight', h)
    page.listeners.resize()
  }
  assert.equal(page.style['--fold-top-end'], '380px')
  assert.equal(page.writes(), writes, 'no restyle when nothing changed')
})

test('the head script re-checks on turning the phone and on coming back from the back-forward cache', () => {
  const page = duoPage()
  assert.ok(page.queries.some(m => m.query === '(orientation: portrait)' && m.change), 'listens for the orientation')
  assert.equal(typeof page.listeners.pageshow, 'function')
  // Turned upright: the usual layout
  page.root.clientWidth = 626
  page.root.clientHeight = 800
  page.queries.find(m => m.query === '(orientation: portrait)').change()
  assert.equal(page.attrs['data-fold'], undefined)
  assert.equal(page.attrs['data-device'], 'iphone-duo')
})

test("an iPad (Safari's Mac user agent) never gets iPhone Duo or a foldable layout, even when the near-square query matches", () => {
  const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.1 Safari/605.1.15'
  const page = duoPage({ ua: ipad })
  page.root.clientWidth = 900
  page.root.clientHeight = 900
  page.queries.forEach(m => (m.matches = true))
  page.listeners.resize()
  assert.equal(page.attrs['data-fold'], undefined)
  assert.equal(page.attrs['data-device'], undefined)
})

test('the site as a book: chapters in the menu order, pages outside it at the end', () => {
  assert.equal(chapterOf('/'), 0)
  assert.equal(chapterOf('/blog/feed'), 2)
  assert.equal(chapterOf('/gear/outdoor/'), 3)
  assert.equal(chapterOf('/terms'), 5)
  assert.equal(chapterOf('/blogger'), 5)
})

test('later or deeper turns forward; earlier or back out turns back', () => {
  assert.equal(turnDirection('/', '/bio'), 'forward')
  assert.equal(turnDirection('/bio', '/projects'), 'back')
  assert.equal(turnDirection('/gear', '/gear/camera'), 'forward')
  assert.equal(turnDirection('/gear/camera', '/gear'), 'back')
  assert.equal(turnDirection('/bio', '/terms'), 'forward')
})

test('the corner links turn to the next and previous chapter', () => {
  assert.deepEqual(neighbours('/'), { prev: null, next: { to: '/projects', label: 'Projects' } })
  assert.deepEqual(neighbours('/blog/hello-world'), { prev: { to: '/projects', label: 'Projects' }, next: { to: '/gear', label: 'Gear Lists' } })
  assert.equal(neighbours('/bio').next, null)
  assert.deepEqual(neighbours('/credits').prev, { to: '/bio', label: 'Bio' })
})

test('the page-turn hint shows the first few times, then not again', () => {
  for (let n = 0; n < TURN_HINT_TIMES; n++) assert.equal(turnHintDue(n), true, String(n))
  for (const n of [TURN_HINT_TIMES, TURN_HINT_TIMES + 1, 99, -1, NaN, Infinity]) assert.equal(turnHintDue(n), false, String(n))
})
