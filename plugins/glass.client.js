// Liquid Glass refraction for the header's `liquid-glass` class (packages/tailwind-ios-glass): adds the
// SVG filter in browsers that can draw it; everywhere else the header is frosted glass without it
import { installRefraction } from 'tailwind-ios-glass/refraction'

export default defineNuxtPlugin(() => {
  installRefraction()
})
