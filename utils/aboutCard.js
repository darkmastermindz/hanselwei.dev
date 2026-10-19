// The home page's About card opens on XP when the URL is /#xp (the Bio page links there).
// The hash is outside input: only that exact value counts.
export const opensXp = hash => typeof hash === 'string' && hash.toLowerCase() === '#xp'
