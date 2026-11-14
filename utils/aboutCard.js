// The home page's About card opens on XP when the URL is /#xp (the Bio page links there).
// The hash is outside input: only that exact value counts.
export const opensXp = hash => typeof hash === 'string' && hash.toLowerCase() === '#xp'

// config.toml [about_card] first: which side the card opens on and comes back to, "text" (plain
// English) or "json". Leave it out for "text"; anything else fails the build.
export const ABOUT_FIRST = ['text', 'json']
export function aboutCardConfig(toml = {}) {
  const raw = toml?.about_card?.first ?? 'text'
  if (typeof raw === 'string' && ABOUT_FIRST.includes(raw)) return { config: { first: raw }, problems: [] }
  return { config: { first: 'text' }, problems: [`[about_card] first: "text" or "json"`] }
}
