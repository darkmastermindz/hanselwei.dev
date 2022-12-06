<template>
  <div class="navbar bg-neutral text-neutral-content relative">
        <div class="inline sm:inline-block md:flex-col lg:flex-row z-0 ">
        
            <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim white"
            role="navigation"
            aria-label="Home"
           
            exact
            to="/"
            >
            <div tabindex="0"> { 🏠 Home },</div>
          </nuxt-link>
     
       
          <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim blue"
            role="navigation"
            aria-label="Projects"
            tabindex="1"
            exact
            to="/Projects"
            > <div tabindex="1">{ 👨🏻‍💻 Projects },</div> 
          </nuxt-link>
     
        
          <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim green"
            role="navigation"
            aria-label="Gear"
            tabindex="2"
            exact
            to="/gearClimbing"
            ><div tabindex="2"> { 🧗 Gear }</div>
          </nuxt-link>
          
          <nuxt-link
            class="btn btn-ghost normal-case md:text-sm dim purple"
            role="navigation"
            aria-label="Save as Contact"
            tabindex="3"
            href="https://hansel.run/connect"
            ><div tabindex="2"> { 💾 Save as Contact }</div>
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
