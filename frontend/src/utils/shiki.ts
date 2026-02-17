import { createHighlighterCore, type ShikiTransformer } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

import rust from 'shiki/langs/rust.mjs'
import catppuccinMocha from 'shiki/themes/catppuccin-mocha.mjs'

export const removeItalicsTransformer: ShikiTransformer = {
  name: 'remove-italics',
  span(node) {
    if (node.properties.style && typeof node.properties.style === 'string') {
      node.properties.style = node.properties.style.replace(
        /font-style:\s*italic;?/g,
        ''
      )
    }
  },
}

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null

async function getHighlighter() {
  if (!highlighterPromise) {
    const engine = await createOnigurumaEngine(() => import('shiki/wasm'))

    highlighterPromise = createHighlighterCore({
      langs: [rust],
      themes: [catppuccinMocha],
      engine,
    })
  }

  return highlighterPromise
}

/**
 * Generates HTML to provide syntax highlighting on the given
 * `code`.
 *
 * NOTE:
 * This should not be used at client time, as the outputted
 * bundle is large and is too expensive.
 */
export async function renderHighlightedCode(code: string) {
  const highlighter = await getHighlighter()

  return highlighter.codeToHtml(code, {
    lang: 'rust',
    theme: 'catppuccin-mocha',
    transformers: [removeItalicsTransformer],
  })
}
