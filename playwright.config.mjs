// Browser tests (tests/e2e): every Android phone, tablet and foldable Playwright knows, in portrait
// and landscape, with touch input, against the generated site. Run `npm run generate` first, then
// `npm run test:android`. Set PLAYWRIGHT_CHROMIUM_PATH to use an already-installed Chromium.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// Android devices with touch, from Playwright's device list
export const ANDROID_DEVICES = Object.entries(devices).filter(([, device]) => /Android/.test(device.userAgent) && device.hasTouch)

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
    launchOptions: {
      args: ['--touch-events=enabled'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH && { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH })
    }
  },
  projects: ANDROID_DEVICES.map(([name, device]) => ({ name, use: { ...device } })),
  webServer: {
    command: `node scripts/serve-static.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI
  }
})
