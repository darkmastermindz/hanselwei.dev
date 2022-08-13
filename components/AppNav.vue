<template>
        <nav class="relative z-0 p-8 md:inline-flex sm:flex-column sm:text-left">
                <nuxt-link class="link dim white b f6 f5-ns dib mr3" exact to="/">{ 🏠 Home },</nuxt-link>
                <nuxt-link
                        class="link dim blue b f6 f5-ns dib mr3"
                        exact
                        to="/Projects"
                >{ 👨🏻‍💻 Projects },</nuxt-link>
                <!-- <nuxt-link class="link dim green b f6 f5-ns dib mr3" exact to="/StayCurious">{ 📖 Notes }</nuxt-link> -->
                <nuxt-link
                        class="link dim green b f6 f5-ns dib mr3"
                        exact
                        to="/gearClimbing"
                >{ 🧗 Gear }</nuxt-link>
        </nav>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
.dib {
        display: inline-block;
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
.pa3 {
        padding: 1rem;
}
.mr3 {
        margin-right: 1rem;
}
.f6 {
        font-size: 0.875rem;
}
.dim {
        opacity: 1;
        transition: opacity 0.15s ease-in;
        &:hover {
                opacity: 0.5;
                transition: opacity 0.15s ease-in;
        }
        &:focus {
                opacity: 0.5;
                transition: opacity 0.15s ease-in;
        }
        &:active {
                opacity: 0.8;
                transition: opacity 0.15s ease-out;
        }
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
