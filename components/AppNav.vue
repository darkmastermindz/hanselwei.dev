<template>
    <nav class="pa3 pa4-ns">
        <nuxt-link class="link dim white b f6 f5-ns dib mr3" exact to="/">{ 🏠 Home }</nuxt-link>
        <nuxt-link class="link dim blue b f6 f5-ns dib mr3" exact to="/Projects">{ 👨🏻‍💻 Projects }</nuxt-link>
        <nuxt-link class="link dim green b f6 f5-ns dib mr3" exact to="/StayCurious">{ 📖 Curiosity }</nuxt-link>
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
        transition: color .15s ease-in;
        &:link {
                transition: color .15s ease-in;
        }
        &:visited {
                transition: color .15s ease-in;
        }
        &:hover {
                transition: color .15s ease-in;
        }
        &:active {
                transition: color .15s ease-in;
        }
        &:focus {
                transition: color .15s ease-in;
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
    color: #41B883;
}
.pa3 {
        padding: 1rem;
}
.mr3 {
        margin-right: 1rem;
}
.f6 {
        font-size: .875rem;
}
.dim {
        opacity: 1;
        transition: opacity .15s ease-in;
        &:hover {
                opacity: .5;
                transition: opacity .15s ease-in;
        }
        &:focus {
                opacity: .5;
                transition: opacity .15s ease-in;
        }
        &:active {
                opacity: .8;
                transition: opacity .15s ease-out;
        }
}
@media screen and (min-width: 30em) {
        .pa4-ns {
                text-align: center;
                vertical-align: middle;
                padding: 2rem;
        }
        .f5-ns {
                text-align: center;
                vertical-align: middle;
                font-size: 1rem;
        }
}

</style>
