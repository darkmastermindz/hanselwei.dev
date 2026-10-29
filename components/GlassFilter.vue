<template>
  <!-- The header's Liquid Glass refraction (assets/css/materials.css). Low-frequency noise nudges
       the blurred page behind it a few pixels, so it reads as thick, slightly uneven glass. -->
  <svg class="glass-filter" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="7" result="noise" />
      <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
      <feDisplacementMap in="SourceGraphic" in2="soft" scale="14" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
</template>

<style scoped>
.glass-filter {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
