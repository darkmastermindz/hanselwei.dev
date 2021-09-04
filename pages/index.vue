<template>
  <div class="outer">
    <!-- <logo /> -->
    <div>
      <Bitmoji />
    </div>
    <h1 class="title">
      <strong>Hansel Wei</strong>
    </h1>

    <div class="container">
      <div>
        <div class="links">
          <a href="https://linkedin.com/in/hanselwei" target="_blank" class="button--blue">Linkedin</a>
          <a href="https://github.com/darkmastermindz" target="_blank" class="button--grey">GitHub</a>
          <a href="mailto:Hansel Wei (Resume Request) <resume@hanselwei.dev>?subject=Resume%20Request&body=Hello%20Hansel%2C%0A%0AMy%20name%20is%20%7Byour%20name%7D%2C%20I%20would%20like%20to%20request%20for%20your%20resume%3A%20%0A%0A%7Byour%20message%20here%7D" target="_blank" class="button--green">Request Resume</a>
        </div>
        <h2 class="subtitle">
          I am a
          <mark class="keyword">curious</mark>
          Full Stack Developer,
          Secured Infrastructure
          <mark
            class="keyword"
          >professional,</mark> Data Scientist,
          <mark class="keyword">&amp;</mark> Emerging
          <mark class="keyword">tech fanactic</mark>
          !
        </h2>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from "~/components/Logo.vue";
import Bitmoji from "~/components/Bitmoji.vue";

export default {
  components: {
    Logo,
    Bitmoji
  }
};
</script>

<style lang="scss">
.container {
  margin: 0 auto;
  min-height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Roboto Mono", "Quicksand", "Source Sans Pro", -apple-system,
    BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  display: inline;
  font-weight: 20em;
  font-size: 5em;
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
