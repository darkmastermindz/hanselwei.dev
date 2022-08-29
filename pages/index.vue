<template>
  <div class="outer">
    <div class="text-center justify-center py-4">
      <Bitmoji />
    </div>
    <h1 class="title sm:text-4xl md:text-5xl lg:text-6xl grow">
      <strong>Hansel Wei</strong>
    </h1>

    <div class="text-center max-w-7xl mx-auto py-8 sm:space-x-2 sm:space-y-2 lg:space-x-4 lg:space-y-4">
      <div>
        <span
          class="relative z-0 justify-center px-8 sm:flex-row shadow-sm rounded-md font-bold md:antialiased sm:subpixel-antialiased">
          <a href="https://github.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-grey-700 relative inline-flex items-center px-8 py-2 rounded-l-md border">Github</a>
          <a href="https://twitter.com/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-blue-400 relative inline-flex items-center px-8 py-2 rounded-l-md border">Twitter</a>
          <a href="https://snapchat.com/add/darkmastermindz" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib gray-50 bg-yellow-300 relative inline-flex items-center px-8 py-2 rounded-l-md border">Snapchat</a>
          <a href="https://m.me/hanselwei" target="_blank"
            class="f6 grow no-underline br-pill ph3 pv2 mb2 dib white bg-blue-600 relative inline-flex items-center px-8 py-2 rounded-l-md border">Facebook
            Messenger</a>
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

      <h2
        class="text-center justify-center d-flex flex-column text-base p-10 sm:space-x-2 sm:space-y-2 lg:space-x-4 lg:space-y-4 grow motion-reduce:transition-none motion-reduce:transform-none">
        <ul class="list-none tracking-wider antialiased sm:subpixel-antialiased md:antialiased font-bold">
          <li
            class=" grid h-20 flex-grow card bg-base-300 rounded-box place-items-center text-green-200 animate-pulse ease-in-out infinite">
            { "I am a" : [ "Full Stack Developer",
            "Secured
            Infrastructure Professional", "Data Scientist", "Emerging Tech Fanactic!", "✨" ] },</li>
          <li
            class=" grid h-20 flex-grow card bg-base-300 rounded-box place-items-center text-purple-300 animate-pulse ease-in-out infinite">
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
