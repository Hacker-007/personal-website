import { renderHighlightedCode } from '../utils/shiki'

self.onmessage = async (event: MessageEvent<string>) => {
  const code = event.data
  const html = await renderHighlightedCode(code)
  self.postMessage(html)
}
