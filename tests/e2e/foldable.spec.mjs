// Foldables (README "Foldables"): the layout changes with how the phone is folded, and nothing a
// person reads or taps sits on the fold. The fold is emulated through the DevTools protocol (a
// display feature on the device metrics), which Chromium reports to the page as two viewport
// segments, the same as a real foldable folded part-way. It applies live, without a reload.
import { expect, test } from '@playwright/test'

const FOLD = 'Galaxy Z Fold 7' // book when folded (a crease down the middle)
const FOLD_WIDE = 'Galaxy Z Fold 7 landscape' // tabletop when folded (a crease across)
const FLIP = 'Galaxy Z Flip 7' // tabletop
const FOLDABLES = new Set([FOLD, FOLD_WIDE, FLIP])

// The flat two-column layout (pages/index.vue): a near-square touch screen
const FLAT_QUERY = '(min-width: 600px) and (max-width: 1100px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4) and (pointer: coarse) and (hover: none)'

test.beforeEach(async ({ page }) => {
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
})

const open = async (page, path) => {
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  expect(await page.evaluate(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__)), 'the app is running').toBe(true)
}

// Fold the screen: 'horizontal' is a crease across (tabletop), 'vertical' one down the middle
// (book). mask is the hinge's width; seamless folds have none.
const fold = async (page, testInfo, orientation, mask = 0) => {
  const { viewport, deviceScaleFactor } = testInfo.project.use
  const cdp = await page.context().newCDPSession(page)
  const length = orientation === 'horizontal' ? viewport.height : viewport.width
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    ...viewport,
    deviceScaleFactor,
    mobile: true,
    displayFeature: { orientation, offset: Math.round(length / 2 - mask / 2), maskLength: mask }
  })
  await page.waitForTimeout(400)
  return cdp
}

const unfold = async (page, testInfo, cdp) => {
  const { viewport, deviceScaleFactor } = testInfo.project.use
  await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor, mobile: true })
  await page.waitForTimeout(400)
}

const segments = page => page.evaluate(() => (window.viewport?.segments ?? []).map(s => ({ x: s.x, y: s.y, width: s.width, height: s.height })))

// Everything a person reads or taps that shows on the fold (the band between the segments, 8px
// either side), unless the menu covers it there. One line per thing, so a failure says what.
const onFold = page =>
  page.evaluate(() => {
    const [a, b] = window.viewport.segments
    const across = b.y > a.y // a crease across the screen (tabletop)
    const band = across ? [a.y + a.height - 8, b.y + 8] : [a.x + a.width - 8, b.x + 8]
    const found = []
    const covered = (x, y) => Boolean(document.elementFromPoint(x, y)?.closest('.app-nav'))
    const check = (rect, what) => {
      if (!rect.width || !rect.height) return
      const [start, end] = across ? [rect.top, rect.bottom] : [rect.left, rect.right]
      if (end <= band[0] || start >= band[1]) return
      // Out of view, or behind the menu, it can't be seen on the fold
      if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return
      const mid = (Math.max(start, band[0]) + Math.min(end, band[1])) / 2
      const [x, y] = across
        ? [(Math.max(rect.left, 0) + Math.min(rect.right, innerWidth)) / 2, mid]
        : [mid, (Math.max(rect.top, 0) + Math.min(rect.bottom, innerHeight)) / 2]
      if (covered(x, y)) return
      found.push(`${what} at ${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`)
    }
    const visible = el => {
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e)
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0 || e.getAttribute('aria-hidden') === 'true') return false
      }
      return true
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || !n.parentElement || !visible(n.parentElement)) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) check(r, `"${n.textContent.trim().slice(0, 30)}"`)
    }
    for (const el of document.querySelectorAll('a, button, [role="tab"], .about-card, .token')) {
      if (visible(el)) check(el.getBoundingClientRect(), `<${el.tagName.toLowerCase()} class="${el.className?.baseVal ?? el.className}">`)
    }
    return found
  })

const box = (page, selector) => page.locator(selector).first().evaluate(el => el.getBoundingClientRect().toJSON())

test.describe('folded part-way', () => {
  test.beforeEach(({}, testInfo) => test.skip(!FOLDABLES.has(testInfo.project.name), 'foldables only'))

  test('tabletop: the coin and name above the fold, the card and links below, nothing on it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === FOLD, 'folds the other way')
    await open(page, '/')
    for (const mask of [0, 40]) {
      await fold(page, testInfo, 'horizontal', mask)
      const [top, bottom] = await segments(page)
      expect(bottom.y, 'two stacked segments').toBeGreaterThan(top.y)
      const hero = await box(page, '.home__hero')
      const card = await box(page, '.about-card')
      expect(hero.bottom, `the hero ends above the fold (hinge ${mask}px)`).toBeLessThanOrEqual(top.y + top.height)
      expect(card.top, `the card starts below the fold (hinge ${mask}px)`).toBeGreaterThanOrEqual(bottom.y)
      expect(await onFold(page), `nothing on the fold (hinge ${mask}px)`).toEqual([])
    }
  })

  test('book: the coin and name on the left page, the card and links on the right', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'folds the other way')
    await open(page, '/')
    await fold(page, testInfo, 'vertical')
    const [left, right] = await segments(page)
    expect(right.x, 'two side-by-side segments').toBeGreaterThan(left.x)
    const hero = await box(page, '.home__hero')
    const deck = await box(page, '.home__deck')
    const nav = await box(page, '.app-nav')
    expect(hero.right).toBeLessThanOrEqual(left.x + left.width)
    expect(nav.right, 'the menu keeps to the left page').toBeLessThanOrEqual(left.x + left.width)
    expect(deck.left).toBeGreaterThanOrEqual(right.x)
    expect(await onFold(page)).toEqual([])
    // Scrolled down, the hero stays on the left page and the right page still keeps off the fold
    await page.evaluate(() => scrollTo(0, 400))
    await page.waitForTimeout(200)
    expect(await onFold(page), 'nothing on the fold, scrolled').toEqual([])
  })

  test('folding and unfolding re-flows the page without a reload', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'one device is enough')
    await open(page, '/')
    await page.evaluate(() => (window.__sameDocument = true))
    const mode = () => page.locator('.home').evaluate(el => getComputedStyle(el).display)
    const flat = await mode()
    const cdp = await fold(page, testInfo, 'vertical')
    expect(await page.evaluate(() => matchMedia('(horizontal-viewport-segments: 2)').matches)).toBe(true)
    expect(await box(page, '.home__deck').then(d => d.left)).toBeGreaterThan(testInfo.project.use.viewport.width / 2)
    await unfold(page, testInfo, cdp)
    expect(await mode()).toBe(flat)
    expect(await page.evaluate(() => window.__sameDocument), 'no reload').toBe(true)
  })

  for (const path of ['/bio', '/gear/outdoor', '/blog']) {
    test(`${path}: nothing on the fold, at the top or scrolled`, async ({ page }, testInfo) => {
      await open(page, path)
      const orientation = testInfo.project.name === FOLD ? 'vertical' : 'horizontal'
      await fold(page, testInfo, orientation)
      expect(await onFold(page), 'at the top').toEqual([])
      await page.evaluate(() => scrollTo(0, 600))
      await page.waitForTimeout(200)
      expect(await onFold(page), 'scrolled').toEqual([])
    })
  }
})

test('unfolded flat, a Fold is two columns: hero beside the card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== FOLD, 'the unfolded Fold')
  await open(page, '/')
  const hero = await box(page, '.home__hero')
  const card = await box(page, '.about-card')
  expect(card.left).toBeGreaterThanOrEqual(hero.right - 1)
})

// The flat two-column layout is only for an unfolded foldable: no phone or tablet matches it
// (and with no fold, the folded layouts never apply)
test('no other device gets a foldable layout', async ({ page }, testInfo) => {
  await open(page, '/')
  const matches = await page.evaluate(q => ({
    flat: matchMedia(q).matches,
    folded: matchMedia('(vertical-viewport-segments: 2), (horizontal-viewport-segments: 2)').matches
  }), FLAT_QUERY)
  expect(matches.folded).toBe(false)
  if (matches.flat) expect(testInfo.project.name, 'only foldables get the flat two-column layout').toMatch(/Fold|Flip|Duo/)
})
