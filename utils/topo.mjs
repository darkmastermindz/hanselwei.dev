// The faint topographic background: contour lines of a warped, seeded noise field, traced with
// marching squares, joined into smooth lines, and sized to the screen in pixels (so a phone and a
// desktop get the same density). Pure and deterministic for a given size.
export const LEVEL_COUNT = 28
export const INDEX_EVERY = 5 // every 5th contour is a heavier "index" line, as on a topo map
const FEATURE_PX = 280 // roughly the size of a hill or valley
const TARGET_CELL_PX = 8
const MAX_CELLS = 25000
const TRAIL_COUNT = 3

// Integer lattice hash -> [0, 1]
const hash = (x, y, seed) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Smooth value noise on the lattice
const noise = (x, y, seed) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// Fractal noise: octaves at double frequency and half the weight, normalised to [0, 1]
const fbm = (x, y, seed, octaves) => {
  let sum = 0
  let weight = 1
  let total = 0
  let frequency = 1
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * frequency, y * frequency, seed + o * 101) * weight
    total += weight
    weight /= 2
    frequency *= 2
  }
  return sum / total
}

// The terrain, with its sample point pushed around by another noise field ("domain warping"),
// which gives the winding ridges and nested rings around peaks
const terrain = (x, y) => {
  const u = x / FEATURE_PX
  const v = y / FEATURE_PX
  const warpX = fbm(u * 0.7 + 5.2, v * 0.7 + 1.3, 7, 3) - 0.5
  const warpY = fbm(u * 0.7 - 3.1, v * 0.7 + 8.7, 11, 3) - 0.5
  return fbm(u + warpX * 2.2, v + warpY * 2.2, 3, 4)
}

// A broad second field for the dashed trails
const trailField = (x, y) => fbm(x / (FEATURE_PX * 2.5), y / (FEATURE_PX * 2.5), 23, 2)

// Which corners are at or above the level: TL = 8, TR = 4, BR = 2, BL = 1
// Each case lists the cell edges (0 top, 1 right, 2 bottom, 3 left) the line crosses.
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

// Grid of field values at the cell corners
const sampleGrid = (grid, fn) => {
  const values = []
  for (let r = 0; r <= grid.rows; r++) {
    const row = []
    for (let c = 0; c <= grid.cols; c++) row.push(fn(c * grid.cellW, r * grid.cellH))
    values.push(row)
  }
  return values
}

// The contour at `level` as polylines (arrays of [x, y]). Segments are joined through the cell
// edges they share: every edge has an exact id, so no floating-point matching is needed.
const contourLines = (grid, values, level) => {
  const { rows, cols, cellW, cellH } = grid
  const horizontalCount = (rows + 1) * cols
  const edgeId = (r, c, edge) => {
    if (edge === 0) return r * cols + c // top
    if (edge === 2) return (r + 1) * cols + c // bottom
    if (edge === 3) return horizontalCount + r * (cols + 1) + c // left
    return horizontalCount + r * (cols + 1) + c + 1 // right
  }
  const links = new Map()
  const points = new Map()
  const link = (a, b) => {
    if (!links.has(a)) links.set(a, [])
    if (!links.has(b)) links.set(b, [])
    links.get(a).push(b)
    links.get(b).push(a)
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = values[r][c]
      const tr = values[r][c + 1]
      const br = values[r + 1][c + 1]
      const bl = values[r + 1][c]
      const code = (tl >= level ? 8 : 0) + (tr >= level ? 4 : 0) + (br >= level ? 2 : 0) + (bl >= level ? 1 : 0)
      const segments = SEGMENTS[code]
      if (!segments) continue

      const x0 = c * cellW
      const y0 = r * cellH
      const cross = (va, vb) => {
        const span = vb - va
        return Math.abs(span) < 1e-12 ? 0.5 : (level - va) / span
      }
      const place = edge => {
        const id = edgeId(r, c, edge)
        if (!points.has(id)) {
          if (edge === 0) points.set(id, [x0 + cross(tl, tr) * cellW, y0])
          else if (edge === 1) points.set(id, [x0 + cellW, y0 + cross(tr, br) * cellH])
          else if (edge === 2) points.set(id, [x0 + cross(bl, br) * cellW, y0 + cellH])
          else points.set(id, [x0, y0 + cross(tl, bl) * cellH])
        }
        return id
      }
      for (const [from, to] of segments) link(place(from), place(to))
    }
  }

  // Walk the links into lines: open lines first (they end at the screen edge), then loops
  const visited = new Set()
  const lines = []
  const walk = start => {
    const ids = [start]
    visited.add(start)
    let previous = -1
    let current = start
    for (;;) {
      const next = links.get(current).find(id => id !== previous && !visited.has(id))
      if (next === undefined) {
        if (ids.length > 2 && links.get(current).includes(start)) ids.push(start) // close the loop
        break
      }
      visited.add(next)
      ids.push(next)
      previous = current
      current = next
    }
    lines.push(ids.map(id => points.get(id)))
  }
  for (const [id, linked] of links) if (linked.length === 1 && !visited.has(id)) walk(id)
  for (const id of links.keys()) if (!visited.has(id)) walk(id)
  return lines
}

const lengthOf = line => {
  let length = 0
  for (let i = 1; i < line.length; i++) length += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])
  return length
}

const px = n => Math.round(n)

// Smooth path data for one polyline: every other point, joined with quadratic curves through the
// midpoints, rounded to whole pixels
const smoothPath = line => {
  const kept = line.filter((_, i) => i % 2 === 0 || i === line.length - 1)
  if (kept.length < 3) return `M${px(kept[0][0])} ${px(kept[0][1])}L${px(kept.at(-1)[0])} ${px(kept.at(-1)[1])}`
  const mid = (a, b) => `${px((a[0] + b[0]) / 2)} ${px((a[1] + b[1]) / 2)}`
  let d = `M${px(kept[0][0])} ${px(kept[0][1])}L${mid(kept[0], kept[1])}`
  for (let i = 1; i < kept.length - 1; i++) d += `Q${px(kept[i][0])} ${px(kept[i][1])} ${mid(kept[i], kept[i + 1])}`
  return `${d}L${px(kept.at(-1)[0])} ${px(kept.at(-1)[1])}`
}

// The cell size for a screen: about 8px, larger on very big screens so the work stays bounded
export const gridFor = (width, height) => {
  const cell = Math.max(TARGET_CELL_PX, Math.sqrt((width * height) / MAX_CELLS))
  const cols = Math.max(1, Math.ceil(width / cell))
  const rows = Math.max(1, Math.ceil(height / cell))
  return { cols, rows, cellW: width / cols, cellH: height / rows }
}

// The whole pattern for a screen size:
// { width, height, levels: [{ d, length, index }], trails: [{ d }] }
export const buildTopo = ({ width, height }) => {
  const grid = gridFor(width, height)
  const values = sampleGrid(grid, terrain)
  let low = Infinity
  let high = -Infinity
  for (const row of values) for (const value of row) {
    if (value < low) low = value
    if (value > high) high = value
  }

  const levels = []
  for (let k = 0; k < LEVEL_COUNT; k++) {
    const level = low + ((high - low) * (k + 0.5)) / LEVEL_COUNT
    const lines = contourLines(grid, values, level).filter(line => line.length > 2)
    levels.push({
      d: lines.map(smoothPath).join(''),
      length: lines.reduce((sum, line) => sum + lengthOf(line), 0),
      index: k % INDEX_EVERY === INDEX_EVERY - 1
    })
  }

  // Trails: the longest lines from a few levels of the broad second field
  const trailValues = sampleGrid(grid, trailField)
  const trails = [0.42, 0.5, 0.58]
    .flatMap(level => contourLines(grid, trailValues, level))
    .filter(line => line.length > 2)
    .sort((a, b) => lengthOf(b) - lengthOf(a))
    .slice(0, TRAIL_COUNT)
    .map(line => ({ d: smoothPath(line) }))

  return { width, height, levels, trails }
}

// How far one contour level is drawn (0 to 1), given how far the whole pattern is drawn. Levels
// start one after another across the first 70% and each takes 30%, so many grow at once.
export const levelProgress = (drawn, index, count = LEVEL_COUNT) => {
  if (drawn >= 1) return 1
  const start = count > 1 ? (index / (count - 1)) * 0.7 : 0
  return Math.min(1, Math.max(0, (drawn - start) / 0.3))
}

// The dashed trails fade in over the last 20% of the drawing
export const trailOpacity = drawn => (drawn >= 1 ? 1 : Math.min(1, Math.max(0, (drawn - 0.8) / 0.2)))
