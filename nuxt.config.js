import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  nitro: {
    preset: 'static',
    // Markdown read at build time: blog posts (local + mirrored from dev.to)
    // and short Curiosity Feed entries
    serverAssets: [
      { baseName: 'blog', dir: fileURLToPath(new URL('./content/blog', import.meta.url)) },
      { baseName: 'feed', dir: fileURLToPath(new URL('./content/feed', import.meta.url)) }
    ],
    prerender: {
      crawlLinks: true,
      routes: ['/', '/feed', '/blog', '/gear', '/projects', '/rss.xml', '/feed.xml'],
      // Served by the Netlify function at runtime, not prerendered
      ignore: ['/api/inventory']
    }
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
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        {
          name: 'description',
          content: 'Hello Hansel!'
        },
        { name: 'theme-color', content: '#2c2f33' },
        // Installable web app (iOS + Android)
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Hansel' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'Blog · hanselwei.dev', href: '/rss.xml' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'Curiosity Feed · hanselwei.dev', href: '/feed.xml' },
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
