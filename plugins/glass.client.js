// Liquid Glass refraction for the `liquid-glass` classes (packages/tailwind-ios-glass): the header's
// edge bends what's behind it like a lens, in browsers that can draw it; everywhere else it's
// frosted glass without it
import { installRefraction } from 'tailwind-ios-glass/refraction'

export default defineNuxtPlugin(() => {
  installRefraction()
})
