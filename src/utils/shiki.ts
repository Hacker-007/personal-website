import {
  codeToHtml,
  type ShikiTransformer,
  type BuiltinLanguage,
  type BuiltinTheme,
} from 'shiki'

const removeItalicsTransformer: ShikiTransformer = {
  span(node) {
    if (node.properties.style && typeof node.properties.style === 'string') {
      node.properties.style = node.properties.style.replace(
        /font-style:\s*italic;?/g,
        ''
      )
    }
  },
}

/**
 * Generates HTML to provide syntax highlighting on the given
 * `code`.
 */
export async function renderHighlightedCode(
  code: string,
  language: BuiltinLanguage = 'rust',
  theme: BuiltinTheme = 'catppuccin-mocha'
): Promise<string> {
  return codeToHtml(code, {
    lang: language,
    theme,
    transformers: [removeItalicsTransformer],
  })
}
