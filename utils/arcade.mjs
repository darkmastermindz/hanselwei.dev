// The 404 page's arcade (components/LostArcade.vue): every classic game it offers, in order. Each
// game's rules are a pure module with newGame(), step() and scoreText().

export const GAMES = [
  { id: 'paddle', name: 'Paddle Ball', emoji: '🏓', howTo: 'Slide along the bottom, or ← →. First to 5' },
  { id: 'bricks', name: 'Brick Bash', emoji: '🧱', howTo: 'Slide along the bottom, or ← →. Clear every brick' },
  { id: 'aliens', name: 'Alien Attack', emoji: '👾', howTo: 'Hold and slide to move and shoot, or ← → and Space' }
]
