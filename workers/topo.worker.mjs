// Builds the topographic background off the main thread for components/TopoBackground.vue, so
// taps and scrolling stay smooth while it works. The message is the screen size plus the
// settings from config.toml [background] (already checked at build time).
import { buildTopo } from '../utils/topo.mjs'

const whole = value => (Number.isInteger(value) ? value : undefined)

self.onmessage = ({ data }) => {
  self.postMessage(
    buildTopo({
      width: Number(data?.width) || 0,
      height: Number(data?.height) || 0,
      contours: whole(data?.contours),
      featureSize: whole(data?.featureSize),
      indexEvery: whole(data?.indexEvery),
      trails: whole(data?.trails),
      startContours: whole(data?.startContours),
      cellSize: whole(data?.cellSize)
    })
  )
}
