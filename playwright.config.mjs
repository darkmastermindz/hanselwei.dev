// Browser tests (tests/e2e): every Android phone, tablet and foldable Playwright knows, in portrait
// and landscape, and iPhone Duo, with touch input, against the generated site. Run `npm run generate` first, then
// `npm run test:android`. Set PLAYWRIGHT_CHROMIUM_PATH to use an already-installed Chromium.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// Android devices with touch, from Playwright's device list
export const ANDROID_DEVICES = Object.entries(devices).filter(([, device]) => /Android/.test(device.userAgent) && device.hasTouch)

// iPhone Duo (README "Foldables"), which Playwright doesn't list yet: Safari's page sizes from
// WebKit's Safari 27.1 notes and measurements on the device (estimates until checked on one).
// Run in Chromium with Safari's user agent; Safari itself isn't installed for these tests.
const IPHONE_DUO_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.1 Mobile/15E148 Safari/604.1'
const iphoneDuo = viewport => ({ userAgent: IPHONE_DUO_UA, viewport, screen: viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
export const IPHONE_DUO_DEVICES = [
  ['iPhone Duo', iphoneDuo({ width: 626, height: 800 })], // inner screen, upright
  ['iPhone Duo landscape', iphoneDuo({ width: 951, height: 600 })], // inner screen, sideways
  ['iPhone Duo Cover', iphoneDuo({ width: 382, height: 580 })] // outer screen (closed)
]

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
  projects: [...ANDROID_DEVICES, ...IPHONE_DUO_DEVICES].map(([name, device]) => ({ name, use: { ...device } })),
  webServer: {
    command: `node scripts/serve-static.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI
  }
})
