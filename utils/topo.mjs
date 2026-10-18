// The faint topographic background: contour lines of a smooth, seeded noise field, traced with
// marching squares. It's pure and deterministic, so the server and the browser draw the same paths.
export const TOPO_WIDTH = 1000
export const TOPO_HEIGHT = 600
const COLS = 50
const ROWS = 30
// Contour heights, from low to high (one line of paths per height)
export const TOPO_LEVELS = [0.3, 0.38, 0.46, 0.54, 0.62, 0.7]

// Integer lattice hash -> [0, 1]
const hash = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Smooth value noise on the lattice
const noise = (x, y) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// Three octaves of noise, for u and v in [0, 1]
const field = (u, v) => noise(u * 3, v * 3) * 0.55 + noise(u * 7 + 11, v * 7 - 5) * 0.3 + noise(u * 15 - 3, v * 15 + 9) * 0.15

// Which corners are at or above the level: TL = 8, TR = 4, BR = 2, BL = 1
// Each case lists the cell edges (0 top, 1 right, 2 bottom, 3 left) that the line crosses.
// The two saddle cases (5 and 10) get two separate segments.
const SEGMENTS = {
  1: [[2, 3]],
  2: [[1, 2]],
  3: [[1, 3]],
  4: [[0, 1]],
  5: [[0, 1], [2, 3]],
  6: [[0, 2]],
  7: [[0, 3]],
  8: [[0, 3]],
  9: [[0, 2]],
  10: [[0, 3], [1, 2]],
  11: [[0, 1]],
  12: [[1, 3]],
  13: [[1, 2]],
  14: [[2, 3]]
}

// Path data (M/L pairs) and total length for one contour level over the whole field
const contourPath = (values, level) => {
  const cellW = TOPO_WIDTH / COLS
  const cellH = TOPO_HEIGHT / ROWS
  const cuts = []
  let length = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = values[r][c]
      const tr = values[r][c + 1]
      const br = values[r + 1][c + 1]
      const bl = values[r + 1][c]
      const code = (tl >= level ? 8 : 0) + (tr >= level ? 4 : 0) + (br >= level ? 2 : 0) + (bl >= level ? 1 : 0)
      const segments = SEGMENTS[code]
      if (!segments) continue

      const x0 = c * cellW
      const x1 = (c + 1) * cellW
      const y0 = r * cellH
      const y1 = (r + 1) * cellH
      const cross = (va, vb, pa, pb) => {
        const span = vb - va
        return pa + (pb - pa) * (Math.abs(span) < 1e-9 ? 0.5 : (level - va) / span)
      }
      const point = edge => {
        if (edge === 0) return [cross(tl, tr, x0, x1), y0]
        if (edge === 1) return [x1, cross(tr, br, y0, y1)]
        if (edge === 2) return [cross(bl, br, x0, x1), y1]
        return [x0, cross(tl, bl, y0, y1)]
      }
      for (const [from, to] of segments) {
        const [ax, ay] = point(from)
        const [bx, by] = point(to)
        cuts.push(`M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`)
        length += Math.hypot(bx - ax, by - ay)
      }
    }
  }
  return { d: cuts.join(''), length }
}

// One { d, length } per level, in TOPO_LEVELS order (length is in the viewBox units, so the
// component can draw the line by setting the dash to it)
export const buildTopoPaths = () => {
  const values = []
  for (let r = 0; r <= ROWS; r++) {
    const row = []
    for (let c = 0; c <= COLS; c++) row.push(field(c / COLS, r / ROWS))
    values.push(row)
  }
  return TOPO_LEVELS.map(level => contourPath(values, level))
}

export const TOPO_PATHS = buildTopoPaths()

// How far one contour level is drawn (0 to 1), given how far the whole pattern is drawn. Level
// i starts once `drawn` passes i / levels, so the lines fill in one after another.
export const levelProgress = (drawn, index) => Math.min(1, Math.max(0, drawn * TOPO_LEVELS.length - index))
