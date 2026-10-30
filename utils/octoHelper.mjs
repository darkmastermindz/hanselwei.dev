// The helper who presses Go now for you when I'm Feeling Lucky's countdown runs out
// (components/LuckyLeave.vue, components/OctoHelper.vue): a little octopus-cat that looks like
// Hansel pops out of a hole 🕳️ under the button. Each time it's one of several personalities, each
// with its own way out of the hole, its own line, and when in the animation the button is pressed.
//
// pressAt: ms into the animation when the button goes down; ms: when it's over and the page goes.

export const PERSONALITIES = [
  { id: 'boop', line: 'Too slow! I got it 😼', pressAt: 900, ms: 1500 },
  { id: 'leap', line: 'Wheee! 🎉', pressAt: 1250, ms: 1800 },
  { id: 'sneak', line: 'Psst… just a little click', pressAt: 1700, ms: 2200 },
  { id: 'drill', line: 'Coming through! 🌀', pressAt: 1100, ms: 1700 },
  { id: 'wave', line: 'Hi! …and bye 👋', pressAt: 1500, ms: 2000 }
]

// random: a number in [0, 1), Math.random's kind
export const pickPersonality = (random = Math.random) =>
  PERSONALITIES[Math.min(PERSONALITIES.length - 1, Math.max(0, Math.floor(random() * PERSONALITIES.length)))]

// With reduced motion: no animation, just a moment to see who's there before the page goes
export const REDUCED = { pressAt: 400, ms: 900 }
