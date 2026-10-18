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

## Build-time data
These run before `npm run dev`, `npm test` and the builds. The files they write are git-ignored:
- `build:access`: the sign-in allow-list, from `.github/CODEOWNERS` and `config.toml` → `netlify/lib/access.mjs`.
- `build:projects`: the Projects settings in `config.toml` → `data/projects.generated.mjs`.
- `build:background`: the topographic background settings in `config.toml` → `data/background.generated.mjs`.
- `sync:contributions`: the GitHub contribution calendar for the Projects page → `data/contributions.generated.json`.
- `sync:readme`: the GitHub profile README for the Bio page → `content/bio/github-readme.generated.md`.
- `sync:devto`: dev.to posts (see below). Runs before `npm run build` and `npm run generate`.

If a sync can't reach GitHub or dev.to, the last copy is kept (or an empty one written) and the build carries on.

## Environment variables (Netlify build settings)
| Variable | Used for | Needed? |
| --- | --- | --- |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Owner sign-in with a GitHub OAuth App. Callback: `https://www.hanselwei.dev/api/auth/github/callback` | For sign-in |
| `GITHUB_TOKEN` | Projects contribution graph. Read-only, with no permissions selected | Optional |
| `DEVTO_USERNAME`, `DEVTO_API_KEY` | dev.to mirror (see Blog) | Optional |
| `CSP_MODE` | `enforce` or `report-only`, overriding the default Content-Security-Policy mode | Optional |

The session key is derived from `GITHUB_CLIENT_SECRET`, so changing that secret signs everyone out.

## Sign-in and access
- Owner sign-in is GitHub OAuth (`/api/auth/github`). Sign-in is invite-only: accounts listed in `.github/CODEOWNERS` get a session, and their verified emails must match an entry in `config.toml` (`[access.github]`, plus `[access] additional` for extra emails).
- Sessions last an hour, and an idle hour signs you out.

## Projects (`/projects`)
Non-fork repos show automatically. In `config.toml`, under `[projects]`:
- `wip`: marks repos as work in progress (everything else is active).
- `forks`: forks to show.
- `featured` and `hackathon`: tags for repos that are already shown.

## Topographic background
Faint purple-to-green contour lines sit behind every page and draw in as visitors stay. They're built in the browser at the screen's size, in a Web Worker (`workers/topo.worker.mjs`, `utils/topo.mjs`). Tune them in `config.toml` under `[background]`; the build fails on a value out of range:
- `enabled`: `true` or `false`.
- `respect_data_saver`: `true` (the default) skips the background when the browser asks to save data. That's detected automatically: Data Saver or Lite mode (`navigator.connection.saveData`), the `prefers-reduced-data` media query, or a 2G or slower connection.
- `contours` (8–60): how many contour lines. More is denser.
- `feature_size` (80–800): the rough size of a hill or valley in pixels. Smaller is busier.
- `index_every` (0–20): every Nth line is heavier. `0` turns them off.
- `trails` (0–6): dashed trails that fade in at the end.
- `draw_seconds` (0–600): time on the page to draw everything. `0` shows it all at once. Reduced-motion settings also show it all at once.

## About card (home page)
`components/AboutCard.vue` holds the Skills, Hobbies and XP tabs. XP is a timeline by year: a slider from 2014 to now shows each year's education, work, volunteer, career-break and achievement entries, with a category icon for each. The data lives in the component's `education`, `experience` and `achievements` arrays. Hold the card (or alt-click on desktop) for plain English.

## Bio (`/bio`)
- `content/bio/bio.md`: hand-written markdown, with `title` and `description` in its front matter.
- Below it, the GitHub profile README (`darkmastermindz/darkmastermindz`) is synced on every build.

## Tests
- `npm test` runs Node's built-in test runner over `tests/**/*.test.mjs`. App logic is in `tests/app/`, and injection and security checks are in `tests/security/`. Shared attack payloads live in `tests/security/payloads.mjs`.
- Outside input (markdown, front matter, URLs, GitHub data, the profile README) renders only through `renderMarkdown` and `safeUrl`, and the security tests check that.

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
