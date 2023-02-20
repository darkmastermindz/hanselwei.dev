<template>
  <div class="navbar bg-neutral text-neutral-content relative">
        <div class="inline sm:inline-block md:flex-col lg:flex-row z-0">
        
            <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim white"
            aria-label="Home"
            exact
            to="/"
            >
            <span> { 🏠 Home },</span>
          </nuxt-link>
     
       
          <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim blue"
            aria-label="Projects"
            exact
            to="/Projects"
            > <span>{ 👨🏻‍💻 Projects },</span> 
          </nuxt-link>
     
        
          <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim green"
            role="navigation"
            aria-label="Gear"
            exact
            to="/gearClimbing"
            ><span> { 🧗 Climbing Gear }</span>
          </nuxt-link>
       </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
.b {
  font-weight: bold;
}

.link {
  text-decoration: none;
  transition: color 0.15s ease-in;

  &:link {
    transition: color 0.15s ease-in;
  }

  &:visited {
    transition: color 0.15s ease-in;
  }

  &:hover {
    transition: color 0.15s ease-in;
  }

  &:active {
    transition: color 0.15s ease-in;
  }

  &:focus {
    transition: color 0.15s ease-in;
    outline: 1px dotted currentColor;
  }
}

.blue {
  color: #00b8ff;
}

.black {
  color: #000;
}

.gray {
  color: #777;
}

.green {
  color: #41b883;
}

</style>
