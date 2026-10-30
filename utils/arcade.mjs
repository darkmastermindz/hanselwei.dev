// The 404 page's arcade (components/LostArcade.vue): every classic game it offers, in order. Each
// game's rules are a pure module with newGame(), step() and scoreText().

export const GAMES = [
  { id: 'pong', name: 'Pong', emoji: '🏓', howTo: 'Slide along the bottom, or ← →. First to 5' },
  { id: 'blocks', name: 'Block Breaker', emoji: '🧱', howTo: 'Slide along the bottom, or ← →. Clear every brick' },
  { id: 'invaders', name: 'Space Invaders', emoji: '👾', howTo: 'Hold and slide to move and shoot, or ← → and Space' }
]
