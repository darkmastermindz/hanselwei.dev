import { test } from 'node:test'
import assert from 'node:assert/strict'
import { foldMode, watchFold, FLAT_QUERY } from '../../utils/foldMode.mjs'
import { chapterOf, neighbours, turnDirection } from '../../utils/pageTurn.mjs'

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
  assert.deepEqual(foldMode({ ...base, iphone: true, width: 382, height: 580 }), { mode: null, device: null, vars: {} })
})

test('no other iPhone is taken for iPhone Duo, upright or sideways', () => {
  for (const [w, h] of [[320, 568], [375, 667], [390, 844], [393, 852], [402, 874], [430, 932], [440, 956]]) {
    assert.deepEqual(foldMode({ ...base, iphone: true, width: w, height: h }), { mode: null, device: null, vars: {} })
    assert.deepEqual(foldMode({ ...base, iphone: true, width: h, height: w }), { mode: null, device: null, vars: {} })
  }
})

test('an unfolded Android foldable (the flat query) is open flat; anything else is unchanged', () => {
  assert.equal(foldMode({ ...base, flat: true, width: 984, height: 1016 }).mode, 'flat')
  assert.deepEqual(foldMode({ ...base, width: 1280, height: 800 }), { mode: null, device: null, vars: {} })
  assert.equal(foldMode({ ...base, posture: 'continuous', width: 412, height: 915 }).mode, null)
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
