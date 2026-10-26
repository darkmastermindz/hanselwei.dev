// Foldables and iPhone Duo (README "Foldables"): the layout changes with how the screen is folded,
// nothing a person reads or taps sits on the fold, and in book the pages turn like a book's.
//
// The fold is emulated through the DevTools protocol: a display feature on the device metrics,
// which Chromium reports to the page as two viewport segments (what Chrome, Samsung Internet and
// Safari's preview flag report on a real foldable), or the device posture alone (what Safari's
// posture flag reports on iPhone Duo, with no segments). Both apply live, without a reload.
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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
  // Headless Chromium sometimes holds the first view transition after a DevTools metrics change
  // for 4s (a bare startViewTransition too; never without the override): take that one here,
  // not in a page turn
  await page.evaluate(() => document.startViewTransition?.(() => {}).finished)
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
    // Seamless, and with a hinge (34px, like Surface Duo in Chrome's device mode)
    for (const mask of [0, 34]) {
      await fold(page, testInfo, 'vertical', mask)
      // Chromium fires nothing when only the hinge changes (same size, same number of segments),
      // so a fresh page reads it
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
      const f = await foldOf(page)
      expect(f.mode).toBe('book')
      expect(f.rightStart - f.leftEnd, 'the hinge is kept clear').toBe(mask)
      expect((await box(page, '.home__hero')).right).toBeLessThanOrEqual(f.leftEnd)
      expect((await box(page, '.app-nav')).right, 'the menu keeps to the left page').toBeLessThanOrEqual(f.leftEnd)
      expect((await box(page, '.home__deck')).left).toBeGreaterThanOrEqual(f.rightStart)
      expect(await onFold(page), `nothing on the fold (hinge ${mask}px)`).toEqual([])
      await scrollBy(page, 400)
      expect(await onFold(page), `nothing on the fold, scrolled (hinge ${mask}px)`).toEqual([])
      await page.evaluate(() => scrollTo(0, 0))
    }
  })

  test('turning a folded Fold sideways goes from book to tabletop, with the fold where it now is', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'one device is enough')
    const { width, height } = testInfo.project.use.viewport
    for (const path of ['/', '/bio']) {
      await open(page, path)
      const cdp = await fold(page, testInfo, 'vertical')
      expect((await foldOf(page)).mode).toBe('book')
      // Sideways: the screen is wider than tall and the crease now runs across
      await cdp.send('Emulation.setDeviceMetricsOverride', metrics(testInfo, { width: height, height: width, displayFeature: { orientation: 'horizontal', offset: Math.round(width / 2), maskLength: 0 } }))
      await page.waitForTimeout(400)
      const f = await foldOf(page)
      expect(f).toMatchObject({ mode: 'tabletop', topEnd: Math.round(width / 2), bottomStart: Math.round(width / 2) })
      expect(Number.isNaN(f.leftEnd), 'no book variables left behind').toBe(true)
      expect(await onFold(page), `${path}: nothing on the fold`).toEqual([])
      // And back upright
      await fold(page, testInfo, 'vertical')
      expect((await foldOf(page)).mode).toBe('book')
      expect(await onFold(page), `${path}: nothing on the fold, upright again`).toEqual([])
    }
  })

  test('a resize that changes nothing leaves <html> alone (Android fires them as the toolbars hide)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FOLD, 'one device is enough')
    await open(page, '/bio')
    await fold(page, testInfo, 'vertical')
    const changes = await page.evaluate(async () => {
      let n = 0
      const watch = new MutationObserver(records => (n += records.length))
      watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-fold', 'data-device', 'style'] })
      for (let i = 0; i < 20; i++) dispatchEvent(new Event('resize'))
      await new Promise(resolve => setTimeout(resolve, 50))
      watch.disconnect()
      return n
    })
    expect(changes).toBe(0)
  })

  test('tabletop home: keyboard focus never lands under the hero or the menu', async ({ page }, testInfo) => {
    test.skip(![FOLD_WIDE, FLIP].includes(testInfo.project.name), 'tabletop')
    await open(page, '/')
    await fold(page, testInfo, 'horizontal')
    const hidden = []
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      const h = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const r = el.getBoundingClientRect()
        const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1)
        const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)
        const top = document.elementFromPoint(x, y)
        return top && (el.contains(top) || top.contains(el)) ? null : `${el.textContent.trim().slice(0, 30)} under ${top?.className}`
      })
      if (h) hidden.push(h)
    }
    expect(hidden).toEqual([])
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
    // Until a turn has been seen and is over, or 6s: headless Chromium can hold a turn for 4s
    // (see fold), past a fixed wait
    await page.waitForFunction(() => window.__turns.size && !document.documentElement.dataset.pageTurn, null, { timeout: 6000 }).catch(() => {})
    await page.waitForTimeout(300)
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

  // Where the page is scrolled on every frame of a turn (the browser draws none while it waits
  // for the new page, so whatever is on screen in the first frame is what turns)
  const watchScroll = page =>
    page.evaluate(() => {
      window.__scrolls = []
      const tick = () => {
        const root = document.documentElement
        if ('pageTurned' in root.dataset) window.__scrolls.push(Math.round(scrollY))
        requestAnimationFrame(tick)
      }
      tick()
    })
  const scrollsDuringTurn = page => page.evaluate(() => [...new Set(window.__scrolls.splice(0))])
  // A turn has started and is over (polled: headless Chromium can hold a turn for 4s, see fold)
  const turnOver = page =>
    expect.poll(() => page.evaluate(() => window.__scrolls.length > 0 && !document.documentElement.dataset.pageTurn), { timeout: 8000 }).toBe(true)

  test('a long page scrolled down: the new page turns in where it will stay, back and forward keep their place', async ({ page }, testInfo) => {
    await open(page, '/terms')
    await fold(page, testInfo, 'vertical')
    await page.evaluate(() => scrollTo(0, 900))
    await page.waitForTimeout(300)
    await watchScroll(page)
    await page.locator('.book-pager__corner--prev').click()
    await turnOver(page)
    await expect(page).toHaveURL(/\/bio$/)
    expect(await scrollsDuringTurn(page), 'the new page turns in at the top, no jump').toEqual([0])
    // The leaving right page is seen from the middle of the screen as it was read, not the middle
    // of the whole page
    const middle = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--turn-old-middle'))
    expect(parseFloat(middle)).toBeCloseTo(testInfo.project.use.viewport.height / 2 + 900, -2)

    await page.goBack()
    await turnOver(page)
    await expect(page).toHaveURL(/\/terms$/)
    expect(await scrollsDuringTurn(page), 'back turns in at the place it was left, no jump').toEqual([900])
    expect(await page.evaluate(() => scrollY)).toBe(900)
    expect(await page.evaluate(() => ({ ...document.documentElement.dataset })), 'done turning').not.toHaveProperty('pageTurned')
  })

  test('going somewhere else mid-turn ends on the last page, with nothing left turning', async ({ page }, testInfo) => {
    const warnings = []
    page.on('console', message => /view-transition|InvalidState/i.test(message.text()) && warnings.push(message.text()))
    page.on('pageerror', error => warnings.push(error.message))
    await open(page, '/')
    await fold(page, testInfo, 'vertical')
    for (const delay of [0, 50, 300]) {
      const here = await page.evaluate(() => location.pathname)
      const [first, last] = ['/projects', '/bio', '/gear', '/blog', '/'].filter(p => p !== here)
      await page.evaluate(
        async ([first, last, delay]) => {
          const router = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$router
          router.push(first)
          await new Promise(resolve => setTimeout(resolve, delay))
          router.push(last)
        },
        [first, last, delay]
      )
      // Polled: headless Chromium can hold a turn for 4s (see fold)
      await expect.poll(() => page.evaluate(() => location.pathname), { message: `${delay}ms apart`, timeout: 8000 }).toBe(last)
      await expect
        .poll(() => page.evaluate(() => ({ turn: document.documentElement.dataset.pageTurn ?? null, pages: document.querySelectorAll('.page, .home').length })), { timeout: 8000 })
        .toEqual({ turn: null, pages: 1 })
    }
    expect(warnings).toEqual([])
  })

  test('the corner links are named for screen readers by the chapter they turn to', async ({ page }, testInfo) => {
    await open(page, '/blog')
    await fold(page, testInfo, 'vertical')
    const pager = page.getByRole('navigation', { name: 'Chapters' })
    await expect(pager.getByRole('link', { name: 'Previous chapter: Projects', exact: true })).toBeVisible()
    await expect(pager.getByRole('link', { name: 'Next chapter: Gear Lists', exact: true })).toBeVisible()
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
    // Two even columns, the gap between them on the hinge (the middle), kept clear
    const middle = testInfo.project.use.viewport.width / 2
    expect(hero.right, 'the hero ends before the hinge').toBeLessThanOrEqual(middle - 16)
    expect((await box(page, '.home__deck')).left, 'the deck starts after it').toBeGreaterThanOrEqual(middle + 16)
    expect(hero.right - hero.left).toBeCloseTo((await box(page, '.home__deck')).width, 0)
  })

  // iOS's innerWidth/innerHeight are what's visible: they shrink when zoomed in or typing. The
  // layout follows the page's size, so iPhone Duo sideways keeps its two columns.
  test('open, held sideways: zoomed in, still two columns', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== DUO_WIDE, 'the inner screen sideways')
    await page.addInitScript(() => {
      Object.defineProperty(window, 'innerWidth', { get: () => 420, configurable: true })
      Object.defineProperty(window, 'innerHeight', { get: () => 260, configurable: true })
    })
    await open(page, '/')
    await page.evaluate(() => dispatchEvent(new Event('resize')))
    expect(await foldOf(page)).toMatchObject({ mode: 'flat', device: 'iphone-duo' })
  })

  // Half-folded, Safari moves to the outer screen; with the posture flag on it still says folded
  test('the outer screen says folded: no fold on it, the usual layout', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iPhone Duo Cover', 'the outer screen')
    await open(page, '/')
    await foldPostureOnly(page)
    expect(await foldOf(page)).toMatchObject({ mode: null, device: 'iphone-duo-cover' })
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

// Folded, the menu moves to the bottom (tabletop) or the side (book) and the hero is fixed: still
// no accessibility problems (the same rules as tests/e2e/a11y.spec.mjs)
test('folded: no accessibility violations on home and Bio, in tabletop and in book', async ({ page }, testInfo) => {
  test.skip(![FOLD, FOLD_WIDE].includes(testInfo.project.name), 'the Fold, both ways')
  const orientation = testInfo.project.name === FOLD ? 'vertical' : 'horizontal'
  for (const path of ['/', '/bio']) {
    await open(page, path)
    await fold(page, testInfo, orientation)
    expect((await foldOf(page)).mode).toBe(orientation === 'vertical' ? 'book' : 'tabletop')
    // The fold's own hint (book) fades in and out: check once it's gone
    await expect(page.locator('.book-pager__hint')).toBeHidden({ timeout: 8000 })
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).disableRules(['label-content-name-mismatch']).analyze()
    const found = violations.flatMap(v => v.nodes.map(n => `${v.id}: ${n.target.join(' ')} — ${(n.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 200)}`))
    expect(found, `${path}, folded`).toEqual([])
  }
})

// Desktop Chrome: a window dragged near-square is not an unfolded foldable (the flat layout wants
// a touch screen and no mouse: utils/foldMode.mjs FLAT_QUERY)
test('a near-square desktop window is not a foldable', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== FOLD, 'one run is enough')
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL, viewport: { width: 900, height: 900 }, isMobile: false, hasTouch: false })
  const page = await context.newPage()
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => document.documentElement.dataset.fold ?? null)).toBe(null)
  await context.close()
})

// The foldable layouts are only for foldables: no other phone or tablet gets one, unfolded
test('no other device gets a foldable layout', async ({ page }, testInfo) => {
  await open(page, '/')
  const f = await foldOf(page)
  if (f.mode) expect(testInfo.project.name, `only foldables get the ${f.mode} layout`).toMatch(/Fold|Flip|Duo/)
  expect(['tabletop', 'book'], 'nothing is folded').not.toContain(f.mode)
  if (f.device) expect(testInfo.project.name).toMatch(/^iPhone Duo/)
  // The iPad's 📖 book button shows on no phone, foldable or iPhone Duo
  await expect(page.locator('.book-toggle')).toBeHidden()
  // iPhone Duo's own touches stay hidden everywhere else
  if (!f.device) {
    for (const extra of ['.duo-lid', '.duo-badge', '.fold-pong__play']) await expect(page.locator(extra), extra).toBeHidden()
  }
})

// iPad held sideways (README "Foldables"): no fold, but the menu's 📖 button lays the site out as
// a book, like a foldable folded down the middle, and turns it back. Run on one project, with an
// iPad's page size and Safari's user agent (iPad Safari says it's a Mac; touch tells them apart).
const IPAD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15'
const IPAD = { width: 1180, height: 820 } // iPad Air 11-inch, sideways

test.describe('iPad book layout', () => {
  test.use({ userAgent: IPAD_UA, viewport: IPAD, screen: IPAD, deviceScaleFactor: 2, isMobile: false, hasTouch: true })
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== FOLD, 'one project is enough'))

  test('the 📖 button turns the book layout on and off, and it stays chosen', async ({ page }) => {
    await open(page, '/')
    const toggle = page.locator('.book-toggle')
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(await foldOf(page)).toMatchObject({ mode: null, device: 'ipad' })

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    const f = await foldOf(page)
    expect(f.mode).toBe('book')
    expect(f.leftEnd).toBe(IPAD.width / 2)
    expect((await box(page, '.home__hero')).right).toBeLessThanOrEqual(f.leftEnd)
    expect((await box(page, '.app-nav')).right, 'the menu keeps to the left page').toBeLessThanOrEqual(f.leftEnd)
    expect((await box(page, '.home__deck')).left).toBeGreaterThanOrEqual(f.rightStart)
    expect(await onFold(page), 'nothing on the spine').toEqual([])
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).disableRules(['label-content-name-mismatch']).analyze()
    expect(violations.map(v => v.id)).toEqual([])

    // Chosen before: a new visit opens as a book, on any page
    await open(page, '/projects')
    expect((await foldOf(page)).mode).toBe('book')
    expect((await box(page, '.app-nav')).right).toBeLessThanOrEqual(IPAD.width / 2)
    expect(await onFold(page), 'nothing on the spine, another page').toEqual([])

    // Upright: the usual layout and no button; sideways again, the book is back
    await page.setViewportSize({ width: IPAD.height, height: IPAD.width })
    await page.waitForTimeout(400)
    expect(await foldOf(page)).toMatchObject({ mode: null, device: null })
    await expect(page.locator('.book-toggle')).toBeHidden()
    await page.setViewportSize(IPAD)
    await page.waitForTimeout(400)
    expect((await foldOf(page)).mode).toBe('book')

    // Off again, and it stays off
    await page.locator('.book-toggle').click()
    expect((await foldOf(page)).mode).toBe(null)
    await open(page, '/')
    expect((await foldOf(page)).mode).toBe(null)
    await expect(page.locator('.book-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  test('in the book layout the corner turns the page, like on a foldable', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('book:chosen', '1'))
    await open(page, '/')
    expect((await foldOf(page)).mode).toBe('book')
    await page.locator('.book-pager__corner--next').click()
    await expect(page).toHaveURL(/\/projects$/)
    expect((await foldOf(page)).mode).toBe('book')
  })
})

test.describe('a Mac (no touch screen)', () => {
  test.use({ userAgent: IPAD_UA, viewport: IPAD, screen: IPAD, deviceScaleFactor: 2, isMobile: false, hasTouch: false })
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== FOLD, 'one project is enough'))

  test('gets no 📖 button and no book layout, even if it was chosen on an iPad', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('book:chosen', '1'))
    await open(page, '/')
    expect(await foldOf(page)).toMatchObject({ mode: null, device: null })
    await expect(page.locator('.book-toggle')).toBeHidden()
  })
})
