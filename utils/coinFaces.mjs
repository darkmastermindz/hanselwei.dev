// The photos on the home page coin's heads side (components/Bitmoji.vue). The coin opens on the
// Bitmoji; each time it lands heads it shows the next photo, alternating GitHub and Gravatar.
export const COIN_FACES = [
  { id: 'github', label: 'GitHub', src: 'https://avatars.githubusercontent.com/u/6164335?v=4&s=512' },
  {
    id: 'gravatar',
    label: 'hanselwei.link Gravatar',
    src: 'https://1.gravatar.com/avatar/821b2e292cc6a6668358a74625d89a477f395929456bf9f30db01c059de56fd2?size=512&d=initials'
  }
]

// The face after `index` (-1 is the Bitmoji), skipping photos that failed to load. -1 when none can show.
export const nextFace = (index, count, broken = []) => {
  for (let step = 1; step <= count; step++) {
    const next = (((index + step) % count) + count) % count
    if (!broken.includes(next)) return next
  }
  return -1
}
