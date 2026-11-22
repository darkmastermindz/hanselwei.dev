// Liquid Glass refraction for the `liquid-glass` classes (packages/tailwind-ios-glass): the header's
// and contact card button's edges bend what's behind them like a lens, in browsers that can draw
// it; everywhere else they're frosted glass without it
import { installRefraction } from 'tailwind-ios-glass/refraction'

export default defineNuxtPlugin(() => {
  installRefraction()
})
