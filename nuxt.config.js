export default defineNuxtConfig({
  nitro: {
    preset: 'static'
  },
  /*
   ** Headers of the page
   */
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'hanselwei.dev',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#2a303c' },
        { name: 'color-scheme', content: 'dark' },
        { name: 'apple-mobile-web-app-title', content: 'Hansel Wei' },
        { name: 'format-detection', content: 'telephone=no' },
        {
          name: 'description',
          content: 'Hello Hansel!'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        {
          rel: 'preload',
          as: 'style',
          onload: "this.onload=null;this.rel='stylesheet'",
          href: 'https://fonts.googleapis.com/css?family=Nova+Mono&display=swap'
        },
        {
          rel: 'preload',
          as: 'style',
          onload: "this.onload=null;this.rel='stylesheet'",
          href: 'https://use.typekit.net/rej0haw.css'
        }
      ],
      noscript: [
        {
          children:
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nova+Mono&display=swap">'
        },
        {
          children:
            '<link rel="stylesheet" href="https://use.typekit.net/rej0haw.css">'
        }
      ]
    }
  },
  /*
   ** Global CSS
   */
  css: [
    'tachyons/css/tachyons.css'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ]
});
