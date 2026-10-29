// The 404 page (error.vue): a way home, and a classic game picked at random (components/LostArcade.vue,
// utils/arcade.mjs). Each game is played here by pinning Math.random to pick it. A phone is enough.
import { expect, test } from '@playwright/test'

const GAMES = [
  ['Pong', 0, 'You 0 – 0 Computer'],
  ['Block Breaker', 0.5, 'Score 0 · 3 lives'],
  ['Space Invaders', 0.9, 'Score 0 · 3 lives']
]

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Pixel 7', 'checked on a phone')
  // Nothing from outside the test server: fonts, avatars and APIs would only make it flaky
  await page.route(/^https?:\/\/(?!localhost[:/])/, route => route.abort())
})

test('an unknown address gets the 404 page, with a way home', async ({ page }) => {
  const response = await page.goto('/no-such-page', { waitUntil: 'networkidle' })
  expect(response.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404 · Page not found')
  await expect(page.locator('.lost-arcade__play')).toHaveText(/^\S+ Play (Pong|Block Breaker|Space Invaders)$/)
  await page.getByRole('button', { name: 'Take me home 🏠' }).click()
  await expect(page).toHaveURL(/\/$/)
})

for (const [name, random, startScore] of GAMES) {
  test(`the 404 page can pick ${name}, and it plays`, async ({ page }) => {
    await page.addInitScript(value => (Math.random = () => value), random)
    await page.goto('/no-such-page', { waitUntil: 'networkidle' })
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
