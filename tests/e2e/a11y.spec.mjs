// Accessibility (axe-core, WCAG 2.1 A and AA) on every page and on the home page's interactive
// states. A phone and a wide tablet are enough: the rules don't change per device, the layouts
// do. Same guard as android-touch.spec.mjs: the app must really be running, or a page whose
// scripts failed would be checked as plain HTML.
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PROJECTS = new Set(['Pixel 7', 'Galaxy Tab S9 landscape'])
const PAGES = ['/', '/bio', '/blog', '/blog/hello-world', '/blog/feed', '/projects', '/gear', '/gear/outdoor', '/gear/camera', '/terms', '/credits', '/StayCurious']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!PROJECTS.has(testInfo.project.name), 'checked on a phone and a tablet')
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
})

const open = async (page, path) => {
  await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  expect(await page.evaluate(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__)), 'the app is running').toBe(true)
}

// The tab's content fades in: check once nothing is part-way through a transition (endless
// animations, like the coin's shine, don't count)
const settled = async page => {
  await page.waitForTimeout(150) // the fade starts a frame or two after the tap
  await page.waitForFunction(() =>
    document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity)
  )
  await page.waitForTimeout(100)
}

// Every violation, one line per element, so a failure says exactly what to fix
const check = async (page, what) => {
  // label-content-name-mismatch is one of axe's experimental rules (Lighthouse doesn't run it).
  // It counts the flip links' and the coin's back faces as visible text, but those are turned
  // away and aria-hidden, so the names ("GitHub", the coin's description) are what's shown.
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).disableRules(['label-content-name-mismatch']).analyze()
  const found = violations.flatMap(v =>
    v.nodes.map(n => `${v.id}: ${n.target.join(' ')} — ${(n.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 220)}`)
  )
  expect(found, `accessibility problems on ${what}`).toEqual([])
}

for (const path of PAGES) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await open(page, path)
    await check(page, path)
  })
}

test('the About card has none on any tab, in plain English, or on XP', async ({ page }) => {
  await open(page, '/')
  for (const tab of await page.locator('[role="tab"]').all()) {
    await tab.click()
    await settled(page)
    await check(page, `the ${(await tab.textContent()).trim()} tab`)
  }
  // Plain English: alt-click the card (the desktop shortcut for press-and-hold)
  await page.locator('.about-card [role="tabpanel"]').click({ modifiers: ['Alt'] })
  // The old words fall away first (aria-hidden, fading out): check once they're gone
  await expect(page.locator('.poof-word')).toHaveCount(0, { timeout: 5000 })
  await check(page, 'the card in plain English')
})

test('the Instagram menu has none when open', async ({ page }) => {
  await open(page, '/')
  const pill = page.locator('a.flip-link[aria-label="Instagram"]')
  await pill.scrollIntoViewIfNeeded()
  await pill.click()
  await expect(page.locator('.flip-menu')).toBeVisible({ timeout: 3000 })
  await check(page, 'the open Instagram menu')
})

// Kudos on the plain-English XP list (netlify/functions/kudos.mjs, stood in for here): the
// buttons have no violations, and a tap counts without flipping the card back to JSON. The
// service worker is off so the stand-in sees the requests.
test.describe('XP kudos', () => {
  test.use({ serviceWorkers: 'block' })

  test('the kudos buttons have none, and a tap counts without leaving plain English', async ({ page }) => {
    const sent = []
    await page.route('**/api/kudos', async route => {
      const request = route.request()
      if (request.method() === 'POST') sent.push(request.postDataJSON().id)
      const body = request.method() === 'POST' ? { id: sent.at(-1), count: 1, counted: true } : { counts: {} }
      await route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) })
    })
    await open(page, '/#xp')
    await page.locator('.about-card [role="tabpanel"]').click({ modifiers: ['Alt'] })
    await expect(page.locator('.poof-word')).toHaveCount(0, { timeout: 5000 })
    const button = page.locator('.edu-list .kudos').first()
    await expect(button).toBeVisible({ timeout: 5000 })
    await check(page, 'the XP list with kudos')

    await button.click()
    await expect(button).toHaveClass(/kudos--given/)
    await expect(button).toContainText('1')
    expect(sent).toHaveLength(1)
    await expect(page.locator('.edu-list')).toBeVisible()
    await settled(page)
    await check(page, 'the XP list after a kudos')
  })
})
