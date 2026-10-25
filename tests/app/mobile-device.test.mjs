// Phones and tablets open the social links through the hand-off page (pages/out/[id].vue), which
// closes the new tab when an app takes the link over. Desktops open the links directly.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handsOffToApps, isAppleMobile } from '../../utils/mobileDevice.js'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

test('iPhones, iPads and iPods are Apple mobile devices', () => {
  assert.equal(isAppleMobile({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: IPAD, platform: 'iPad', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: IPHONE.replace('iPhone', 'iPod touch') }), true)
  // An iPad asking for desktop sites reports a Mac, but with a touch screen
  assert.equal(isAppleMobile({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 0 }), false)
})

test('phones and tablets hand links to apps', () => {
  for (const userAgent of [IPHONE, IPAD, PIXEL, ANDROID_TABLET]) assert.equal(handsOffToApps({ userAgent }), true, userAgent)
  assert.equal(handsOffToApps({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 5 }), true)
})

test('desktops open links directly', () => {
  assert.equal(handsOffToApps({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 0 }), false)
  assert.equal(handsOffToApps({ userAgent: WINDOWS, platform: 'Win32', maxTouchPoints: 0 }), false)
  for (const value of [undefined, {}, { userAgent: 42 }, { userAgent: null, platform: null }]) {
    assert.equal(handsOffToApps(value), false, JSON.stringify(value))
  }
})
