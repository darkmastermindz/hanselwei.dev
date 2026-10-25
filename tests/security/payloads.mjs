// Shared injection payloads for the security tests. Add to these whenever a new input
// surface appears, so every test file exercises it.

export const XSS_HTML = [
  '<script>alert(1)</script>',
  '<SCRIPT SRC=//evil.example/x.js></SCRIPT>',
  '<img src=x onerror=alert(1)>',
  '<img src="x" onerror="alert(1)">',
  '<svg onload=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<object data="javascript:alert(1)"></object>',
  '<embed src="javascript:alert(1)">',
  '<a href="javascript:alert(1)">click</a>',
  '<a href="JaVaScRiPt:alert(1)">click</a>',
  '<a href="&#106;avascript:alert(1)">click</a>',
  '<a href=" javascript:alert(1)">click</a>',
  '<a href="java\tscript:alert(1)">click</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>',
  '<a href="vbscript:msgbox(1)">click</a>',
  '<div style="background:url(javascript:alert(1))">x</div>',
  '<p onclick="alert(1)">x</p>',
  '<details open ontoggle=alert(1)>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<form action="javascript:alert(1)"><button>x</button></form>',
  '<base href="https://evil.example/">',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  '<link rel=stylesheet href="https://evil.example/x.css">',
  '"><script>alert(1)</script>',
  "'><img src=x onerror=alert(1)>",
  '<!--<img src="--><img src=x onerror=alert(1)//">'
]

// Markdown that turns into dangerous HTML once rendered
export const XSS_MARKDOWN = [
  '[click](javascript:alert(1))',
  '[click](JAVASCRIPT:alert(1))',
  '[click](&#x6A;avascript:alert(1))',
  '[click](data:text/html,<script>alert(1)</script>)',
  '[click](vbscript:msgbox(1))',
  '![x](javascript:alert(1))',
  '![x](x" onerror="alert(1))',
  '[x](https://ok.example "title\\" onmouseover=\\"alert(1)")',
  '<https://ok.example/"onmouseover="alert(1)>'
]

export const UNSAFE_URLS = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  ' javascript:alert(1)',
  '\njavascript:alert(1)',
  'java\nscript:alert(1)',
  'java\tscript:alert(1)',
  '&#106;avascript:alert(1)',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'data:image/svg+xml,<svg onload=alert(1)>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  '//evil.example/x', // protocol-relative: leaves the site
  'http://', // no host
  '"><script>alert(1)</script>'
]

export const SAFE_URLS = ['https://dev.to/hansel', 'http://example.com/a?b=c#d', 'https://res.cloudinary.com/x.png', '/blog/hello-world']

export const XML_INJECTION = [
  'x</title><script>alert(1)</script>',
  ']]><evil/>',
  '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]>',
  '&e;',
  '"\'<>&'
]

export const PATH_TRAVERSAL = [
  '../evil',
  '../../etc/passwd',
  '..%2f..%2fetc',
  '/etc/passwd',
  'a/b',
  'a\\b',
  'evil\u0000.md',
  '.hidden',
  '',
  ' ',
  'UPPER',
  'a'.repeat(300)
]

export const FRONT_MATTER_BREAKS = ['x\n---\nslug: evil', 'x\r\ndraft: true', '"\nsource: evil', 'a: b']

export const JS_BREAKOUTS = ['";process.exit(1)//', "'};globalThis.pwned=1;//", '`${globalThis.pwned=1}`', '</script><script>alert(1)</script>']

// Browser language tags (navigator.languages): read by the About card's translate link
export const HOSTILE_LANGUAGES = [
  'es&u=https://evil.example',
  'es#x',
  'es?tl=xx',
  'es/../x',
  'es x',
  'es\nx',
  'javascript:alert(1)',
  '-es',
  'es-',
  'e',
  'abcd',
  'es-' + 'x'.repeat(40)
]

export const PROTOTYPE_KEYS = ['__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty', '__defineGetter__']

// The GitHub profile README: markup, markdown tricks, control characters and oversize text
export const HOSTILE_README = [
  ...XSS_HTML,
  ...XSS_MARKDOWN,
  'line one\u0000hidden\nline two',
  'bell\u0007 and escape \u001b[31m red',
  'x'.repeat(100_001)
]

// Long input for catastrophic-backtracking checks
export const REDOS = 'a'.repeat(50_000) + '!'

// Colours from config.toml [seasons], bound into the background's SVG gradient
export const HOSTILE_COLORS = [
  'red',
  '#fff',
  '#ffffff;}',
  '#12345g',
  'url(javascript:alert(1))',
  'expression(alert(1))',
  '#ffffff" onload="alert(1)',
  'var(--x)',
  ' #ffffff',
]

// The id on the social link hand-off page (/out/<id>): only known ids lead anywhere
export const OUTBOUND_IDS = [
  'https://evil.example',
  '//evil.example',
  'javascript:alert(1)',
  'mastodon/../../evil.example',
  'mastodon?x=https://evil.example',
  ' mastodon',
  'mastodon ',
  'MASTODON',
  'mastodon\u0000',
  '%6Dastodon',
  ''
]
