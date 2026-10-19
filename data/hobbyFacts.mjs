// Facts and motivation revealed by spinning the profile token on the home page.
// Each entry is tied to one of the hobbies listed on the home page.
const hobbies = {
  hiking: { label: 'Hiking', emoji: '🥾' },
  photography: { label: 'Photography', emoji: '📷' },
  anime: { label: 'Anime', emoji: '🍥' },
  coffee: { label: 'Coffee', emoji: '☕' },
  boardgames: { label: 'Board Games', emoji: '🎲' },
  climbing: { label: 'Rock Climbing', emoji: '🧗' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  running: { label: 'Running', emoji: '🏃' },
  community: { label: 'Community Building', emoji: '🤝' },
  maker: { label: 'Maker', emoji: '🛠️' },
  stainedglass: { label: 'Stained Glass', emoji: '🪟' }
}

const fact = (id, hobby, text) => ({ id, type: 'fact', ...hobbies[hobby], hobby, text })
const quote = (id, hobby, text, author) => ({ id, type: 'quote', ...hobbies[hobby], hobby, text, author })

export const hobbyFacts = [
  // Rock climbing
  fact('climb-olympics', 'climbing', 'Sport climbing made its Olympic debut at the Tokyo 2020 Games, held in 2021.'),
  fact('climb-freerider', 'climbing', 'In 2017 Alex Honnold free soloed Freerider on El Capitan, about 3,000 ft, in 3 hours 56 minutes.'),
  fact('climb-vscale', 'climbing', 'The bouldering V-scale is named after John "Verm" Sherman, who created it at Hueco Tanks, Texas.'),
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
  fact('board-shannon', 'boardgames', 'There are an estimated 10¹²⁰ possible chess games, far more than the ~10⁸⁰ atoms in the observable universe.'),
  fact('board-catan', 'boardgames', 'Catan was first published in Germany in 1995 as "Die Siedler von Catan".'),
  quote('board-chernev', 'boardgames', 'Every chess master was once a beginner.', 'Irving Chernev'),

  // Yoga
  fact('yoga-yuj', 'yoga', '"Yoga" comes from the Sanskrit root "yuj", meaning to yoke or unite.'),
  fact('yoga-day', 'yoga', 'The United Nations declared June 21 the International Day of Yoga in 2014.'),
  quote('yoga-gita', 'yoga', 'Yoga is the journey of the self, through the self, to the self.', 'The Bhagavad Gita'),

  // Running
  fact('run-marathon', 'running', 'The marathon was fixed at 26.2 miles (42.195 km) in 1921, based on the 1908 London Olympics course.'),
  fact('run-kipchoge', 'running', 'In 2019 Eliud Kipchoge ran a marathon distance in 1:59:40, the first ever under two hours (not record-eligible).'),
  quote('run-bingham', 'running', "The miracle isn't that I finished. The miracle is that I had the courage to start.", 'John Bingham'),
  quote('run-karnazes', 'running', 'Run when you can, walk if you have to, crawl if you must; just never give up.', 'Dean Karnazes'),

  // Community building
  fact('community-dunbar', 'community', "Anthropologist Robin Dunbar estimated people can keep about 150 stable relationships: \"Dunbar's number\"."),
  fact('community-harvard', 'community', 'The Harvard Study of Adult Development, running since 1938, found close relationships are a top predictor of lifelong happiness.'),
  quote('community-mead', 'community', 'Never doubt that a small group of thoughtful, committed citizens can change the world; indeed, it\'s the only thing that ever has.', 'Margaret Mead'),
  quote('community-proverb', 'community', 'If you want to go fast, go alone. If you want to go far, go together.', 'African proverb'),

  // Maker
  fact('maker-faire', 'maker', 'The first Maker Faire was held in San Mateo, California, in 2006.'),
  fact('maker-arduino', 'maker', 'Arduino was created in 2005 at the Interaction Design Institute Ivrea in Italy as a cheap board for student projects.'),
  fact('maker-pi', 'maker', 'The Raspberry Pi launched in 2012 to get more kids into computer science; the original Model B cost $35.'),
  fact('maker-reprap', 'maker', 'The RepRap project (2005) set out to build a 3D printer that could print most of its own parts.'),
  quote('maker-kay', 'maker', 'The best way to predict the future is to invent it.', 'Alan Kay'),
  quote('maker-whole-earth', 'maker', 'Stay hungry. Stay foolish.', 'Whole Earth Catalog (1974)'),

  // Stained glass
  fact('glass-augsburg', 'stainedglass', "The Prophet Windows in Germany's Augsburg Cathedral, from around 1100, are among the oldest stained glass windows still in place."),
  fact('glass-sainte-chapelle', 'stainedglass', "Paris's Sainte-Chapelle (1248) has 15 towering windows that tell 1,113 scenes from the Bible."),
  fact('glass-chartres', 'stainedglass', "Chartres Cathedral keeps one of the most complete sets of medieval stained glass, famous for its deep \"Chartres blue\"."),
  fact('glass-myth', 'stainedglass', 'Old windows are thicker at the bottom not because glass flows, but because panes were uneven and glaziers set the heavy edge down.'),
  fact('glass-gold', 'stainedglass', 'Ruby or "cranberry" glass gets its red from tiny particles of gold; deep blues come from cobalt.'),
  fact('glass-tiffany', 'stainedglass', "Louis Comfort Tiffany's studios popularized the copper-foil method that makes detailed lamps and small pieces possible."),
  quote('glass-kubler-ross', 'stainedglass', 'People are like stained-glass windows. They sparkle and shine when the sun is out, but when the darkness sets in, their true beauty is revealed only if there is a light from within.', 'Elisabeth Kübler-Ross')
]
