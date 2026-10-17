// Facts and motivation revealed by spinning the profile token on the home page.
// Each entry is tied to one of the hobbies listed on the home page.
const hobbies = {
  hiking: { label: 'Hiking', emoji: '🥾' },
  photography: { label: 'Photography', emoji: '📷' },
  anime: { label: 'Anime', emoji: '🍥' },
  coffee: { label: 'Coffee', emoji: '☕' },
  boardgames: { label: 'Board Games', emoji: '🎲' },
  climbing: { label: 'Rock Climbing', emoji: '🧗' }
}

const fact = (id, hobby, text) => ({ id, type: 'fact', ...hobbies[hobby], hobby, text })
const quote = (id, hobby, text, author) => ({ id, type: 'quote', ...hobbies[hobby], hobby, text, author })

export const hobbyFacts = [
  // Rock climbing
  fact('climb-olympics', 'climbing', 'Sport climbing made its Olympic debut at the Tokyo 2020 Games, held in 2021.'),
  fact('climb-freerider', 'climbing', 'In 2017 Alex Honnold free soloed Freerider on El Capitan, about 3,000 ft, in 3 hours 56 minutes.'),
  fact('climb-vscale', 'climbing', 'The bouldering V-scale is named after John "Vermin" Sherman, who created it at Hueco Tanks, Texas.'),
  fact('climb-chalk', 'climbing', 'Climbing chalk is magnesium carbonate. Gymnast-turned-boulderer John Gill brought it to climbing in the 1950s.'),
  quote('climb-lowe', 'climbing', "The best climber in the world is the one who's having the most fun.", 'Alex Lowe'),
  quote('climb-proverb', 'climbing', 'Fall seven times, stand up eight.', 'Japanese proverb'),
  quote('climb-hillary', 'climbing', "It is not the mountain we conquer, but ourselves.", 'Sir Edmund Hillary'),

  // Hiking
  fact('hike-at', 'hiking', 'The Appalachian Trail runs roughly 2,190 miles through 14 states, from Georgia to Maine.'),
  fact('hike-pct', 'hiking', 'The Pacific Crest Trail stretches about 2,650 miles from the Mexican border to Canada.'),
  fact('hike-creativity', 'hiking', 'A 2014 Stanford study found walking boosted creative thinking by around 60% compared to sitting.'),
  quote('hike-muir-walk', 'hiking', 'In every walk with nature one receives far more than he seeks.', 'John Muir'),
  quote('hike-muir-calling', 'hiking', 'The mountains are calling and I must go.', 'John Muir'),

  // Photography
  fact('photo-first', 'photography', 'The oldest surviving camera photograph, "View from the Window at Le Gras" (c. 1827), needed an exposure of hours, possibly days.'),
  fact('photo-word', 'photography', '"Photography" comes from Greek words meaning "drawing with light".'),
  fact('photo-thirds', 'photography', 'The "rule of thirds" was named in 1797 by painter John Thomas Smith, long before cameras.'),
  quote('photo-adams', 'photography', "You don't take a photograph, you make it.", 'Ansel Adams'),

  // Anime
  fact('anime-ghibli', 'anime', 'Studio Ghibli is named after an Italian word for a hot Saharan wind, meant to "blow a new wind" through animation.'),
  fact('anime-spirited', 'anime', 'Spirited Away won the Academy Award for Best Animated Feature in 2003.'),
  fact('anime-astro', 'anime', "Osamu Tezuka's Astro Boy (1963) helped define the weekly TV anime format."),
  quote('anime-luffy', 'anime', "If you don't take risks, you can't create a future!", 'Monkey D. Luffy, One Piece'),
  quote('anime-naruto', 'anime', "Hard work is worthless for those that don't believe in themselves.", 'Naruto Uzumaki, Naruto'),

  // Coffee
  fact('coffee-seeds', 'coffee', 'Coffee "beans" are actually the seeds of a fruit called the coffee cherry.'),
  fact('coffee-finland', 'coffee', 'Finland drinks more coffee per person than any other country.'),
  fact('coffee-kaldi', 'coffee', 'Legend says an Ethiopian goatherd named Kaldi discovered coffee after his goats got energetic eating the berries.'),
  quote('coffee-chan', 'coffee', 'Coffee is a language in itself.', 'Jackie Chan'),

  // Board games
  fact('board-senet', 'boardgames', 'Senet, from ancient Egypt, is one of the oldest known board games: over 5,000 years old.'),
  fact('board-shannon', 'boardgames', 'There are an estimated 10^120 possible chess games, far more than the ~10^80 atoms in the observable universe.'),
  fact('board-catan', 'boardgames', 'Catan was first published in Germany in 1995 as "Die Siedler von Catan".'),
  quote('board-chernev', 'boardgames', 'Every chess master was once a beginner.', 'Irving Chernev')
]
