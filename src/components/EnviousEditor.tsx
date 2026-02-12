import { useEffect, useRef, useState } from 'react'
import { codeToHtml, type ShikiTransformer } from 'shiki'

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

const defaultCode = `fn fibonacci(n: Int) -> Int {
  if n <= 1 {
    return n
  }

  let a = fibonacci(n - 1)
  let b = fibonacci(n - 2)
  return a + b
}

let result = fibonacci(10)
print(result)`

export function EnviousEditor() {
  const [code, setCode] = useState(defaultCode)
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [scrollPos, setScrollPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lines = code.split('\n')
  const lineCount = lines.length

  useEffect(() => {
    codeToHtml(code, {
      lang: 'rust',
      theme: 'catppuccin-mocha',
      transformers: [removeItalicsTransformer],
    }).then(html => {
      setHighlightedHtml(html)
    })
  }, [code])

  function handleScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const { scrollTop, scrollLeft } = e.currentTarget
    setScrollPos({ top: scrollTop, left: scrollLeft })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) {
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  function handleRun() {
    setIsRunning(true)
    setOutput(null)
    setTimeout(() => {
      // TODO: execute `code` on API
      setOutput('error: the editor is under construction')
      setIsRunning(false)
    }, 600)
  }

  return (
    <div className="border-border hover:border-border-hover flex h-80 w-full flex-col overflow-hidden rounded-xs border font-mono transition-colors duration-150">
      {/* Editor Header */}
      <div className="border-border flex shrink-0 items-center border-b bg-[#0e0e14] px-3 py-2.5">
        <span className="text-muted flex-1 text-sm">main.envy</span>
      </div>

      {/* Editor Body */}
      <div className="bg-surface-1 relative flex min-h-0 flex-1">
        {/* Body Line Numbers */}
        <div className="w-10 shrink-0 overflow-hidden bg-[#0e0e14]">
          <div
            className="pointer-events-none flex flex-col pt-2 pr-2 pb-2 text-right font-mono text-sm leading-5"
            style={{ transform: `translateY(-${scrollPos.top}px)` }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i} className="text-muted">
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Body Text */}
        <div className="relative min-h-0 flex-1">
          {/* Highlighted Code Overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden p-2 pl-3">
            <div
              className="font-mono text-sm leading-5 [&_code]:font-[inherit] [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0"
              style={{
                transform: `translate(-${scrollPos.left}px, -${scrollPos.top}px)`,
              }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>

          {/* Transparent Editor Body */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="caret-accent absolute inset-0 resize-none overflow-auto overscroll-contain border-none bg-transparent p-2 pl-3 font-mono text-sm leading-5 text-transparent outline-none"
          />
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="text-accent border-accent/25 bg-accent/10 hover:border-accent/35 hover:bg-accent/20 absolute right-3 bottom-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run'}
          <PlayIcon />
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-150"
        style={{
          gridTemplateRows: output !== null ? '1fr' : '0fr',
          opacity: output !== null ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="border-border border-t bg-[#0e0e14] px-4 py-2.5">
            <div className="flex items-start gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-muted font-mono text-xs">output</span>
                <span className="font-mono text-sm">{output}</span>
              </div>
              <button
                onClick={() => setOutput(null)}
                className="text-muted hover:text-text hover:bg-text/10 -m-1 cursor-pointer rounded-full border-none bg-transparent p-1 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className="size-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className="size-3"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
    </svg>
  )
}
