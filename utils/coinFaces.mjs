// The photos on the home page coin's heads side (components/Bitmoji.vue). The coin opens on the
// Bitmoji; each time it lands heads it shows the next photo, alternating GitHub and Gravatar.
export const COIN_FACES = [
  { id: 'github', label: 'GitHub', src: 'https://avatars.githubusercontent.com/u/6164335?v=4&s=720' },
  {
    id: 'gravatar',
    label: 'hanselwei.link Gravatar',
    src: 'https://1.gravatar.com/avatar/821b2e292cc6a6668358a74625d89a477f395929456bf9f30db01c059de56fd2?size=720&d=initials'
  }
]

// On Netlify the photos go through its Image CDN (netlify.toml [images]): resized to the coin
// (170–230px across, up to 3× screens) and sent as WebP or AVIF where the browser takes them,
// instead of the full-size PNG/JPEG. Elsewhere (local builds) they load straight from the source.
export const PHOTO_WIDTHS = [240, 480, 720]
export const COIN_SIZES = '(max-width: 309px) 170px, (max-width: 418px) 55vw, 230px'
export const cdnUrl = (src, width) => `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}`
export const photoSources = (src, cdn = false) =>
  cdn
    ? { src: cdnUrl(src, 480), srcset: PHOTO_WIDTHS.map(w => `${cdnUrl(src, w)} ${w}w`).join(', '), sizes: COIN_SIZES }
    : { src }

// The face after `index` (-1 is the Bitmoji), skipping photos that failed to load. -1 when none can show.
export const nextFace = (index, count, broken = []) => {
  for (let step = 1; step <= count; step++) {
    const next = (((index + step) % count) + count) % count
    if (!broken.includes(next)) return next
  }
  return -1
}
