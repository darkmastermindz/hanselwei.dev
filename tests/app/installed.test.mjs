import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isInstalled } from '../../utils/installed.js'

const media = matches => () => ({ matches })

test('the installed app is detected from display-mode or iOS navigator.standalone', () => {
  assert.equal(isInstalled({ matchMedia: media(true) }), true)
  assert.equal(isInstalled({ matchMedia: media(false), standalone: true }), true)
})

test('a browser tab is not the installed app', () => {
  assert.equal(isInstalled({ matchMedia: media(false), standalone: false }), false)
  assert.equal(isInstalled({ matchMedia: media(false) }), false)
  assert.equal(isInstalled({}), false)
  assert.equal(isInstalled(), false)
  assert.equal(isInstalled({ standalone: 'yes' }), false)
})
