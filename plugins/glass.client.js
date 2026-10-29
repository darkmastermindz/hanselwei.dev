// Marks the page `html.glass-refract` where the browser can draw the header's Liquid Glass
// refraction (utils/glass.js); everywhere else the header is frosted glass without it
import { canRefract } from '~/utils/glass.js'

export default defineNuxtPlugin(() => {
  document.documentElement.classList.toggle('glass-refract', canRefract(navigator))
})
