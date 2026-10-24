// Foldables and iPhone Duo (README "Foldables"): the layout changes with how the screen is folded,
// nothing a person reads or taps sits on the fold, and in book the pages turn like a book's.
//
// The fold is emulated through the DevTools protocol: a display feature on the device metrics,
// which Chromium reports to the page as two viewport segments (what Chrome, Samsung Internet and
// Safari's preview flag report on a real foldable), or the device posture alone (what Safari's
// posture flag reports on iPhone Duo, with no segments). Both apply live, without a reload.
import { expect, test } from '@playwright/test'

const FOLD = 'Galaxy Z Fold 7' // book when folded (a crease down the middle)
const FOLD_WIDE = 'Galaxy Z Fold 7 landscape' // tabletop when folded (a crease across)
const FLIP = 'Galaxy Z Flip 7' // tabletop
const DUO = 'iPhone Duo' // inner screen upright: tabletop when folded
const DUO_WIDE = 'iPhone Duo landscape' // inner screen sideways: book when folded
const FOLDABLES = new Set([FOLD, FOLD_WIDE, FLIP])

test.beforeEach(async ({ page }) => {
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
})

const open = async (page, path) => {
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  expect(await page.evaluate(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__)), 'the app is running').toBe(true)
}

const metrics = (testInfo, extra = {}) => {
  const { viewport, deviceScaleFactor } = testInfo.project.use
  return { ...viewport, deviceScaleFactor, mobile: true, ...extra }
}

// Fold the screen with a known fold: 'horizontal' is a crease across (tabletop), 'vertical' one
// down the middle (book). mask is the hinge's width; seamless folds have none.
const fold = async (page, testInfo, orientation, mask = 0) => {
  const { viewport } = testInfo.project.use
  const cdp = await page.context().newCDPSession(page)
  const length = orientation === 'horizontal' ? viewport.height : viewport.width
  await cdp.send('Emulation.setDeviceMetricsOverride', metrics(testInfo, { displayFeature: { orientation, offset: Math.round(length / 2 - mask / 2), maskLength: mask } }))
  await page.waitForTimeout(400)
  return cdp
}

// Folded, but only the posture is known (Safari's Device Posture flag on iPhone Duo)
const foldPostureOnly = async page => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setDevicePostureOverride', { posture: { type: 'folded' } })
  await page.waitForTimeout(400)
  return cdp
}

const unfold = async (page, testInfo, cdp) => {
  await cdp.send('Emulation.setDeviceMetricsOverride', metrics(testInfo))
  await cdp.send('Emulation.clearDevicePostureOverride').catch(() => {})
  await page.waitForTimeout(400)
}

const foldOf = page =>
  page.evaluate(() => {
    const root = document.documentElement
    const px = name => parseFloat(root.style.getPropertyValue(`--${name}`))
    return {
      mode: root.dataset.fold ?? null,
      device: root.dataset.device ?? null,
      topEnd: px('fold-top-end'),
      bottomStart: px('fold-bottom-start'),
      leftEnd: px('fold-left-end'),
      rightStart: px('fold-right-start'),
      crease: px('crease')
    }
  })

// Everything a person reads or taps that shows on the fold (half the crease either side of it),
// unless something opaque covers it there (the menu, or the hero in tabletop). One line per
// thing, so a failure says what.
const onFold = page =>
  page.evaluate(() => {
    const root = document.documentElement
    const px = name => parseFloat(root.style.getPropertyValue(`--${name}`))
    const across = root.dataset.fold === 'tabletop'
    const half = px('crease') / 2
    const band = across ? [px('fold-top-end') - half, px('fold-bottom-start') + half] : [px('fold-left-end') - half, px('fold-right-start') + half]
    const found = []
    const check = (el, rect, what) => {
      if (!rect.width || !rect.height) return
      const [start, end] = across ? [rect.top, rect.bottom] : [rect.left, rect.right]
      if (end <= band[0] || start >= band[1]) return
      if (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return
      const mid = (Math.max(start, band[0]) + Math.min(end, band[1])) / 2
      const [x, y] = across
        ? [(Math.max(rect.left, 0) + Math.min(rect.right, innerWidth)) / 2, mid]
        : [mid, (Math.max(rect.top, 0) + Math.min(rect.bottom, innerHeight)) / 2]
      // Hidden there if what's on top at that point isn't it (or inside it)
      const top = document.elementFromPoint(x, y)
      if (top && !el.contains(top) && !top.contains(el)) return
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
      for (const r of range.getClientRects()) check(n.parentElement, r, `"${n.textContent.trim().slice(0, 30)}"`)
    }
    for (const el of document.querySelectorAll('a, button, [role="tab"], .about-card, .token')) {
      if (visible(el)) check(el, el.getBoundingClientRect(), `<${el.tagName.toLowerCase()} class="${el.className?.baseVal ?? el.className}">`)
    }
    return found
  })

const box = (page, selector) => page.locator(selector).first().evaluate(el => el.getBoundingClientRect().toJSON())

const scrollBy = async (page, y) => {
  await page.evaluate(y => scrollBy(0, y), y)
  await page.waitForTimeout(200)
}

test.describe('folded part-way', () => {
  test.beforeEach(({}, testInfo) => test.skip(!FOLDABLES.has(testInfo.project.name), 'foldables only'))

  test('tabletop home: coin and name on top, card and links below, menu along the bottom, nothing on the fold', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === FOLD, 'folds the other way')
    await open(page, '/')
    for (const mask of [0, 40]) {
      await fold(page, testInfo, 'horizontal', mask)
      const f = await foldOf(page)
      expect(f.mode).toBe('tabletop')
      const hero = await box(page, '.home__intro')
      const coin = await box(page, '.token')
      const card = await box(page, '.about-card')
      const nav = await box(page, '.app-nav')
      expect(Math.max(hero.bottom, coin.bottom), `the hero ends above the fold (hinge ${mask}px)`).toBeLessThanOrEqual(f.topEnd)
      expect(card.top, `the card starts below the fold (hinge ${mask}px)`).toBeGreaterThanOrEqual(f.bottomStart)
      expect(nav.bottom, 'the menu is along the bottom').toBeCloseTo(testInfo.project.use.viewport.height, 0)
      expect(await onFold(page), `nothing on the fold (hinge ${mask}px)`).toEqual([])
      // The card and links scroll under the hero, never onto the fold
      await scrollBy(page, 300)
      expect(await onFold(page), `nothing on the fold, scrolled (hinge ${mask}px)`).toEqual([])
      await page.evaluate(() => scrollTo(0, 0))
    }
  })

  test('book home: coin, name and menu on the left page, card and links on the right', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'folds the other way')
    await open(page, '/')
    await fold(page, testInfo, 'vertical')
    const f = await foldOf(page)
    expect(f.mode).toBe('book')
    expect((await box(page, '.home__hero')).right).toBeLessThanOrEqual(f.leftEnd)
    expect((await box(page, '.app-nav')).right, 'the menu keeps to the left page').toBeLessThanOrEqual(f.leftEnd)
    expect((await box(page, '.home__deck')).left).toBeGreaterThanOrEqual(f.rightStart)
    expect(await onFold(page)).toEqual([])
    await scrollBy(page, 400)
    expect(await onFold(page), 'nothing on the fold, scrolled').toEqual([])
  })

  for (const path of ['/bio', '/gear/outdoor', '/blog']) {
    test(`${path}: reading on one half, the menu on the other, nothing on the fold`, async ({ page }, testInfo) => {
      await open(page, path)
      const book = testInfo.project.name === FOLD
      await fold(page, testInfo, book ? 'vertical' : 'horizontal')
      const f = await foldOf(page)
      const title = await box(page, '.page h1, .page-title')
      const nav = await box(page, '.app-nav')
      if (book) {
        expect(nav.right, 'the menu down the left page').toBeLessThanOrEqual(f.leftEnd)
        expect(title.left, 'reading on the right page').toBeGreaterThanOrEqual(f.rightStart)
      } else {
        expect(title.bottom, 'reading on the top half').toBeLessThanOrEqual(f.topEnd)
        expect(nav.top, 'the menu on the bottom half, over the fold').toBeLessThanOrEqual(f.topEnd)
        expect(nav.bottom).toBeCloseTo(testInfo.project.use.viewport.height, 0)
        expect((await box(page, '.app-nav a')).top, 'the menu links below the fold').toBeGreaterThanOrEqual(f.bottomStart)
      }
      expect(await onFold(page), 'at the top').toEqual([])
      await scrollBy(page, 600)
      expect(await onFold(page), 'scrolled').toEqual([])
      // The end of the page can still be read: scrolled to the bottom, the footer is above the menu
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(200)
      const footer = await box(page, '.site-footer')
      if (!book) expect(footer.bottom, 'the footer clears the menu').toBeLessThanOrEqual(f.topEnd + 1)
      expect(await onFold(page), 'at the bottom').toEqual([])
    })
  }

  test('folding and unfolding re-flows the page without a reload', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'one device is enough')
    await open(page, '/')
    await page.evaluate(() => (window.__sameDocument = true))
    expect((await foldOf(page)).mode).toBe('flat')
    const cdp = await fold(page, testInfo, 'vertical')
    expect((await foldOf(page)).mode).toBe('book')
    expect((await box(page, '.home__deck')).left).toBeGreaterThan(testInfo.project.use.viewport.width / 2)
    await fold(page, testInfo, 'horizontal')
    expect((await foldOf(page)).mode).toBe('tabletop')
    await unfold(page, testInfo, cdp)
    expect((await foldOf(page)).mode).toBe('flat')
    expect(await page.evaluate(() => window.__sameDocument), 'no reload').toBe(true)
  })
})

test.describe('turning the page in book', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== FOLD, 'book on one device'))

  // The page-turn animations seen since the last call, checked every frame (view transitions
  // show up in getAnimations; a turn is over in under a second)
  const watchTurns = page =>
    page.evaluate(() => {
      window.__turns = new Set()
      const tick = () => {
        for (const a of document.getAnimations()) if (a.animationName?.startsWith('page-')) window.__turns.add(a.animationName)
        requestAnimationFrame(tick)
      }
      if (!window.__watching) tick()
      window.__watching = true
    })
  const turned = async page => {
    await page.waitForTimeout(1500)
    const seen = await page.evaluate(() => [...window.__turns].sort())
    await page.evaluate(() => window.__turns.clear())
    return seen
  }

  test('the corner turns to the next chapter forward, and back turns it back', async ({ page }, testInfo) => {
    await open(page, '/')
    await fold(page, testInfo, 'vertical')
    const corner = page.locator('.book-pager__corner--next')
    await expect(corner).toBeVisible()
    expect((await corner.boundingBox()).x, 'on the right page').toBeGreaterThanOrEqual((await foldOf(page)).rightStart)
    await watchTurns(page)
    await corner.click()
    expect(await turned(page)).toEqual(['page-covered', 'page-land-left', 'page-lift-right'])
    await expect(page).toHaveURL(/\/projects$/)
    expect(await page.evaluate(() => document.documentElement.dataset.pageTurn ?? null), 'done turning').toBe(null)
    // Turned, the new page reads on the right page and the menu is on the left
    expect((await box(page, '.page')).left).toBeGreaterThanOrEqual((await foldOf(page)).rightStart)
    expect(await onFold(page)).toEqual([])

    await page.locator('.book-pager__corner--prev').click()
    expect(await turned(page)).toEqual(['page-covered', 'page-land-right', 'page-lift-left'])
    await expect(page).toHaveURL(/\/$/)
  })

  test('folding into book shows a hint the first few times, until a page is turned', async ({ page }, testInfo) => {
    await open(page, '/')
    const hint = page.locator('.book-pager__hint')
    await expect(hint).toBeHidden()
    const cdp = await fold(page, testInfo, 'vertical')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText('Pages turn like a book')
    expect((await hint.boundingBox()).x, 'on the right page').toBeGreaterThanOrEqual((await foldOf(page)).rightStart)
    await expect(page.locator('.book-pager__corner--next')).toHaveClass(/is-hinting/)
    // Turning a page puts it away
    await page.locator('.book-pager__corner--next').click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(hint).toBeHidden()
    // Shown on the next two folds, then not again
    for (const expected of [true, true, false]) {
      await unfold(page, testInfo, cdp)
      await fold(page, testInfo, 'vertical')
      if (expected) await expect(hint).toBeVisible()
      else {
        await page.waitForTimeout(500)
        await expect(hint).toBeHidden()
      }
    }
  })

  test('the menu turns pages too, and pages change as usual when not folded', async ({ page }, testInfo) => {
    await open(page, '/')
    const cdp = await fold(page, testInfo, 'vertical')
    await watchTurns(page)
    await page.locator('.app-nav a[href="/bio"]').click()
    expect(await turned(page)).toContain('page-lift-right')
    await expect(page).toHaveURL(/\/bio$/)
    await unfold(page, testInfo, cdp)
    await expect(page.locator('.book-pager')).toBeHidden()
    await page.locator('.app-nav a[href="/blog"]').click()
    await expect(page).toHaveURL(/\/blog$/)
    expect(await turned(page), 'no page turn').toEqual([])
    expect(await page.evaluate(() => document.documentElement.dataset.pageTurn ?? null)).toBe(null)
  })
})

test.describe('iPhone Duo', () => {
  test('open, held sideways: two columns, like Apple suggests for the inner screen', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DUO_WIDE, 'the inner screen sideways')
    await open(page, '/')
    expect(await foldOf(page)).toMatchObject({ mode: 'flat', device: 'iphone-duo' })
    const hero = await box(page, '.home__hero')
    const card = await box(page, '.about-card')
    expect(card.left).toBeGreaterThanOrEqual(hero.right - 1)
  })

  test('open, upright, and the outer screen: the usual layout', async ({ page }, testInfo) => {
    test.skip(![DUO, 'iPhone Duo Cover'].includes(testInfo.project.name), 'upright and closed')
    await open(page, '/')
    const f = await foldOf(page)
    expect(f.mode).toBe(null)
    expect(f.device).toBe(testInfo.project.name === DUO ? 'iphone-duo' : 'iphone-duo-cover')
  })

  test('the front screen: a laptop shuts its lid to show the QR code to the site', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iPhone Duo Cover', 'the front screen')
    await open(page, '/')
    expect((await foldOf(page)).device).toBe('iphone-duo-cover')
    const lid = page.locator('.duo-lid')
    await expect(lid).toBeVisible()
    await expect(lid.locator('.duo-lid__qr path')).toHaveAttribute('d', /^M0 0h7v1h-7z/) // a QR code's corner finder
    await expect(lid.locator('figcaption a')).toHaveAttribute('href', 'https://hanselwei.dev')
    await expect(page.locator('.duo-badge')).toBeVisible()
    await expect(page.locator('.fold-pong__play'), 'the game is for the inner screen').toBeHidden()
    // Once the animation is over the lid lies facing you, square on, so the code can be scanned
    await page.waitForTimeout(4200)
    const qr = await lid.locator('.duo-lid__qr').boundingBox()
    expect(Math.abs(qr.width - qr.height), 'not squashed by the tilt').toBeLessThan(2)
  })

  test('the inner screen: Fold Pong, with the fold as the net', async ({ page }, testInfo) => {
    test.skip(![DUO, DUO_WIDE].includes(testInfo.project.name), 'the inner screen')
    await open(page, '/')
    await expect(page.locator('.duo-badge')).toBeVisible()
    await expect(page.locator('.duo-lid')).toBeHidden()
    const play = page.locator('.fold-pong__play')
    await play.click()
    const court = page.getByRole('dialog', { name: 'Fold Pong' })
    await expect(court).toBeVisible()
    await expect(court.locator('canvas')).toBeVisible()
    await expect(court.locator('.fold-pong__score')).toHaveText('You 0 – 0 Computer')
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
    // Left alone, the game plays on and someone scores
    await expect(court.locator('.fold-pong__score')).not.toHaveText('You 0 – 0 Computer', { timeout: 20_000 })
    // A finger on the court moves your paddle (nothing breaks, the page doesn't scroll)
    const box = await court.locator('canvas').boundingBox()
    await page.mouse.move(box.width * 0.1, box.height * 0.2)
    await page.mouse.down()
    await page.mouse.move(box.width * 0.1, box.height * 0.8, { steps: 5 })
    await page.mouse.up()
    expect(await page.evaluate(() => scrollY)).toBe(0)
    // Escape closes it and puts you back on the button
    await page.keyboard.press('Escape')
    await expect(court).toBeHidden()
    await expect(play).toBeFocused()
  })

  // Safari's Device Posture flag says "folded" but not where: the fold is taken as the middle
  test('folded with only the posture known: book sideways, tabletop upright, nothing on the middle', async ({ page }, testInfo) => {
    test.skip(![DUO, DUO_WIDE].includes(testInfo.project.name), 'the inner screen')
    for (const path of ['/', '/bio']) {
      await open(page, path)
      await foldPostureOnly(page)
      const f = await foldOf(page)
      const { width, height } = testInfo.project.use.viewport
      if (testInfo.project.name === DUO_WIDE) expect(f).toMatchObject({ mode: 'book', leftEnd: width / 2, rightStart: width / 2 })
      else expect(f).toMatchObject({ mode: 'tabletop', topEnd: height / 2, bottomStart: height / 2 })
      expect(await onFold(page), `${path}: nothing on the middle`).toEqual([])
      await scrollBy(page, 400)
      expect(await onFold(page), `${path}: nothing on the middle, scrolled`).toEqual([])
    }
  })
})

test('unfolded flat, a Fold is two columns: hero beside the card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== FOLD, 'the unfolded Fold')
  await open(page, '/')
  const hero = await box(page, '.home__hero')
  const card = await box(page, '.about-card')
  expect(card.left).toBeGreaterThanOrEqual(hero.right - 1)
})

// The foldable layouts are only for foldables: no other phone or tablet gets one, unfolded
test('no other device gets a foldable layout', async ({ page }, testInfo) => {
  await open(page, '/')
  const f = await foldOf(page)
  if (f.mode) expect(testInfo.project.name, `only foldables get the ${f.mode} layout`).toMatch(/Fold|Flip|Duo/)
  expect(['tabletop', 'book'], 'nothing is folded').not.toContain(f.mode)
  if (f.device) expect(testInfo.project.name).toMatch(/^iPhone Duo/)
  // iPhone Duo's own touches stay hidden everywhere else
  if (!f.device) {
    for (const extra of ['.duo-lid', '.duo-badge', '.fold-pong__play']) await expect(page.locator(extra), extra).toBeHidden()
  }
})
