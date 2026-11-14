// Touch scrolling on every Android device Playwright knows (playwright.config.mjs), with a finger:
// real touch events through the DevTools protocol, so the browser scrolls the page itself.
//
// Every test runs with a phantom "controller" like the ones Android phones report (a fingerprint
// reader or sensor hub, given the standard mapping by Chromium, its stick jumping to -1 and a
// button held down). That's what pinned pages in place before (plugins/navigation.client.js):
// with it present, a finger must still win.
import { expect, test } from '@playwright/test'

// The site's pages, with the ones long enough to scroll on most screens first
const PAGES = ['/', '/bio', '/terms', '/gear/outdoor', '/blog', '/projects', '/gear', '/credits']

test.beforeEach(async ({ page }) => {
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
  await page.addInitScript(() => {
    const t0 = performance.now()
    const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: i === 3, touched: i === 3, value: i === 3 ? 1 : 0 }))
    const phantom = () => ({
      id: 'uinput-fpc',
      index: 0,
      connected: true,
      mapping: 'standard',
      timestamp: performance.now(),
      buttons,
      axes: performance.now() - t0 < 1200 ? [0, 0, 0, 0] : [0, 0, 0, -1]
    })
    window.__gamepadReads = 0
    navigator.getGamepads = () => {
      window.__gamepadReads++
      return [phantom()]
    }
  })
})

// The page loaded and the app running, with the phantom pad's stick already stuck at -1. The app
// must really be running: a page whose scripts didn't run (a blocked script, a crash) scrolls fine
// and would pass every test without testing anything.
const open = async (page, path) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  expect(errors, 'no script errors').toEqual([])
  expect(await page.evaluate(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__)), 'the app is running').toBe(true)
  expect(await page.evaluate(() => window.__gamepadReads), 'the site reads the controller').toBeGreaterThan(0)
}

// A one-finger swipe from (x, y) by dy pixels (negative = finger moves up = page scrolls down)
const swipe = async (page, x, y, dy, dx = 0) => {
  const cdp = await page.context().newCDPSession(page)
  const steps = 12
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }] })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
  await page.waitForTimeout(500)
}

const scrollY = page => page.evaluate(() => Math.round(window.scrollY))
const room = page => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
const viewport = page => page.viewportSize()

for (const path of PAGES) {
  test(`${path} scrolls down and back up with a finger`, async ({ page }) => {
    await open(page, path)
    const { width, height } = viewport(page)
    const distance = Math.round(height * 0.4)
    const space = await room(page)
    test.skip(space < 40, 'fits on this screen: nothing to scroll')

    await swipe(page, width / 2, height * 0.7, -distance)
    const down = await scrollY(page)
    // A third of the swipe at least, or to the bottom when the page is only a little taller
    expect(down, 'a swipe up scrolls the page down').toBeGreaterThanOrEqual(Math.min(distance / 3, space - 2))
    await page.waitForTimeout(1000) // a stuck controller would pull it back by now
    expect(await scrollY(page), 'the page stays where the finger left it').toBeGreaterThanOrEqual(down)

    await swipe(page, width / 2, height * 0.3, distance)
    expect(await scrollY(page), 'a swipe down scrolls it back up').toBeLessThan(down)
  })

  test(`${path} doesn't scroll sideways`, async ({ page }) => {
    await open(page, path)
    const { width, height } = viewport(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'nothing wider than the screen').toBeLessThanOrEqual(width + 1)
    await swipe(page, width * 0.8, height / 2, 0, -width * 0.5)
    expect(await page.evaluate(() => Math.round(window.scrollX))).toBe(0)
  })
}

// Swipes that start on the home page's interactive parts still scroll the page (the coin's hold,
// the card's press-and-hold and swipes, the links' sparkles all listen to the same finger)
const STARTS = [
  ['the coin', '.token'],
  ['the About card', '.about-card'],
  ['a social link', '.flip-link'],
  ['the top menu', '.app-nav']
]
for (const [what, selector] of STARTS) {
  test(`a swipe starting on ${what} scrolls the home page`, async ({ page }) => {
    await open(page, '/')
    const { height } = viewport(page)
    const space = await room(page)
    test.skip(space < 40, 'fits on this screen: nothing to scroll')
    // Part-way down first, so the page can go either way (the menu stays put: it's sticky)
    await page.evaluate(y => window.scrollTo(0, y), Math.round(space / 2))
    const target = page.locator(selector).first()
    await target.evaluate(el => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(300)
    const box = await target.boundingBox()
    const before = await scrollY(page)

    // From the middle of what's visible of it, in whichever direction both the finger (on the
    // screen) and the page (in its scroll range) have room to move
    const y = Math.round((Math.max(box.y, 0) + Math.min(box.y + box.height, height)) / 2)
    const fingerUp = before < space - 5 ? y - 10 : 0 // finger moves up = page scrolls down
    const fingerDown = before > 5 ? height - y - 10 : 0
    const reach = Math.min(Math.max(fingerUp, fingerDown), height * 0.4)
    test.skip(reach < 60, `no room to swipe from ${what} on this screen`)
    const scrollsDown = fingerUp >= fingerDown
    await swipe(page, box.x + box.width / 2, y, scrollsDown ? -reach : reach)
    const after = await scrollY(page)
    if (scrollsDown) expect(after, `scrolled down from ${what}`).toBeGreaterThan(before)
    else expect(after, `scrolled up from ${what}`).toBeLessThan(before)
  })
}

test('a tap still works: the About card switches to XP', async ({ page }) => {
  await open(page, '/')
  const xp = page.locator('#about-tab-edu')
  await xp.scrollIntoViewIfNeeded()
  await xp.tap()
  await expect(xp).toHaveAttribute('aria-selected', 'true')
})

// Definitions in blog posts, like the bio's: a tap on a term opens its bubble, which says a tap
// dismisses it; a tap on the bubble then sends it off in a poof
test('a definition in a blog post opens with a tap, and a tap on it poofs it away', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Pixel 7', 'one phone is enough')
  await open(page, '/blog/hello-world')
  const term = page.locator('abbr.term').first()
  await expect(term).toBeVisible()
  await term.tap()
  const tip = page.locator('.term-tip')
  await expect(tip).toBeVisible()
  // A touch screen says "Tap"; the mouse wording stays hidden
  await expect(tip.locator('.term-tip__hint--touch')).toHaveText('Tap to dismiss')
  await expect(tip.locator('.term-tip__hint--touch')).toBeVisible()
  await expect(tip.locator('.term-tip__hint--mouse')).toBeHidden()
  const { x, y, width, height } = await tip.boundingBox()
  // Not on its link: on the definition text
  await page.touchscreen.tap(x + width / 2, y + Math.min(20, height / 3))
  await expect(tip).toHaveClass(/term-tip--poof/)
  await expect(tip).toBeHidden({ timeout: 2000 })
  expect(await page.evaluate(() => location.pathname), 'the tap stayed on the page').toBe('/blog/hello-world')
})

// Pull to reset, home page only and around the coin: a pull down from the top, starting between the
// nav bar and the name, starts the coin over; one starting on the nav, or below the name (reading,
// scrolling back up), does not. The pill comes out from under the nav bar.
test('pull to reset: only around the coin, between the nav bar and the name, on the home page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Pixel 7', 'one phone is enough')
  await open(page, '/')
  const hint = page.locator('.home__intro .hint')
  const box = await page.locator('.token').boundingBox()
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
  await expect(hint).toContainText('1 spin')
  await page.waitForTimeout(1500) // let the coin settle

  const nav = await page.locator('.app-nav').boundingBox()
  await swipe(page, 20, nav.y + nav.height / 2, 260)
  await expect(hint, 'a pull from the nav bar leaves the coin alone').toContainText('1 spin')

  const name = await page.locator('.home__name').boundingBox()
  await swipe(page, 20, name.y + name.height + 40, 260)
  expect(await scrollY(page)).toBe(0)
  await expect(hint, 'a pull from below the name leaves the coin alone').toContainText('1 spin')

  // Held at full stretch: the pill shows below the nav bar, not over it
  const cdp = await page.context().newCDPSession(page)
  const y0 = box.y + 10
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 20, y: y0 }] })
  for (let y = y0 + 20; y <= y0 + 260; y += 20) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 20, y }] })
  await page.waitForTimeout(100)
  const pill = page.locator('.ptr')
  await expect(pill).toHaveText(/Release to reset/)
  expect((await pill.boundingBox()).y, 'the pill sits under the nav bar').toBeGreaterThanOrEqual(nav.y + nav.height - 1)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
  await expect(hint, 'a pull from around the coin starts it over').toContainText('the coin · discover a new fact')

  await open(page, '/blog')
  await expect(page.locator('.ptr')).toHaveCount(0)
})

// The contact card (iPhone only): a new tab in the browser; installed on the home screen, it opens
// in place, since the app can't open a new tab with a tap
for (const installed of [false, true]) {
  test(`the contact card opens with a tap ${installed ? 'in the installed app' : 'in the browser'}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Pixel 7', 'one phone is enough')
    await page.addInitScript(standalone => {
      Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
      if (standalone) Object.defineProperty(navigator, 'standalone', { get: () => true })
    }, installed)
    await open(page, '/')
    const box = await page.locator('.token').boundingBox()
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    const card = page.locator('a.contact-card__button--unlocked')
    await expect(card).toBeVisible()
    if (installed) await expect(card).not.toHaveAttribute('target')
    else await expect(card).toHaveAttribute('target', '_blank')
  })
}

// Halloween (config.toml [seasons.spooky]): from noon Eastern on Oct 30 through Oct 31 the coin is
// a neon jack-o'-lantern, bat or ghost, turning into the next on each heads landing, with fog over
// the background on every page. Not before noon. Only the date is set; timers still run.
test('Halloween: the coin turns spooky shapes and fog rolls in, from noon the day before', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Pixel 7', 'one phone is enough')
  await page.clock.setFixedTime(new Date('2026-10-30T15:59:00Z')) // 11:59 am Eastern
  await open(page, '/')
  await expect(page.locator('.token')).not.toHaveAttribute('data-shape')
  await expect(page.locator('.fog')).toHaveCount(0)

  await page.clock.setFixedTime(new Date('2026-10-30T16:00:00Z')) // noon
  await open(page, '/')
  const coin = page.locator('.token')
  await expect(coin).toHaveClass(/token--spooky/)
  const first = await coin.getAttribute('data-shape')
  expect(['pumpkin', 'bat', 'ghost']).toContain(first)
  await expect(page.locator('.fog')).toHaveCount(1)

  // Two taps: tails, then heads again, which brings the next shape
  const box = await coin.boundingBox()
  for (let i = 0; i < 2; i++) {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(1500)
  }
  await expect(coin).not.toHaveAttribute('data-shape', first)

  await open(page, '/blog')
  await expect(page.locator('.fog')).toHaveCount(1)
})
