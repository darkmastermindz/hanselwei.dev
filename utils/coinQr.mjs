// The QR code engraved on the coin's tails side, built at build time (scripts/build-coin-bubble.mjs)
// so the page ships only an SVG path: one rectangle per run of dark modules, numbers only.
import { encode } from 'uqr'

export const qrPath = url => {
  const { size, data } = encode(url, { ecc: 'M', border: 0 })
  let path = ''
  data.forEach((row, y) => {
    for (let x = 0; x < size; x++) {
      if (!row[x]) continue
      let run = 1
      while (x + run < size && row[x + run]) run++
      path += `M${x} ${y}h${run}v1h-${run}z`
      x += run - 1
    }
  })
  return { size, path }
}
