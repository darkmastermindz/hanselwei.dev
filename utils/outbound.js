// The social links, by id, for the hand-off page (pages/out/[id].vue). On phones and tablets
// the links open /out/<id> in a new tab, which goes on to the site. When the phone hands the
// link to an app instead, that tab would be left blank, so the hand-off page closes it.
// The id is outside input (part of the URL): only these ids lead anywhere, never a URL.
export const OUTBOUND = {
  github: { label: 'GitHub', href: 'https://github.com/darkmastermindz' },
  mastodon: { label: 'Mastodon', href: 'https://hansel.run/mastodon' },
  messenger: { label: 'Messenger', href: 'https://m.me/hanselwei' },
  instagram: { label: 'Instagram', href: 'https://hansel.rocks' },
  // Switch to https://hansel.codes once that domain points at the profile
  'instagram-codes': { label: 'Instagram', href: 'https://instagram.com/hansel.codes' },
  devto: { label: 'DEV Community', href: 'https://dev.to/hansel' },
  linkedin: { label: 'LinkedIn', href: 'https://linkedin.com/in/hanselwei' },
  strava: { label: 'Strava', href: 'https://www.strava.com/athletes/129101734' }
}

// The link for an id, or null
export const outboundFor = id => (typeof id === 'string' && Object.hasOwn(OUTBOUND, id) ? OUTBOUND[id] : null)

export const outPath = id => `/out/${encodeURIComponent(id)}`
