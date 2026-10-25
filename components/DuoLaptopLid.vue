<template>
  <!-- Only on iPhone Duo's front screen (<html data-device="iphone-duo-cover">): a laptop shuts its
       lid and turns it to face you, with the site's QR code where the logo would be. A nod to
       the phone itself, which closes the same way. -->
  <figure class="duo-lid">
    <div class="duo-lid__stage" aria-hidden="true">
      <div class="duo-lid__laptop">
        <div class="duo-lid__base" />
        <div class="duo-lid__lid">
          <div class="duo-lid__screen">
            <span class="duo-lid__code">&lt;HanselWei /&gt;</span>
            <span class="duo-lid__code duo-lid__code--dim">// unfold me ✨</span>
          </div>
          <div class="duo-lid__cover">
            <svg class="duo-lid__qr" :viewBox="`-2 -2 ${qr.size + 4} ${qr.size + 4}`" shape-rendering="crispEdges">
              <rect x="-2" y="-2" :width="qr.size + 4" :height="qr.size + 4" rx="1.5" class="duo-lid__qr-plate" />
              <path :d="qr.path" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <figcaption class="duo-lid__caption">
      Scan the lid to share <a :href="qr.url">hanselwei.dev</a> · unfold for more
    </figcaption>
  </figure>
</template>

<script setup>
// Built at build time from https://hanselwei.dev (scripts/build-coin-bubble.mjs)
import qr from '~/data/siteQr.generated.mjs'
</script>

<style scoped>
.duo-lid {
  display: none;
}

:root[data-device='iphone-duo-cover'] .duo-lid {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.25rem auto 0.5rem;
  --w: min(17rem, 78vw);
  --d: calc(var(--w) * 0.66);
}

.duo-lid__stage {
  perspective: 900px;
  width: var(--w);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Room above for the open lid, closing up as it shuts */
  padding: 0.5rem 0;
  animation: duo-lid-room 3.2s cubic-bezier(0.45, 0, 0.2, 1) 0.4s both;
}

/* The laptop lies on the table, seen from above at an angle; once shut, it tilts its lid to you */
.duo-lid__laptop {
  position: relative;
  width: var(--w);
  height: var(--d);
  transform-style: preserve-3d;
  transform: rotateX(0deg);
  animation: duo-lid-tilt 3.2s cubic-bezier(0.45, 0, 0.2, 1) 0.4s both;
}

.duo-lid__base {
  position: absolute;
  inset: 0;
  border-radius: 0.6rem;
  background:
    repeating-linear-gradient(90deg, transparent 0 0.9rem, rgba(0, 0, 0, 0.35) 0.9rem 1rem) 8% 18% / 84% 52% no-repeat,
    linear-gradient(160deg, #b9bec6, #8d939c);
  transform: translateZ(-2px);
}

/* The lid hinges on the far edge: open, it stands up (its screen to you); shut, it lies flat */
.duo-lid__lid {
  position: absolute;
  inset: 0;
  transform-origin: 50% 0;
  transform-style: preserve-3d;
  transform: rotateX(0deg);
  animation: duo-lid-close 3.2s cubic-bezier(0.5, 0, 0.25, 1) 0.4s both;
}

.duo-lid__screen,
.duo-lid__cover {
  position: absolute;
  inset: 0;
  border-radius: 0.6rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.duo-lid__screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  padding: 0 1.1rem;
  border: 0.45rem solid #111;
  background: #0d1117;
  transform: rotateX(180deg);
}

.duo-lid__code {
  font-family: "Nova Mono", monospace;
  font-size: 0.85rem;
  color: #7cfc00;
}

.duo-lid__code--dim {
  color: #c084fc;
}

/* Brushed aluminium, with a light sweeping across it now and then */
.duo-lid__cover {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%) -150% 0 / 200% 100% no-repeat,
    linear-gradient(160deg, #e3e6ea, #aeb4bc);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  animation: duo-lid-sheen 4s ease-in-out 3.8s infinite;
}

.duo-lid__qr {
  width: 46%;
  aspect-ratio: 1;
  fill: #1d232a;
  filter: drop-shadow(0 0 6px rgba(124, 252, 0, 0.55));
}

.duo-lid__qr-plate {
  fill: #f4f5f7;
}

.duo-lid__caption {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: #bbb;
  text-align: center;
}

.duo-lid__caption a {
  color: #7cfc00;
  text-decoration: underline;
}

@keyframes duo-lid-close {
  0%, 25% { transform: rotateX(105deg); }
  68% { transform: rotateX(0deg); }
  73% { transform: rotateX(5deg); } /* a little bounce as it shuts */
  78%, 100% { transform: rotateX(0deg); }
}

@keyframes duo-lid-tilt {
  0%, 72% { transform: rotateX(38deg); }
  100% { transform: rotateX(0deg); }
}

@keyframes duo-lid-room {
  0%, 25% { padding-top: calc(var(--d) * 0.85); }
  78%, 100% { padding-top: 0.5rem; }
}

@keyframes duo-lid-sheen {
  0%, 60% { background-position: -150% 0, 0 0; }
  100% { background-position: 250% 0, 0 0; }
}

/* Reduced motion: just the shut lid, facing you */
@media (prefers-reduced-motion: reduce) {
  .duo-lid__stage,
  .duo-lid__laptop,
  .duo-lid__lid,
  .duo-lid__cover {
    animation: none;
  }
}
</style>
