<template>
  <div class="outer">
    <div class="text-center justify-center py-4">
      <Bitmoji />
    </div>
    <h1 class="title sm:text-4xl md:text-5xl lg:text-6xl grow">
      <strong>Hansel Wei</strong>
    </h1>
    
    <div class="p-2 m-3 shrink">
       
     
    <Socials/>
 </div>
      <h2 class="m-3 p-4 flex md:flex-col sm:flex-row motion-reduce:transition-none motion-reduce:transform-none">
        <ul class="antialiased sm:subpixel-antialiased md:antialiased">
          <li
            class="p-4 md:flex mb-2 tracking-tight rounded-box place-items-center text-green-200 animate-bounce ease-in-out infinite touch-auto">
            { "I am a" : [ "Senior Software Developer", "Full Stack Engineer",
            "Secured Infrastructure Professional", "Data Scientist", "Developer Experience Advocate", "Emerging Tech Fanactic!", "✨" ] },</li>
          <li
            class="p-4 md:flex mb-2 tracking-tight rounded-box place-items-center text-purple-300 animate-pulse ease-in-out infinite touch-auto">
            { "My hobbies include" : [ "Hiking", "Playing
            Video Games", "Watching Anime", "Coffee", "Board Games", "Rock Climbing", "🧗🏻‍♂️" ] }</li>
          <br />
        </ul>
      </h2>
    </div>
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
