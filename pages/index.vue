<template>
  <div class="outer" role="main">
    <div class="text-center justify-center py-4">
      <Bitmoji />
    </div>
    <h1 class="title sm:text-4xl md:text-5xl lg:text-6xl grow">
      <strong>Hansel Wei</strong>
    </h1>
    
    <div class="p-2 m-3 shrink">
      <Socials/>
    </div>

      <h2 class="text-center justify-center d-flex flex-column text-base p-10 sm:space-x-2 sm:space-y-2 lg:space-x-4 lg:space-y-4 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animate-none touch-auto">
        <ul class="place-items-center antialiased sm:subpixel-antialiased md:antialiased p-5 mb-5">
          <li
            class="sm:p-4 md:flex-inline sm:mb-5 text-green-200 animate-bounce ease-in-out infinite touch-auto">
            { "I am a" : [ "Senior Software Developer", "Full Stack Engineer",
            "Secured Infrastructure Professional", "Data Scientist", "Developer Experience Advocate", "Emerging Tech Fanactic!", "✨" ] },</li>
          <li
            class="sm:p-4 md:flex-inline sm:mb-5 text-purple-300 animate-pulse ease-in-out infinite touch-auto">
            { "My hobbies include" : [ "Hiking", "Photography", "Watching Anime", "Coffee", "Board Games", "Rock Climbing", "🧗🏻‍♂️" ] }</li>
          <br />
        </ul>
      </h2>
    </div>
</template>

<script>
import Bitmoji from "~/components/Bitmoji.vue";
import Socials from '~/components/Socials.vue';

export default {
  components: {
    Bitmoji,
    Socials
  }
};
</script>

<style lang="scss">
.container {
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

.title {
  font-family: "Roboto Mono", "Quicksand", "Source Sans Pro", -apple-system,
    BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  display: inline;
  font-weight: 20em;
  color: #eee;
  letter-spacing: 1px;
  left: -50%;
}

.hello {
  font-weight: 300;
  font-size: 2em;
  color: #00b8ff;
}

.subtitle {
  margin: 2em 8em;
  text-align: center;
  font-weight: 300;
  font-size: 2em;
  line-height: 2.5em;
  color: #00b8ff;
}

.links {
  padding-top: 15px;
}

.outer {
  justify-content: center;
  align-items: center;
  text-align: center;
}

mark {
  background-color: transparent;
  color: white;
}
</style>
