// The 404 page's arcade (components/LostArcade.vue): one classic game, picked at random on each
// visit. Each game's rules are a pure module with newGame(), step() and scoreText().

export const GAMES = [
  { id: 'pong', name: 'Pong', emoji: '🏓', howTo: 'Slide along the bottom, or ← →. First to 5' },
  { id: 'blocks', name: 'Block Breaker', emoji: '🧱', howTo: 'Slide along the bottom, or ← →. Clear every brick' },
  { id: 'invaders', name: 'Space Invaders', emoji: '👾', howTo: 'Hold and slide to move and shoot, or ← → and Space' }
]

// random: a number in [0, 1), Math.random's kind
export const pickGame = (random = Math.random) => GAMES[clamp(Math.floor(random() * GAMES.length), 0, GAMES.length - 1)]

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
