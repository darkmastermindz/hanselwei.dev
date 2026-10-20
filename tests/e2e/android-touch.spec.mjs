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
    navigator.getGamepads = () => [phantom()]
  })
})

// The page loaded and the app running, with the phantom pad's stick already stuck at -1
const open = async (page, path) => {
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
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
    test.skip((await room(page)) < 40, 'fits on this screen: nothing to scroll')

    await swipe(page, width / 2, height * 0.7, -distance)
    const down = await scrollY(page)
    expect(down, 'a swipe up scrolls the page down').toBeGreaterThan(distance / 3)
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
    test.skip((await room(page)) < 40, 'fits on this screen: nothing to scroll')
    const target = page.locator(selector).first()
    await target.evaluate(el => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(300)
    const box = await target.boundingBox()
    const before = await scrollY(page)
    // From the middle of what's visible of it, up the screen (or down, when already at the bottom)
    const top = Math.max(box.y, 0)
    const y = Math.round((top + Math.min(box.y + box.height, height)) / 2)
    const up = before < (await room(page)) - 20
    await swipe(page, box.x + box.width / 2, y, up ? -Math.min(y - 10, height * 0.4) : Math.min(height - y - 10, height * 0.4))
    const after = await scrollY(page)
    if (up) expect(after, `scrolled down from ${what}`).toBeGreaterThan(before)
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
