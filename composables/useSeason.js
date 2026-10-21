// Today's seasonal theme (utils/seasons.mjs, config.toml [seasons]), or null. Picked in the
// browser once the page is up: the prerendered page has no theme, so it fits any day.
import settings from '~/data/seasons.generated.mjs'
import { themeFor } from '~/utils/seasons.mjs'
import { dayIn } from '~/utils/coinBubble.mjs'

export const useSeason = () => {
  const theme = useState('season:theme', () => null)
  onMounted(() => {
    theme.value ??= themeFor(settings, dayIn(new Date()))
  })
  return theme
}

export const seasonParticles = settings.particles
