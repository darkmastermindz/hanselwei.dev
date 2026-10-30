# Working on hanselwei.dev

## Pull requests
- Whenever you push to a branch that has an open pull request, update that PR's description in the same step so it always matches what is on the branch. Do this without being asked.
- Follow `.github/PULL_REQUEST_TEMPLATE.md` (Summary, Related Issue, Changes Made, How to Test, Additional Notes).

## Security tests
- Run `npm test` before pushing. It runs the injection tests in `tests/security/` (Node's built-in test runner), and the same tests run in CI and before every Netlify build.
- When you add a new way for outside input to reach the site (markdown, front matter, URL params, API fields, config), add payloads to `tests/security/payloads.mjs` and a test for it.
- Render untrusted markdown only through `renderMarkdown` (sanitized), pass URLs bound to `:href`/`:src` through `safeUrl`, and look up objects keyed by URL input with `Object.hasOwn`.

## Display text: acronyms, lingo and jargon
- Consider this for every piece of new display text (pages, components, data such as the About card, gear lists, hobby facts, the bio, and UI labels). First, say it in plain words where you can. Where a term is worth keeping (an acronym, a certification, a tool, a sport's lingo), give it a definition:
  - Add it to `data/glossary.js` with a short plain-English definition and a backlink (the official site, or Wikipedia), and `aliases` for other spellings.
  - In Vue templates, wrap fixed text in `<Term id="...">` and render data-driven text through `<TermText :text="...">`. Rendered markdown gets terms from `glossaryHtml` (the bio and every blog post; a post opts out with `glossary: false` in front matter). `<TermTip>` (in the default layout) shows the definition on hover, focus and tap.
  - Not inside buttons, links, chips or headings (nothing interactive inside something interactive): reword those instead.
- `npm test` fails on an acronym in the display text that isn't in the glossary or the everyday list in `tests/app/glossary.test.mjs`.
