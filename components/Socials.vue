<template>
  <nav class="socials" aria-label="Find me elsewhere">
    <SocialFlipLink v-for="(link, i) in links" :key="link.label" v-bind="link" :index="i" />
  </nav>
</template>

<script setup>
const links = [
  { label: 'GitHub', back: '🦄 @darkmastermindz', href: 'https://github.com/darkmastermindz', bg: 'bg-[#24292f]', effect: 'unicorn' },
  { label: 'Mastodon', back: '🐘 Toot at me', href: 'https://hansel.run/mastodon', bg: 'bg-[#563acc]' },
  { label: 'Messenger', back: '💬 Say hi!', href: 'https://m.me/hanselwei', bg: 'bg-blue-600' },
  { label: 'Instagram', back: '📸 See my photos', href: 'https://hansel.rocks', bg: 'bg-[#c7501a]' },
  { label: 'DEV Community', back: '✍️ @hansel', href: 'https://dev.to/hansel', bg: 'bg-black' },
  { label: 'LinkedIn', back: '💼 Let’s connect', href: 'https://linkedin.com/in/hanselwei', bg: 'bg-[#0a66c2]' },
  {
    label: 'Strava',
    back: '🏃 Run with me',
    backs: ['🏃 Run with me', '🗺️ Sidequest with me', '🛶 Paddle with me', '🧗 Rock climb with me'],
    href: 'https://www.strava.com/athletes/129101734',
    bg: 'bg-[#c73e00]'
  },
  { label: 'Send Email', back: '✉️ Drop me a line', href: 'mailto:Hansel Wei (hanselwei.dev) <hello+hansel@hanselwei.dev>', bg: 'bg-[#008856]' }
]
</script>

<style scoped>
/* Pills wrap onto centered lines, like the original layout on main */
.socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 0.6rem;
  max-width: 44rem;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
