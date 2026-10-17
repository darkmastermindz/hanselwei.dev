# hanselwei.dev
[![Netlify Status](https://api.netlify.com/api/v1/badges/e1939fee-0a59-40be-b538-0f6024576640/deploy-status)](https://app.netlify.com/sites/hansel/deploys) 

> Hello World, Hansel!

# Production Site Link:
- [Hosted on Netlify](https://www.hanselwei.dev)

# Dev Branch Site Link:
- [Hosted on Netlify](https://develop.hanselwei.dev/)

# Development
```sh
npm install
npm run dev            # http://localhost:3000
npm run generate       # static build into .output/public (what Netlify deploys)
netlify dev            # run the site *and* the Netlify functions locally
```

## Blog
- Write posts as Markdown in `content/blog/*.md` with front matter:
  ```md
  ---
  title: "My post"
  date: "2026-10-17"
  description: "One-line summary"
  tags: [netlify, nuxt]
  cover_image: "https://…"   # optional
  draft: true                # optional, hides the post
  ---
  ```
- Posts are rendered at build time (`server/api/blog`) and also published at `/rss.xml`.
- **dev.to mirror:** `npm run sync:devto` pulls published dev.to articles into
  `content/blog/devto/`. It runs automatically before every build and mirrors
  [dev.to/@hansel](https://dev.to/hansel) (override with `DEVTO_USERNAME`; optional `DEVTO_API_KEY`). Mirrored posts link back to dev.to as the canonical URL.

## Gear inventory (Netlify Functions)
- Edit inventories in `data/inventory.mjs`.
- `netlify/functions/inventory.mjs` serves them:
  - `GET /api/inventory`: all lists
  - `GET /api/inventory/climbing?tag=Rappel&category=Harness&q=black`: filtered items
- `/gear/:list` pages are prerendered from the same data, then refreshed from the function in the browser.

## Install as an app (PWA)
`public/manifest.webmanifest`, `public/sw.js` and the icons in `public/icons/` make the site installable:
- **Android / Chrome:** menu → *Install app*
- **iOS / Safari:** Share → *Add to Home Screen*
