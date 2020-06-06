<template>
  <div class="app-default">
    <app-nav />
    <nuxt />
  </div>
</template>

<script>
import AppNav from "~/components/AppNav.vue";

export default {
  components: {
    AppNav
  }
};
</script>


<style lang="scss" scoped>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  background-color: #2c2f33;
}

h1,
h2,
h3 {
  font-family: "Nova Mono", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: normal;
  color: #eee;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #00ff9f;
  color: #00ff9f;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--green:hover {
  color: #fff;
  background-color: #00ff9f;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #fff;
  color: #fff;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--grey:hover {
  border: 1px solid #171515;
  color: #fff;
  background-color: #171515;
}

.button--blue {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #0072b1;
  color: #0072b1;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--blue:hover {
  border: 1px solid #0072b1;
  color: #fff;
  background-color: #0072b1;
}

@media (max-device-width: 480px) {
  .app-default {
      min-width: 0;
      h1 {
        font-size:40px;
      }
    }
}
</style>