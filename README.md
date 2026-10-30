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
- `build:seasons`: the seasonal themes in `config.toml` → `data/seasons.generated.mjs`.
- `build:credits`: the open-source credits page (`/credits`) → `data/credits.generated.json`. It credits every package in `package.json` (plus the libraries bundled with Nuxt and its Tailwind module, `INCLUDED` in `utils/credits.mjs`) at the version in `package-lock.json`, with the license, copyright line and GitHub link from `node_modules`. The page then refreshes from the `/api/credits` Netlify function, which reads the project's `package.json` and `package-lock.json` from GitHub (`main`, so merged dependency changes show up without a deploy; it falls back to the deployed copies) and each package's details from the npm registry and jsDelivr (cached by Netlify's CDN for a day). Nothing to update by hand when dependencies change.
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
| `BIO_PHOTO_KEY` | Decrypts the Bio page photo (`netlify/lib/bioPhoto.sealed.mjs`). Secret, functions scope | For the photo |
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
Faint purple-to-green contour lines (in the season's colours while a seasonal theme is on, see below) sit behind every page and draw in as visitors stay. They're built in the browser at the screen's size, in a Web Worker (`workers/topo.worker.mjs`, `utils/topo.mjs`). Tune them in `config.toml` under `[background]`; the build fails on a value out of range:
- `enabled`: `true` or `false`.
- `data_saver`: what to do when the browser asks to save data. That's detected automatically: Data Saver or Lite mode (`navigator.connection.saveData`), the `prefers-reduced-data` media query, or a 2G or slower connection.
  - `"sparse"` (the default): a lighter pattern with half the contours, larger hills, no trails and a coarser grid, about a quarter of the size.
  - `"skip"`: no background.
  - `"full"`: ignore the hint and draw the full pattern.
- `contours` (8–60): how many contour lines. More is denser.
- `feature_size` (80–800): the rough size of a hill or valley in pixels. Smaller is busier.
- `index_every` (0–20): every Nth line is heavier. `0` turns them off.
- `trails` (0–6): dashed trails that fade in at the end.
- `draw_seconds` (0–600): time on the page to draw everything. `0` shows it all at once. Reduced-motion settings also show it all at once.

## Seasonal themes
Every week of the year has a theme: a few themed emoji drift down (or float up) over the background on every page, and the topographic lines take the theme's two colours. October is spooky (Hacktoberfest, pumpkins, bats, Halloween), December has the winter holidays, and so on. Dated events take over while they run, like All Things Open in Raleigh with laptops, Linux penguins and Raleigh's acorns, and GitHub Universe in San Francisco with the Octocat 🐙🐱, rockets, Copilot 🤖 and the Golden Gate 🌉 in GitHub's purple and green.
- The themes live in `config.toml` under `[seasons]`, checked by `utils/seasons.mjs`; the build fails on a bad value.
  - `enabled`: `true` or `false`.
  - `particles` (0–40): how many emoji at once. Phones show at most 8.
  - `[[seasons.week]]`: one per week, in order from `from = "01-01"`. Each runs until the next one starts. Each has a `name`, up to 8 `emoji`, two `colors` (`"#rrggbb"`) and a `motion` (`"fall"`, the default, or `"rise"`).
  - `[[seasons.event]]`: the same, with `from` and `to` dates (like `2026-10-19`). Events take over from the weekly theme for those days.
- The theme is picked in the visitor's browser from today's date (Eastern time), so it changes on its own with no redeploy (`composables/useSeason.js`).
- The emoji are CSS animations only (`components/SeasonalParticles.vue`), behind the page content and never in the way of a tap. They're hidden for visitors who prefer reduced motion or are saving data; the colours still change.

## Coin face (home page)
The coin opens on the Bitmoji. Each time a flip lands heads up, the face shows the next photo, alternating between the GitHub avatar and the hanselwei.link Gravatar (`utils/coinFaces.mjs`). The pull-down reset brings the Bitmoji back. A photo that can't load is skipped, so the coin never goes blank. On Netlify the photos go through its Image CDN (`netlify.toml` `[images]`, which allows only these two images): resized to the coin and sent as WebP or AVIF.

## Coin bubble (home page)
When a press-and-hold on the coin lands it heads up (the profile picture), a blue iMessage-style speech bubble pops up under it: "typing…" for a moment, then the message. It fades after 8 seconds, but not while it's hovered or focused. After that, the coin's tails side shows an engraved QR code instead of "HW". It's for events. Set it in `config.toml` `[coin_bubble]` each year:
- `enabled`: true or false.
- `text`: plain text, up to 80 characters.
- `until`: the event's last day.
- `link_text` and `link`: the part of the text to link, and where it goes (https only). `{year}` in `link` is the year of `until`, e.g. `https://{year}.allthingsopen.org`.
- `qr`: where the tails-side QR points (https only).
- `home_title` and `footer_code`: plain text for the event, shown as the home page title (on its own, in place of "Hansel Wei") and as a line at the top of the footer on every page.

It shows through the end of `until` (Eastern time), then switches itself off without a redeploy. `npm run build:coin-bubble` (before tests and dev) writes `data/coinBubble.generated.mjs`, with the QR already turned into an SVG path (`utils/coinQr.mjs`, using `uqr`), and fails the build on a bad setting (`utils/coinBubble.mjs`).

## About card (home page)
`components/AboutCard.vue` holds the Skills, Hobbies and XP tabs. XP is a timeline by year: a slider from 2014 to now shows each year's education, work, volunteer, career-break and achievement entries, with a category icon for each. Swipe left or right across the card to move through the years (a swipe left goes to later years). The mouse wheel works too while the pointer is over the card, or while a keyboard or controller has focus in it: sideways or down goes to later years, and at the first or last year the page scrolls on. While the card is in use the social links below pause (they move as the card changes size): on phones until the card is scrolled away or you tap elsewhere (a tap on a paused link just unpauses it), with a mouse for a second after the press. The data lives in `data/xp.mjs` (`education`, `experience` and `achievements`). Hold the card (or alt-click on desktop) for plain English. In plain English, visitors whose browser prefers another language get a small link to read it in Google Translate (`utils/translate.js`); English readers don't see it. A link to `/#xp` (the Bio page has one) opens the card on XP (`utils/aboutCard.js`).

Kudos: in plain English, each XP entry has a 👏 button with a live count shared by every visitor (`components/KudosButton.vue` and `composables/useKudos.js`, refreshed every 15 seconds while the buttons are on screen). Blog posts (at the end of each post) and Curiosity Feed entries have one too, with the id `post-<slug>`. Next to it, ↗ Share (`components/ShareButton.vue`, `utils/share.js`) opens the device's share sheet with the post's title and link, or copies the link where there's no share sheet (and says "Link copied"). The `/api/kudos` Netlify function (`netlify/functions/kudos.mjs`) keeps the counts as one JSON document in a Netlify Blobs store named `kudos`, apart from the site's data, keyed by each entry's id (`xpId` in `data/xp.mjs`, made from the fields that name the entry, so rewording a line keeps its kudos). Posts aren't a fixed list (dev.to posts arrive at build time), so a post id must be a plain slug (the dev.to mirror's rule) and the function checks the deployed site has that post (its prerendered `/blog/<slug>/_payload.json` answers 200; kept for 10 minutes) before its first kudos. It counts only known entries, once per visitor per entry per day (by a hash of their connection, which isn't stored; daily records are cleared after a day or two), and only from the site's own pages. Nothing to set up: Netlify provides the store. Where the function isn't running (a local preview), the buttons don't show.

The social links under the card are in `components/Socials.vue`. Tapping Instagram opens a small menu with both accounts: hansel.rocks (main) and hansel.codes (code and software engineering only). A pill gets a menu from its `choices` list (`components/SocialFlipLink.vue`). The addresses are in `utils/outbound.js`. On phones and tablets each link opens a new tab through `/out/<id>` (`pages/out/[id].vue`), which goes on to the link; when the phone hands the link to an app instead, that tab closes itself once you come back, so no blank tab is left behind.

## Keyboard and controller
`plugins/navigation.client.js` adds keyboard and game controller navigation on every page, detected from what the visitor uses. A focus ring shows only after a keyboard or controller is used (`html[data-input]`), and a mouse or touch hides it again.
- Arrow keys or the D-pad (or left stick) move focus to the nearest link or button in that direction (`utils/spatialNav.js`). With nothing focused yet, arrow keys scroll the page as usual, and a controller starts at the top of the screen.
- Enter or A activates. Escape or B closes an open menu, clears a search, turns the About card back to JSON, or goes back a page within the site.
- PageUp/PageDown or the bumpers switch the About card's tabs, or step the years on the XP slider.
- The right stick scrolls the page. Controller input is read in `utils/gamepad.js` (standard mapping). Only standard-mapping controllers count, and each one does nothing until a button is pressed or a stick moved. Phones list fingerprint readers and sensors as gamepads (Chrome and Samsung Internet on Android can even give them the standard mapping), with sticks stuck at one end, which used to pin Android pages in place. So on a phone only a fresh button press wakes a controller, and any touch on the screen puts it back to sleep: a finger always wins.
- With a keyboard or controller in use, the mouse wheel moves focus to the next or previous control while it's on or near the screen; past long text it scrolls as usual. A click hands the wheel back to plain scrolling.
- With a controller, focus gets a sparkling rainbow border with twinkling corners (a still one with reduced motion).
- The coin's press-and-hold still needs a real press (pointer, Space or Enter), since it doubles as the human check for the contact card.

## Bio (`/bio`)
- `content/bio/bio.md`: hand-written markdown, with `title` and `description` in its front matter.
- Below it, the GitHub profile README (`darkmastermindz/darkmastermindz`) is synced on every build.
- A photo is pinned at the top, framed as an instant print with a strip of 35mm film edge (`components/PinnedPhoto.vue`). It's served only to the page itself, by the `/api/bio-photo` Netlify function:
  - The repo is public, so it holds only an encrypted copy; the function decrypts it with `BIO_PHOTO_KEY`. What's encrypted is already reduced: 640px wide, quality 60, no camera metadata, a faint `hanselwei.dev` watermark.
  - The function answers only a same-origin `fetch` from the page (fetch metadata, or a same-site referrer), so direct visits, other sites and `<img>` embeds get a 403. Nothing is cached, and it sends `noindex, noimageindex, noai, noimageai`.
  - The page draws it into a canvas (no image to save, drag or long-press, right-click blocked), and `robots.txt` turns away AI crawlers.
  - These are deterrents: a screenshot still works, and anyone can forge request headers.
  - To change the photo: reduce it, then `BIO_PHOTO_KEY=… node scripts/encrypt-bio-photo.mjs photo.jpg`.

## Chips
Tag and filter chips use `components/ChipStrip.vue` everywhere (blog, Curiosity Feed, projects, gear):
- Tags show as hashtags (`#FirstAid`, `#featured`); filters still use the raw tag. Searches accept the hashtag (`#crashpad` finds "Crash Pad").
- A strip wraps naturally up to 3 rows on phones and 4 on wider screens. Longer lists become that many balanced rows that scroll sideways (`utils/chips.js`).

## Tests
- `npm test` runs Node's built-in test runner over `tests/**/*.test.mjs`. App logic is in `tests/app/`, and injection and security checks are in `tests/security/`. Shared attack payloads live in `tests/security/payloads.mjs`.
- Outside input (markdown, front matter, URLs, GitHub data, the profile README) renders only through `renderMarkdown` and `safeUrl`, and the security tests check that.
- `npm run test:android` runs the browser tests in `tests/e2e/` (Playwright) on every Android phone, tablet and foldable in Playwright's device list, in portrait and landscape, plus iPhone Duo: 103 device profiles. Run `npm run generate` first; `scripts/serve-static.mjs` serves the built site the way Netlify does, with its Content-Security-Policy. Set `PLAYWRIGHT_CHROMIUM_PATH` to use a Chromium you already have, or run `npx playwright install chromium`.
  - With a finger (real touch events), every page must scroll down and back up and stay where it's left, nothing may scroll sideways, swipes that start on the coin, About card, social links and menu must scroll the home page, and a tap must still work.
  - Every test runs with a phantom "controller" like the ones Android phones report (a fingerprint reader with the standard mapping, its stick stuck at -1 and a button held down), the cause of pages that wouldn't scroll on Android. Each test also checks the app really started, so a page whose scripts didn't run can't pass.
  - The **Browser tests** workflow runs them on pull requests that change the front end. It builds the site once, then runs each category on its own runners at the same time: Accessibility (6), Touch (6), Foldables (2) and 404 page (1). A red check names its category. To run one category locally, name its spec, for example `npx playwright test tests/e2e/a11y.spec.mjs`.
- `tests/e2e/a11y.spec.mjs` runs axe-core (WCAG 2.1 A and AA) on every page and on the home page's card states and Instagram menu, on a phone and a tablet. It runs with `npm run test:android`, and as the Accessibility check in CI.

## 404 page and its arcade
Any address that isn't on the site gets the 404 page (`error.vue`, Nuxt's error page, built as `404.html`, which Netlify serves for unknown paths): a way home, **Surprise me**, and an easter egg in the style of Fold Paddle Ball (below).

**Surprise me** (`components/SurpriseMe.vue`, `utils/lucky.mjs`) goes somewhere at random: a kind first (a blog post, a home page fact or a definition from the glossary), then one of that kind. A post opens after a moment: a bubble like a definition's says where it's going, with a bar in the XP timeline's colours that empties over 5 seconds, and **Go now** or **Cancel** (or Escape) to stay (`components/LuckyLeave.vue`). Not cancelled in time, a little octopus-cat that looks like Hansel (drawn for the site: messy black hair, glasses, stubble, a blue hoodie) climbs out of a hole 🕳️ under Go now and presses it for you (`components/OctoHelper.vue`). It has five personalities, one picked each time (`utils/octoHelper.mjs`): **boop** (bumps it from below), **leap** (jumps out and lands on it), **sneak** (peeks over the rim, looks around, then pokes it), **drill** (spins its way up) and **wave** (says hi first). Cancel still works until it presses. With reduced motion it simply appears for a moment. A fact or a definition is searched for you in the page, shown being typed and searched (`components/LetMeSearch.vue`): a pointer clicks the search box, types the question and presses Search, then the answer shows with the search itself. With reduced motion, or "Skip to the answer", it shows straight away.
- **Decoupled from the rest of the site.** The button only reads `/lucky.json` (`server/routes/lucky.json.js`, prerendered), a plain list built from the data (the blog posts, `data/hobbyFacts.mjs`, `data/glossary.js`), never from the pages or components that show them. Each source is read on its own and anything that doesn't look right is left out, so a change to one can at worst drop it from the draw. Posts are only ever `/blog/<slug>` on this site.
- **Google's results in the page.** Google's search pages can't be shown in a frame on another site. Google's official way is the [Programmable Search Element](https://developers.google.com/custom-search/docs/element): make a search engine that searches the whole web at [programmablesearchengine.google.com](https://programmablesearchengine.google.com) and put its ID in `config.toml` `[lucky] search_engine_id`. The results then show under the answer, and the Content-Security-Policy allows Google's search scripts and frames (`scripts/lib/csp.mjs`; without an ID it allows none). Without one, the search ends with a link to the same search on Google.

**The arcade** is locked behind **slide to unlock** in Liquid Glass (`components/SwipeToUnlock.vue`): drag the knob to the end (let go early and it springs back), or use the keyboard (→ steps along, End or Enter goes all the way). Then it shows every game in the arcade, each with its own Play button (`components/LostArcade.vue`, `utils/arcade.mjs`):
- **Paddle Ball**: you at the bottom against the computer, first to 5 (the same rules as Fold Paddle Ball, `utils/foldPaddleBall.mjs`).
- **Brick Bash**: knock out every brick, with three lives (`utils/brickBash.mjs`).
- **Alien Attack**: shoot the marching block before it lands or its bombs cost your three lives (`utils/alienAttack.mjs`).

Drag anywhere (held down, that also shoots) or use ← → (and Space to shoot); Escape closes. The score stays on one line, and each game starts below the score and how to play, however many lines they take on the screen. Each game's rules are pure, like Fold Paddle Ball's, and tested in `tests/app/arcade.test.mjs`. `tests/app/lucky.test.mjs` and `tests/security/lucky.test.mjs` cover Surprise me, and `tests/e2e/not-found.spec.mjs` unlocks the arcade, checks every game shows, plays each one and tries each kind of lucky pick in the browser.

## Foldables and iPhone Duo

Folding the phone changes the layout, live, with no reload, and nothing you read or tap sits on the fold (everything keeps at least 1rem clear of it, even on seamless folds).

| Fold | Home | Other pages | Where it works |
|---|---|---|---|
| Closed, or any other phone, tablet or computer | The usual layout, unchanged | Unchanged | everywhere |
| Tabletop (a crease across, the top half tilted back like a laptop) | Top half: the coin and name. Bottom half: the About card and links, which scroll under the coin, and the menu along the bottom | Reading on the top half; the menu on the bottom half, like a keyboard | Chrome / Samsung Internet; Safari with its preview flags (below) |
| Book (a crease down the middle) | Left page: the menu, coin and name. Right page: the card, links and buttons | The menu down the left page, reading on the right. Pages turn like a book (below) | Chrome / Samsung Internet; Safari with its preview flags |
| Open flat | Two columns: the coin and name beside the card and links | Unchanged | Android foldables, and iPhone Duo's inner screen held sideways (Safari, no flags needed) |
| iPad held sideways, with 📖 on | Book, as above, with the spine down the middle of the screen | Book, as above | iPad (Safari), 900px or more wide; the 📖 button at the end of the menu turns it on and off |

- **Detecting the fold.** A small script in the page head (`utils/foldMode.mjs`, allowed by the CSP by hash) sets `<html data-fold="tabletop|book|flat">` and the `--fold-*` variables before the page paints, and again on every resize and fold. `layouts/default.vue`, `components/AppNav.vue` and `pages/index.vue` lay out from those.
  - Chrome and Samsung Internet (138+) report where the fold is: two viewport segments (the Viewport Segments API).
  - **iPhone Duo in Safari.** Safari 27.1 has the same APIs only as a developer preview: Settings → Apps → Safari → Advanced → Feature Flags → *Viewport Segments API* and *Device Posture API*. With segments on, it works as in Chrome. With only the posture flag, Safari says "folded" but not where, so the fold is taken as the middle of the screen (iPhone Duo's hinge is central), with a wider margin. Without the flags, Safari can't tell the page the phone is half-folded.
  - iPhone Duo is recognised by its size, since it's the only iPhone whose page is 500px or more both ways (`data-device="iphone-duo"`). Its inner screen held sideways gets the two-column layout, two even columns with the gap on the hinge. The size is the page's own (the layout viewport), not iOS's `innerWidth`/`innerHeight`, which shrink when zoomed in or typing and grow as Safari's toolbar slides away. An iPhone that says "folded" on a smaller screen is on the outer one, which has no fold. iPads (whose Safari says it's a Mac) never get a foldable layout on their own; held sideways, they can choose the book (below). Upright, and on the outer screen, the usual layout fits, as Apple's [iPhone Duo guidelines](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) suggest: let the layout grow rather than redesign it, keep content clear of the fold, use an even number of columns, and keep the menu at the side in book like the system's own controls.
- **Just for iPhone Duo** (`data-device`, `utils/foldMode.mjs`):
  - **Front screen** (382px wide upright in Safari, a width no other iPhone has): a laptop shuts its lid and turns it to face you, with the site's QR code where the logo would be (`components/DuoLaptopLid.vue`). The QR is built at build time (`data/siteQr.generated.mjs`, from `scripts/build-coin-bubble.mjs`). With reduced motion it shows only the shut lid.
  - **Inner screen:** a "✨ Hello, iPhone Duo" badge with a turning rainbow edge, and **Fold Paddle Ball** (`components/FoldPaddleBall.vue`, rules in `utils/foldPaddleBall.mjs`). It's you against the computer, first to 5, with the fold as the net: left vs right held sideways, bottom vs top upright. Drag anywhere or use the arrow keys; Escape closes. Neither shows while part-folded, where the hero only has half the screen.
- **iPad book layout** (`components/BookToggle.vue`): an iPad has no fold, but held sideways (900px or more wide, so not a narrow Split View or Stage Manager window) the menu ends with a 📖 button that lays the site out as a book, the same as a foldable folded down the middle, with 24px kept clear either side of the spine. iPad Safari says it's a Mac, so an iPad is a "Mac" with a touch screen (`navigator.maxTouchPoints`); real Macs never get the button. The choice is kept in the browser (`book:chosen`) and read by the page head script before the first paint, so the next visit opens as a book; upright, it's the usual layout and no button, and turning it sideways again brings the book back.
- **Turning the page** (book only): going to another page turns the right page over onto the left, like Apple Books, and going back turns it back (`plugins/pageTurn.client.js`, the View Transitions API; animations in `layouts/default.vue`). The menu's sections are the chapters, in order (`utils/pageTurn.mjs`), and the corners of the right page turn to the previous and next one (`components/BookPager.vue`). With reduced motion, pages change as usual.
- **Tests.**
  - `tests/e2e/foldable.spec.mjs` folds a Galaxy Z Fold 7 and Flip 7 through DevTools (with and without a hinge gap). It checks each layout, that nothing visible is on the fold at the top, scrolled and at the bottom, and that pages turn both ways.
  - The iPhone Duo profiles (`playwright.config.mjs`, Safari's user agent and page sizes) check the open-flat layout and the posture-only fold, and that no other device gets a foldable layout.
  - `tests/app/fold-mode.test.mjs` covers the detection rules and the page order.

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
- Each list is a file in `data/gear/` (`outdoor.json`, `camera.json`), kept in one canonical form (`utils/gearEdits.mjs`; a test fails on a hand edit that isn't). `data/inventory.mjs` reads them, with the statuses and filters.
- `netlify/functions/inventory.mjs` serves them:
  - `GET /api/inventory`: all lists
  - `GET /api/inventory/outdoor?section=Climbing&tag=Rappel&status=owned&q=black`: filtered items
- `/gear/:list` pages are prerendered from the same data, then refreshed from the function in the browser.

## Glossary terms
Acronyms, lingo and jargon in the site's own text (MLH, SPI, TIAA, CI/CD, SUP, Guide Mode…) have a dotted underline. Hover, focus or tap one for a short definition and a link to where it comes from.
- The terms are in `data/glossary.js` (term, short definition, link, other spellings).
- `<Term id="mlh">` marks fixed text and `<TermText :text>` marks data-driven text (the About card's plain-English lines, gear tags and notes). `glossaryHtml` (`server/utils/glossaryHtml.js`) marks the bio's markdown and every blog post (on its own page and in the Curiosity Feed), after sanitizing. A post can opt out with `glossary: false` in its front matter. Only the first use of a term in each piece of text is marked.
- `<TermTip>` (in the default layout) is the one definition bubble for every term. It opens on hover, focus (Enter moves into its link) and tap, stays while the pointer is on it, and closes on Escape, a tap elsewhere or scrolling (WCAG 1.4.13). A tap (or click) on the bubble itself, anywhere but its link, dismisses it too, which its hint says ("Tap to dismiss" on touch screens, "Click to dismiss" with a mouse). A dismissal goes "poof": the bubble swells, blurs and fades while puffs of smoke fly out (with reduced motion it just fades). Screen readers get the definition as the term's description.
- `tests/app/glossary.test.mjs` fails on an acronym in the display text that has no definition; the fix is a glossary entry or plain words (CLAUDE.md "Display text").

## Editing gear lists
How it fits together, as diagrams: [docs/gear-editing.md](docs/gear-editing.md).

Signed in, each gear page (`/gear/:list`) has **✏️ Edit list**: change any item (name, brand, quantity, section, category, status, tags, notes), remove it, or add one. Changes show on the page as they'll look and stay in that browser until sent. **Send** turns them into one entry in the rolling **Gear updates** pull request:

1. `/api/gear/submit` (`netlify/functions/gear-submit.mjs`) takes the changes from a signed-in owner only. It checks them and signs exactly them: an HMAC over the owner's email, the list and a hash of the changes (`netlify/lib/gearToken.mjs`), keyed from the sign-in's own secret (`GITHUB_CLIENT_SECRET`), so only the site's functions can sign or check one. It keeps the signed changes on Netlify, in the `gear-edits` Blobs store under `pending/<time>-<random>`.
2. The **Gear updates** workflow (`.github/workflows/gear-updates.yml`, `scripts/gear-updates.mjs`) runs weekly (Mondays 13:23 UTC), whenever main changes (a merged pull request), and on demand from main. It reads the pending edits from `/api/gear/pending` (`netlify/functions/gear-pending.mjs`), signing in with **GitHub Actions' own token** for the run (OIDC): the site checks it was signed by GitHub, for this repository (by name and by id) and its `gear-updates.yml` on main (`netlify/lib/githubOidc.mjs`), so there's no secret to store anywhere. It still asks the site (`/api/gear/verify`) about each edit and drops any not signed by an owner for exactly those changes; if the site doesn't answer, the edit waits for the next run. It applies the rest in the order they were sent to `data/gear/*.json` on the `gear-updates` branch, one commit per edit, runs `npm test`, opens or updates the **Gear updates** pull request, and then deletes the edits it handled from the site. The same changes on the same list always give the same file, byte for byte.

Merge the pull request to publish. Until then, the editor shows the live lists plus your unsent changes, not edits already waiting in the pull request. New lists are added by hand (a new `data/gear/<id>.json` and a line in `data/inventory.mjs`).

**One-time setup:** GitHub → Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests". That's all: no secrets, and nothing to turn on at Netlify (the store comes with the site).

A pull request opened with the workflow's own token doesn't start other workflows, so the script runs the tests itself. Netlify still builds a deploy preview, and the next push to the branch runs CI.

## Install as an app (PWA)
`public/manifest.webmanifest`, `public/sw.js` and the icons in `public/icons/` make the site installable:
- **Android / Chrome:** menu → *Install app*
- **iOS / Safari:** Share → *Add to Home Screen*. The installed app uses an opaque status bar (`apple-mobile-web-app-status-bar-style: black`) and starts below it. iOS reads that when the app is added, so remove and re-add the app after changing it. When it runs installed, the page gets `html.is-installed` (`utils/installed.js`) and the nav gets a little more room.

## License
The source code is licensed under the [BSD 3-Clause License](LICENSE.md). The site's Personal Content is not covered by it, as set out in [CONTENT-NOTICE.md](CONTENT-NOTICE.md): writing, photographs and other likenesses, personal information, and personal lists and data. That includes `content/`, `data/gear/`, `data/inventory.mjs`, `data/hobbyFacts.mjs` and `netlify/lib/bioPhoto.sealed.mjs`. It's all rights reserved, may not be reproduced or distributed without written permission, and must be removed from forks. The same terms are on `/terms`.
