// Marks glossary terms (data/glossary.js) in markdown that renderMarkdown has already rendered
// and sanitized (README "Glossary terms"). It only wraps text: the first use of each term becomes
// <abbr class="term" data-term="id" tabindex="0" aria-describedby="..."> with its definition in a
// hidden <span> next to it (screen readers read it as the description; <TermTip> shows it on
// hover, focus or tap). Nothing inside links, code or headings changes, and no markup from the
// post can come through: the page is parsed, the text nodes are replaced, and it's written back
// exactly as it was otherwise (tests/security/glossary.test.mjs).
import render from 'dom-serializer'
import { Element, Text } from 'domhandler'
import { parseDocument } from 'htmlparser2'
import { glossaryEntry } from '../../data/glossary.js'
import { findTerms } from '../../utils/glossary.js'

const ROUND_TRIP = { decodeEntities: false }
const SKIP = new Set(['a', 'abbr', 'code', 'pre', 'kbd', 'samp', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style'])

const escapeHtml = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// `idPrefix` keeps the description ids unique when a page shows more than one rendered block
export const glossaryHtml = (html, { idPrefix = 'term' } = {}) => {
  if (typeof html !== 'string' || !html) return ''
  const doc = parseDocument(html, ROUND_TRIP)
  const seen = new Set()
  let count = 0

  const walk = node => {
    for (const child of [...(node.children ?? [])]) {
      if (child.type === 'text') {
        // The text is still escaped HTML here (decodeEntities: false), and terms are plain words,
        // so a match never splits an entity
        const parts = findTerms(child.data, seen)
        if (!parts.some(part => part.id)) continue
        const replacement = parts.flatMap(part => {
          if (!part.id) return [new Text(part.text)]
          const entry = glossaryEntry(part.id)
          const descId = `${idPrefix}-${part.id}-${++count}`
          return [
            new Element('abbr', { class: 'term', 'data-term': part.id, tabindex: '0', 'aria-describedby': descId }, [new Text(part.text)]),
            new Element('span', { id: descId, hidden: '' }, [new Text(escapeHtml(entry.short))])
          ]
        })
        const parent = child.parent
        const at = parent.children.indexOf(child)
        parent.children.splice(at, 1, ...replacement)
        replacement.forEach((n, i) => {
          n.parent = parent
          n.prev = replacement[i - 1] ?? parent.children[at - 1] ?? null
          n.next = replacement[i + 1] ?? parent.children[at + replacement.length] ?? null
        })
      } else if (child.type === 'tag' && !SKIP.has(child.name)) {
        walk(child)
      }
    }
  }
  walk(doc)
  return render(doc, ROUND_TRIP)
}
