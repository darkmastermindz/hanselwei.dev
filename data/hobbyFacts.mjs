// Facts and motivation revealed by spinning the profile token on the home page.
// Each entry is tied to a hobby (most are listed on the home page), origami, software engineering,
// or social data science.
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
  stainedglass: { label: 'Stained Glass', emoji: '🪟' },
  stargazing: { label: 'Stargazing', emoji: '🔭' },
  origami: { label: 'Origami', emoji: '🦢' },
  software: { label: 'Software Engineering', emoji: '💻' },
  datascience: { label: 'Social Data Science', emoji: '📊' }
}

// `source`: for a fact from a study, a link to the study itself. `sourceLabel` names the link
// when it isn't a study (the card says "Read the study" otherwise)
const fact = (id, hobby, text, source, sourceLabel) => ({
  id, type: 'fact', ...hobbies[hobby], hobby, text, ...(source && { source }), ...(sourceLabel && { sourceLabel })
})
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
  fact('hike-creativity', 'hiking', 'A 2014 Stanford study found walking boosted creative thinking by around 60% compared to sitting.', 'https://doi.org/10.1037/a0036577'),
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
  quote('anime-zeniba', 'anime', "Once you've met someone you never really forget them. It just takes a while for your memories to return.", 'Zeniba, Spirited Away'),
  quote('anime-hii', 'anime', 'You cannot alter your fate. However, you can rise to meet it, if you so choose.', 'Hii-sama, Princess Mononoke'),
  quote('anime-baron', 'anime', 'Always believe in yourself. Do this and no matter where you are, you will have nothing to fear.', 'The Baron, The Cat Returns'),
  quote('anime-howl', 'anime', "A heart's a heavy burden.", "Howl, Howl's Moving Castle"),
  quote('anime-wind', 'anime', 'The wind is rising! We must try to live.', 'Jiro Horikoshi, The Wind Rises'),

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
  fact('yoga-limbs', 'yoga', "Patanjali's Yoga Sutras describe eight limbs of yoga. The first two are the yamas (restraints: how you treat others) and the niyamas (observances: how you treat yourself)."),
  fact('yoga-yamas', 'yoga', 'The five yamas are ahimsa (non-harm), satya (truthfulness), asteya (non-stealing), brahmacharya (moderation) and aparigraha (non-greed).'),
  fact('yoga-niyamas', 'yoga', 'The five niyamas are saucha (cleanliness), santosha (contentment), tapas (discipline), svadhyaya (self-study) and ishvara pranidhana (surrender to something greater).'),
  fact('yoga-sutra-1-2-words', 'yoga', 'Yoga Sutra 1.2 defines yoga in four words: yogaś (yoga) citta (of the mind) vṛtti (turnings, or fluctuations) nirodhaḥ (stilling).'),
  fact('yoga-chakras', 'yoga', 'Seven chakras, or energy centers, run from the base of the spine to the crown of the head: root, sacral, solar plexus, heart, throat, third eye and crown.'),
  fact('yoga-chakra-elements', 'yoga', 'Each of the lower five chakras has an element: root (Muladhara) earth, sacral (Svadhisthana) water, solar plexus (Manipura) fire, heart (Anahata) air and throat (Vishuddha) space. The third eye (Ajna) is tied to light and the mind, the crown (Sahasrara) to pure awareness.'),
  fact('yoga-chakra-colors', 'yoga', 'From root to crown, the chakras are often shown red, orange, yellow, green, blue, indigo and violet. That rainbow is a 20th-century Western addition; older texts picture each chakra as a lotus with its own number of petals.'),
  quote('yoga-sutra-1-2', 'yoga', 'Yogaś citta-vṛtti-nirodhaḥ: yoga is the stilling of the changing states of the mind.', 'Patanjali, Yoga Sutras 1.2'),
  quote('yoga-sutra-2-46', 'yoga', 'Posture should be steady and comfortable.', 'Patanjali, Yoga Sutras 2.46'),
  quote('yoga-iyengar', 'yoga', 'Yoga teaches us to cure what need not be endured and endure what cannot be cured.', 'B. K. S. Iyengar'),
  quote('yoga-gita', 'yoga', 'Yoga is the journey of the self, through the self, to the self.', 'The Bhagavad Gita'),

  // Running
  fact('run-marathon', 'running', 'The marathon was fixed at 26.2 miles (42.195 km) in 1921, based on the 1908 London Olympics course.'),
  fact('run-kipchoge', 'running', 'In 2019 Eliud Kipchoge ran a marathon distance in 1:59:40, the first ever under two hours (not record-eligible).'),
  quote('run-bingham', 'running', "The miracle isn't that I finished. The miracle is that I had the courage to start.", 'John Bingham'),
  quote('run-karnazes', 'running', 'Run when you can, walk if you have to, crawl if you must; just never give up.', 'Dean Karnazes'),

  // Community building
  fact('community-dunbar', 'community', "Anthropologist Robin Dunbar estimated people can keep about 150 stable relationships: \"Dunbar's number\"."),
  fact('community-harvard', 'community', 'The Harvard Study of Adult Development, running since 1938, found close relationships are a top predictor of lifelong happiness.', 'https://www.adultdevelopmentstudy.org/'),
  quote('community-mead', 'community', 'Never doubt that a small group of thoughtful, committed citizens can change the world; indeed, it\'s the only thing that ever has.', 'Margaret Mead'),
  quote('community-proverb', 'community', 'If you want to go fast, go alone. If you want to go far, go together.', 'African proverb'),
  quote('community-bend', 'community', 'If we can bend a little, maybe shift our perception and appreciate a different point of view, we can perhaps improve the world around us.', 'Unknown'),

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
  quote('glass-kubler-ross', 'stainedglass', 'People are like stained-glass windows. They sparkle and shine when the sun is out, but when the darkness sets in, their true beauty is revealed only if there is a light from within.', 'Elisabeth Kübler-Ross'),

  // Stargazing
  fact('stars-count', 'stargazing', 'About 9,000 stars are bright enough to see without a telescope across the whole sky; under a truly dark sky you can see a few thousand at once.'),
  fact('stars-andromeda', 'stargazing', 'The Andromeda Galaxy, about 2.5 million light-years away, is the farthest thing most people can see with their own eyes.'),
  fact('stars-bortle', 'stargazing', 'The Bortle scale rates how dark a sky is, from 1 (the darkest) to 9 (an inner city). Amateur astronomer John Bortle published it in 2001.'),
  fact('stars-milkyway', 'stargazing', 'A 2016 world atlas of light pollution found that more than a third of humanity can no longer see the Milky Way from home.', 'https://doi.org/10.1126/sciadv.1600377'),
  quote('stars-sagan', 'stargazing', 'The cosmos is within us. We are made of star-stuff.', 'Carl Sagan'),

  // Origami
  fact('origami-senbazuru', 'origami', 'In Japan, folding a thousand paper cranes (senbazuru) is said to grant a wish.'),
  fact('origami-sadako', 'origami', "Sadako Sasaki survived the Hiroshima bombing as a toddler and folded paper cranes while she had leukemia. A statue of her holding a crane stands at Hiroshima's Children's Peace Monument."),

  // Software engineering
  fact('sw-lovelace', 'software', 'In 1843 Ada Lovelace published a method for the Analytical Engine to work out Bernoulli numbers, often called the first computer program.'),
  fact('sw-bug', 'software', 'On September 9, 1947, Grace Hopper\'s team found a moth stuck in a relay of a Harvard computer and taped it into the logbook: the "first actual case of bug being found".'),
  fact('sw-compiler', 'software', 'Grace Hopper wrote one of the first compilers, A-0, in 1952: a program that turns human-written instructions into machine code.'),
  fact('sw-hamilton', 'software', 'Margaret Hamilton led the team that wrote the Apollo flight software, and helped make "software engineering" a recognized discipline.'),
  quote('sw-lovelace-loom', 'software', 'The Analytical Engine weaves algebraical patterns just as the Jacquard loom weaves flowers and leaves.', 'Ada Lovelace'),
  quote('sw-hopper-always', 'software', "The most dangerous phrase in the language is, 'We've always done it this way.'", 'Grace Hopper'),
  quote('sw-hopper-ship', 'software', "A ship in port is safe, but that's not what ships are built for.", 'Grace Hopper'),
  quote('sw-brooks', 'software', 'Adding manpower to a late software project makes it later.', 'Fred Brooks'),
  quote('sw-torvalds', 'software', 'Talk is cheap. Show me the code.', 'Linus Torvalds'),

  // Social data science: what it is, then findings from large studies of people, each linked to its source
  fact('ds-definition', 'datascience', 'Social data science is an interdisciplinary field that tackles social science questions with computational and digital methods, drawing on data science, network science and computer science. Its data is always about people.', 'https://en.wikipedia.org/wiki/Social_data_science', 'Wikipedia'),
  fact('ds-happiness-report', 'datascience', 'Finland topped the 2026 World Happiness Report for the ninth year in a row. The rankings come from people in more than 140 countries rating their own lives.', 'https://www.unsdsn.org/resources/world-happiness-report-2026'),
  fact('ds-wandering-mind', 'datascience', 'In a 2010 Science paper, Harvard psychologists Matthew Killingsworth and Daniel Gilbert found our minds wander 46.9% of waking hours: "a human mind is a wandering mind, and a wandering mind is an unhappy mind."', 'https://news.harvard.edu/gazette/story/2010/11/wandering-mind-not-a-happy-mind/'),
  fact('ds-happiness-spreads', 'datascience', "A 2008 study of the Framingham Heart Study's social network found happiness spreads up to three degrees of separation: to your friends' friends' friends.", 'https://doi.org/10.1136/bmj.a2338'),
  fact('ds-four-degrees', 'datascience', 'A 2012 study of 721 million Facebook users found any two of them were, on average, 4.74 hops apart: closer than the classic "six degrees".', 'https://arxiv.org/abs/1111.4570'),
  fact('ds-kevin-bacon', 'datascience', 'In 1994 three Albright College students invented Six Degrees of Kevin Bacon: link any actor to Bacon through films they shared. It is a classic graph problem (actors are nodes, shared films are edges, an actor\'s "Bacon number" is the length of the shortest path to Bacon) often set in data structures courses.', 'https://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon', 'Wikipedia')
]
