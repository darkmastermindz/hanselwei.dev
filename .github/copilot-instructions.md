# Copilot instructions for hanselwei.dev

## Pull requests
- Whenever you push to a branch that has an open pull request, update that PR's description in the same step so it always matches what is on the branch. Do this without being asked.
- Follow `.github/PULL_REQUEST_TEMPLATE.md` (Summary, Related Issue, Changes Made, How to Test, Additional Notes).

## Security tests
- Run `npm test` before pushing. It runs the injection tests in `tests/security/` (Node's built-in test runner), and the same tests run in CI and before every Netlify build.
- When you add a new way for outside input to reach the site (markdown, front matter, URL params, API fields, config), add payloads to `tests/security/payloads.mjs` and a test for it.
- Render untrusted markdown only through `renderMarkdown` (sanitized), pass URLs bound to `:href`/`:src` through `safeUrl`, and look up objects keyed by URL input with `Object.hasOwn`.
