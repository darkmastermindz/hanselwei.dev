// Builds the topographic background off the main thread for components/TopoBackground.vue, so
// taps and scrolling stay smooth while it works. The message is just the screen size.
import { buildTopo } from '../utils/topo.mjs'

self.onmessage = ({ data }) => {
  self.postMessage(buildTopo({ width: Number(data?.width) || 0, height: Number(data?.height) || 0 }))
}
