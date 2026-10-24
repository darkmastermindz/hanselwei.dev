import { fileURLToPath } from 'node:url'
import { FLAT_QUERY, foldMode, watchFold } from './utils/foldMode.mjs'

export default defineNuxtConfig({
  nitro: {
    preset: 'static',
    // Blog markdown (local + mirrored from dev.to) is read at build time.
    // Posts with a `series` form the Curiosity Feed; the rest are one-shot posts.
    serverAssets: [
      { baseName: 'blog', dir: fileURLToPath(new URL('./content/blog', import.meta.url)) },
      { baseName: 'bio', dir: fileURLToPath(new URL('./content/bio', import.meta.url)) }
    ],
    prerender: {
      crawlLinks: true,
      routes: ['/', '/bio', '/blog', '/blog/feed', '/gear', '/projects', '/rss.xml', '/feed.xml'],
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
      title: 'Hansel Wei',
      meta: [
        { charset: 'utf-8' },
        // All Things Open verification string, in the head of every page (not shown in search results)
        { name: 'ato-verification', content: 'WKZBHNUJRETD' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        {
          name: 'description',
          content: "Hansel Wei, senior software engineer in Charlotte, NC: projects, blog, gear lists and the things I'm curious about."
        },
        { name: 'theme-color', content: '#2c2f33' },
        // Installable web app (iOS + Android)
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Hansel' },
        {
          // An opaque status bar: the installed app starts below it. With "black-translucent" the
          // page drew under it, and newer iOS blurs whatever sits in and just below that strip.
          // iOS reads this when the app is added to the Home Screen, so re-add it to pick it up.
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black'
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
      // Foldables: picks the layout for how the screen is folded before the page paints, and
      // again on every fold (utils/foldMode.mjs; allowed by hash like Nuxt's own inline scripts)
      script: [{ innerHTML: `(${watchFold})(${foldMode}, ${JSON.stringify(FLAT_QUERY)})` }],
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
  runtimeConfig: {
    public: {
      // Netlify builds send the coin photos through Netlify's Image CDN (utils/coinFaces.mjs)
      imageCdn: process.env.NETLIFY === 'true'
    }
  },
  /*
   ** Global CSS
   */
  css: [
    'tachyons/css/tachyons.css'
  ],
  // Nuxt 4's CSS minifier (Lightning CSS) stops at old Internet Explorer hacks such as tachyons'
  // `*zoom: 1`; with error recovery it drops them instead (no modern browser reads them anyway)
  vite: {
    css: {
      lightningcss: { errorRecovery: true }
    }
  },
  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ]
});
