// Today's seasonal theme (utils/seasons.mjs, config.toml [seasons]), or null. Picked in the
// browser once the page is up: the prerendered page has no theme, so it fits any day.
import settings from '~/data/seasons.generated.mjs'
import { spookyAt, themeFor } from '~/utils/seasons.mjs'
import { dayIn } from '~/utils/coinBubble.mjs'

export const useSeason = () => {
  const theme = useState('season:theme', () => null)
  onMounted(() => {
    theme.value ??= themeFor(settings, dayIn(new Date()))
  })
  return theme
}

// Whether it's spooky time (config.toml [seasons.spooky]: the neon coin and the mist). Like the
// theme, decided in the browser once the page is up.
export const useSpooky = () => {
  const spooky = useState('season:spooky', () => false)
  onMounted(() => {
    spooky.value ||= spookyAt(settings, new Date())
  })
  return spooky
}

export const seasonParticles = settings.particles
