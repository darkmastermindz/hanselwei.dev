import assert from 'node:assert/strict'

// Fails if `html` contains anything a browser could execute or that could change how
// the page loads: script-capable elements, inline event handlers, inline styles, or
// dangerous URL schemes in href/src/action-like attributes.
const BANNED_TAGS = /<\s*\/?\s*(script|iframe|frame|object|embed|base|meta|link|style|form|input|button|textarea|select|svg|math|template)\b/i
// Checked against each tag with its quoted attribute values blanked out, so text like
// title="x onmouseover=..." (inert, inside a value) doesn't count as a handler
const EVENT_HANDLER = /\s(on[a-z]+)\s*=/i
const STYLE_ATTR = /\sstyle\s*=/i
const tagsWithoutValues = html => (html.match(/<[^>]*>/g) ?? []).map(tag => tag.replace(/"[^"]*"|'[^']*'/g, '""'))
const URL_ATTR = /\s(href|src|action|formaction|xlink:href|srcset|poster|data)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi

const decode = value =>
  value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
    .replace(/[\s\u0000-\u001f]/g, '')
    .toLowerCase()

export const assertSafeHtml = (html, input = '') => {
  const context = `\n  input:  ${JSON.stringify(input)}\n  output: ${JSON.stringify(html)}`
  assert.doesNotMatch(html, BANNED_TAGS, `dangerous element survived${context}`)
  for (const tag of tagsWithoutValues(html)) {
    assert.doesNotMatch(tag, EVENT_HANDLER, `event handler attribute survived${context}`)
    assert.doesNotMatch(tag, STYLE_ATTR, `inline style survived${context}`)
  }
  for (const match of html.matchAll(URL_ATTR)) {
    const url = decode(match[3] ?? match[4] ?? match[5] ?? '')
    assert.ok(!/^(javascript|vbscript|data|file):/.test(url), `dangerous URL in ${match[1]}=${context}`)
  }
}
