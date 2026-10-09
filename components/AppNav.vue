<template>
  <nav class="app-nav navbar bg-neutral text-neutral-content" aria-label="Main">
        <div class="app-nav__links">
        
        <NuxtLink
            class="btn btn-ghost normal-case md:text-sm dim white"
            aria-label="Home"
            exact
            to="/"
            >
            <span> { 🏠 Home },</span>
          </NuxtLink>
     
       
          <NuxtLink
            class="btn btn-ghost normal-case md:text-sm dim blue"
            aria-label="Projects"
            exact
            to="/projects"
            > <span>{ 👨🏻‍💻 Projects },</span> 
          </NuxtLink>
     
        
          <NuxtLink
            class="btn btn-ghost normal-case md:text-sm dim green"
            aria-label="Gear"
            exact
            to="/gearClimbing"
            ><span> { 🧗 Climbing Gear }</span>
          </NuxtLink>
       </div>
  </nav>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.app-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: env(safe-area-inset-top);
}

.app-nav__links {
  display: flex;
  flex-wrap: wrap;
}

.router-link-exact-active {
  text-decoration: underline;
  text-underline-offset: 6px;
}

@media (max-width: 639px) {
  .app-nav {
    min-height: auto;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }

  .app-nav__links {
    flex-wrap: nowrap;
    width: 100%;
    justify-content: space-between;
  }

  .app-nav__links .btn {
    min-height: 44px;
    height: auto;
    padding-left: 0.4rem;
    padding-right: 0.4rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }
}

@media (max-width: 359px) {
  .app-nav__links {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .app-nav__links .btn {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    font-size: 0.7rem;
  }
}

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
