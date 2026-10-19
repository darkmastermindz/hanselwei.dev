<template>
  <!-- A photo pinned to the page: an instant print with a strip of 35mm film edge down one side.
       Drawn into a canvas (no <img> to save, drag or long-press), from /api/bio-photo, which only
       answers this site's own page. Decorative markings are hidden from screen readers. -->
  <figure class="pinned" @contextmenu.prevent @dragstart.prevent @selectstart.prevent>
    <span class="pinned__pin" aria-hidden="true" />
    <div class="pinned__print">
      <div class="pinned__shot">
        <div class="pinned__edge" aria-hidden="true">
          <span>FUJIFILM 400H</span>
          <span>▶ 12</span>
          <span>12A</span>
        </div>
        <canvas ref="canvas" class="pinned__photo" :class="{ 'is-shown': shown }" role="img" aria-label="Photo of Hansel" />
        <!-- Above the photo, so a press or right-click lands on this, not the canvas -->
        <span class="pinned__guard" aria-hidden="true" />
      </div>
      <figcaption class="pinned__caption" aria-hidden="true">Hansel · NYC</figcaption>
    </div>
  </figure>
</template>

<script setup>
const canvas = ref(null)
const shown = ref(false)

onMounted(async () => {
  try {
    const response = await fetch('/api/bio-photo', { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) return // no photo: the empty print stays as a placeholder
    const bitmap = await createImageBitmap(await response.blob())
    const el = canvas.value
    if (!el) return
    el.width = bitmap.width
    el.height = bitmap.height
    el.getContext('2d').drawImage(bitmap, 0, 0)
    bitmap.close?.()
    shown.value = true
  } catch {
    // Offline or blocked: keep the placeholder
  }
})
</script>

<style scoped>
.pinned {
  position: relative;
  width: min(15rem, 70vw);
  margin: 1.75rem auto 1rem;
  transform: rotate(-2.5deg);
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

@media (min-width: 640px) {
  .pinned {
    float: right;
    margin: 0.75rem 0 1rem 1.5rem;
    transform: rotate(3deg);
  }
}

/* Instant print: cream card with the wide bottom border */
.pinned__print {
  padding: 0.6rem 0.6rem 0;
  background: linear-gradient(160deg, #fbf8f1, #efe9dc);
  border-radius: 3px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.pinned__shot {
  position: relative;
  display: flex;
  aspect-ratio: 2 / 3;
  background: #1a1a1a;
  overflow: hidden;
}

/* 35mm film edge: sprocket holes and the orange edge printing */
.pinned__edge {
  flex: 0 0 1.35rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  background:
    radial-gradient(ellipse 0.3rem 0.22rem at 0.38rem 50%, #e9e4d6 98%, transparent 100%) 0 0 / 100% 0.85rem repeat-y,
    #1b120c;
  font: 600 0.55rem/1 ui-monospace, 'SFMono-Regular', Menlo, monospace;
  letter-spacing: 0.12em;
  color: #f08a24;
  text-shadow: 0 0 2px rgba(240, 138, 36, 0.6);
}

.pinned__edge span {
  writing-mode: vertical-rl;
  padding-left: 0.55rem; /* clear of the sprocket holes */
}

.pinned__photo {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

.pinned__photo.is-shown {
  opacity: 1;
}

.pinned__guard {
  position: absolute;
  inset: 0;
}

.pinned__caption {
  padding: 0.7rem 0 0.85rem;
  text-align: center;
  font: 1.15rem/1 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  color: #3a3a46;
}

/* A red push pin at the top */
.pinned__pin {
  position: absolute;
  top: -0.55rem;
  left: 50%;
  z-index: 1;
  width: 1.1rem;
  height: 1.1rem;
  margin-left: -0.55rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8a8a, #d61f2c 55%, #8b0f17);
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .pinned__photo {
    transition: none;
  }
}
</style>
