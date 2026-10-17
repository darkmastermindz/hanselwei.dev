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

## Blog (`/blog`): Posts and the Curiosity Feed
One collection: every post is a Markdown file in `content/blog/` and lives at `/blog/<slug>`.
A `series` label decides where it's listed:
- **Posts** (`/blog`): one-shots, no `series`.
- **Curiosity Feed** (`/blog/feed`): time-series updates. Give the post a `series`
  (e.g. `series: "Climbing Log"`); entries are numbered in date order and shown in
  full, newsletter style.

```md
---
title: "My post"
date: "2026-10-17"
description: "One-line summary"
tags: [netlify, nuxt]
series: "Climbing Log"     # optional: puts it in the Curiosity Feed
link: "https://…"          # optional: something you're sharing
cover_image: "https://…"   # optional
draft: true                # optional, hides the post
---
```
RSS: `/rss.xml` (everything) and `/feed.xml` (Curiosity Feed only).
- **dev.to mirror:** `npm run sync:devto` pulls published dev.to articles into
  `content/blog/devto/`. It runs automatically before every build and mirrors
  [dev.to/@hansel](https://dev.to/hansel) (override with `DEVTO_USERNAME`; optional `DEVTO_API_KEY`).

## Gear inventory (Netlify Functions)
- Edit inventories in `data/inventory.mjs`.
- `netlify/functions/inventory.mjs` serves them:
  - `GET /api/inventory`: all lists
  - `GET /api/inventory/outdoor?section=Climbing&tag=Rappel&status=owned&q=black`: filtered items
- `/gear/:list` pages are prerendered from the same data, then refreshed from the function in the browser.

## Install as an app (PWA)
`public/manifest.webmanifest`, `public/sw.js` and the icons in `public/icons/` make the site installable:
- **Android / Chrome:** menu → *Install app*
- **iOS / Safari:** Share → *Add to Home Screen*
