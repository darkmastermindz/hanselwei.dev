<template>
  <div class="outer">
    <div class="text-center justify-center py-4">
      <Bitmoji />
    </div>
    <h1 class="title sm:text-4xl md:text-5xl lg:text-6xl grow">
      <strong>Hansel Wei</strong>
    </h1>

    <div class="text-center max-w-7xl mx-auto p-2 m-3 md:flex-col sm:shrink">
      <div class="shrink">
        <span
          class="relative z-0 justify-center px-8  shadow-sm rounded-md font-bold md:antialiased sm:subpixel-antialiased">
          <a href="https://github.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-grey-700 relative inline-flex items-center px-8 py-2 rounded-l-md border">Github</a>
          <a href="https://twitter.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-blue-400 relative inline-flex items-center px-8 py-2 rounded-l-md border">Twitter</a>
          <a href="https://snapchat.com/add/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib gray-50 bg-yellow-300 relative inline-flex items-center px-8 py-2 rounded-l-md border">Snapchat</a>
          <a href="https://m.me/hanselwei" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-blue-600 relative inline-flex items-center px-8 py-2 rounded-l-md border">Messenger</a>
          <a href="https://instagram.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-red relative inline-flex items-center px-8 py-2 rounded-l-md border">Instagram</a>
          <a href="https://polywork.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-purple-700 relative inline-flex items-center px-8 py-2 rounded-l-md border">Polywork</a>
          <a href="https://linkedin.com/in/hanselwei" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-blue-700 relative inline-flex items-center px-8 py-2 rounded-l-md border">Linkedin</a>
          <a href="mailto:Hansel Wei (hanselwei.dev) <hello@hanselwei.dev>" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-green relative inline-flex items-center px-4 py-2 rounded-l-md border">Send
            Email</a>
        </span>
      </div>

      <h2 class="m-3 p-4 flex md:flex-col sm:flex-row motion-reduce:transition-none motion-reduce:transform-none">
        <ul class="antialiased sm:subpixel-antialiased md:antialiased">
          <li
            class="p-4 md:flex bg-base-300 mb-2 tracking-tight rounded-box place-items-center text-green-200 animate-bounce ease-in-out infinite touch-auto">
            { "I am a" : [ "Senior Software Developer", "Full Stack Developer",
            "Secured
            Infrastructure Professional", "Data Scientist", "Emerging Tech Fanactic!", "Developer Experience Nerd", "✨" ] },</li>
          <li
            class="p-4 md:flex bg-base-300 mb-2 tracking-tight rounded-box place-items-center text-purple-300 animate-pulse ease-in-out infinite touch-auto">
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

export default {
  components: {
    Bitmoji
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
