// The 404 page (error.vue): a way home, I'm Feeling Lucky (components/FeelingLucky.vue,
// utils/lucky.mjs), and the classic games (components/LostArcade.vue, utils/arcade.mjs)
// behind slide to unlock (components/SwipeToUnlock.vue), which shows every game. Lucky picks are
// made here by pinning Math.random. A phone is enough.
import { expect, test } from '@playwright/test'

const GAMES = [
  ['Pong', 'You 0 – 0 Computer'],
  ['Block Breaker', 'Score 0 · 3 lives'],
  ['Space Invaders', 'Score 0 · 3 lives']
]

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Pixel 7', 'checked on a phone')
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
})

// Drags the knob all the way along the track
const slideOpen = async page => {
  const knob = page.getByRole('slider', { name: 'slide to unlock the arcade' })
  const track = await page.locator('.swipe-unlock').boundingBox()
  const box = await knob.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width - 4, box.y + box.height / 2, { steps: 12 })
  await page.mouse.up()
}

test('an unknown address gets the 404 page, with a way home', async ({ page }) => {
  const response = await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  expect(response.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404 · Page not found')
  await expect(page.locator('.lost-arcade__play'), 'locked until you slide').toHaveCount(0)
  await expect(page.getByRole('slider', { name: 'slide to unlock the arcade' })).toBeVisible()
  await page.getByRole('button', { name: 'Take me home 🏠' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('unlocking shows every game, with focus on the first', async ({ page }) => {
  await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  await slideOpen(page)
  const buttons = page.locator('.lost-arcade__play')
  await expect(buttons).toHaveText(GAMES.map(([name]) => new RegExp(`Play ${name}$`)))
  await expect(buttons.first()).toBeFocused()
})

for (const [name, startScore] of GAMES) {
  test(`${name} plays`, async ({ page }) => {
    await page.goto('/no-such-page', { waitUntil: 'networkidle' })
    await slideOpen(page)
    const play = page.getByRole('button', { name: `Play ${name}` })
    await play.click()
    const court = page.getByRole('dialog', { name })
    await expect(court.locator('canvas')).toBeVisible()
    await expect(court.locator('.lost-arcade__score')).toHaveText(startScore)
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
    // A finger held on the court moves you (and shoots, in Space Invaders); the page doesn't scroll
    const box = await court.locator('canvas').boundingBox()
    await page.mouse.move(box.width * 0.5, box.height * 0.7)
    await page.mouse.down()
    for (const x of [0.1, 0.9, 0.5]) await page.mouse.move(box.width * x, box.height * 0.7, { steps: 10 })
    // Left to play on, something scores or a life is lost
    await expect(court.locator('.lost-arcade__score')).not.toHaveText(startScore, { timeout: 20_000 })
    await page.mouse.up()
    expect(await page.evaluate(() => scrollY)).toBe(0)
    // Escape closes it and puts you back on the button
    await page.keyboard.press('Escape')
    await expect(court).toBeHidden()
    await expect(play).toBeFocused()
  })
}

test('let go of the knob early and it springs back; the keyboard unlocks it too', async ({ page }) => {
  await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  const knob = page.getByRole('slider', { name: 'slide to unlock the arcade' })
  const box = await knob.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect(knob).toHaveAttribute('aria-valuenow', '0')
  await expect(page.locator('.lost-arcade__play')).toHaveCount(0)
  await knob.focus()
  await page.keyboard.press('ArrowRight')
  await expect(knob).toHaveAttribute('aria-valuenow', '25')
  await page.keyboard.press('End')
  await expect(page.locator('.lost-arcade__play').first()).toBeFocused()
})

test("I'm Feeling Lucky: a blog post opens", async ({ page }) => {
  await page.addInitScript(() => (Math.random = () => 0))
  await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: "🍀 I'm Feeling Lucky" }).click()
  await expect(page).toHaveURL(/\/blog\/[a-z0-9_-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('404 · Page not found')
})

for (const [what, random] of [['a home page fact', 0.5], ['a definition', 0.9]]) {
  test(`I'm Feeling Lucky: ${what} is searched for you, in the page`, async ({ page }) => {
    await page.addInitScript(value => (Math.random = () => value), random)
    await page.goto('/no-such-page', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: "🍀 I'm Feeling Lucky" }).click()
    const panel = page.getByRole('region', { name: 'Let me search that for you' })
    await expect(panel).toBeVisible()
    await expect(panel.locator('.let-me-search__step')).toHaveText('Step 1: Click the search box')
    // Typed, searched, answered
    await expect(panel.locator('.let-me-search__step')).toHaveText('Was that so hard? 😉', { timeout: 10_000 })
    const query = await panel.locator('.let-me-search__typed').textContent()
    expect(query.length).toBeGreaterThan(1)
    const link = panel.getByRole('link', { name: /on Google/ })
    expect(new URL(await link.getAttribute('href')).searchParams.get('q')).toBe(query)
    await expect(panel.locator('.let-me-search__found')).toBeVisible()
    expect(page.url(), 'still on the page').toMatch(/no-such-page$/)
  })
}

test('with reduced motion the answer shows straight away', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => (Math.random = () => 0.5))
  await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: "🍀 I'm Feeling Lucky" }).click()
  await expect(page.locator('.let-me-search__step')).toHaveText('Was that so hard? 😉')
})
