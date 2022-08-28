<template>
  <div class="navbar bg-neutral text-neutral-content relative z-0 p-8 md:inline-flex sm:flex-column sm:text-left">
    <div class="navbar-start">
      <div class="dropdown">
        <label tabindex="0" class="btn btn-ghost btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </label>
        <ul
          tabindex="0"
          class="
            menu menu-compact
            dropdown-content
            mt-3
            p-2
            shadow
            bg-base-100
            rounded-box
            w-52
          "
        >
          <nuxt-link
            class="btn btn-ghost normal-case text-sm dim white b"
            role="navigation"
            aria-label="Home"
            exact
            to="/"
          >
            Home
          </nuxt-link>
          <nuxt-link
            class="btn btn-ghost normal-case text-sm dim blue b"
            role="navigation"
            aria-label="Projects"
            exact
            to="/Projects"
            >Projects
          </nuxt-link>
          <nuxt-link
            class="btn btn-ghost normal-case text-sm dim green b"
            role="navigation"
            aria-label="Gear"
            exact
            to="/gearClimbing"
            >Gear
          </nuxt-link>
        </ul>
      </div>
      <nuxt-link
        class="btn btn-ghost normal-case text-sm dim white b f6 f5-ns dib mr3"
        role="navigation"
        aria-label="Home"
        exact
        to="/"
        >{ 🏠 Home },
      </nuxt-link>
      <nuxt-link
        class="btn btn-ghost normal-case text-sm dim blue b f6 f5-ns dib mr3"
        role="navigation"
        aria-label="Projects"
        exact
        to="/Projects"
        >{ 👨🏻‍💻 Projects },
      </nuxt-link>
      <nuxt-link
        class="btn btn-ghost normal-case text-sm dim green b f6 f5-ns dib mr3"
        role="navigation"
        aria-label="Gear"
        exact
        to="/gearClimbing"
        >{ 🧗 Gear }
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

.pa3 {
  padding: 1rem;
}

.mr3 {
  margin-right: 1rem;
}

.f6 {
  font-size: 0.875rem;
}

@media screen and (min-width: 30em) {
        .pa4-ns {
                padding: 2rem;
        }

        .f5-ns {
                font-size: 1rem;
        }
}
</style>
