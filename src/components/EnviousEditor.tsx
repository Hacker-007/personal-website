import { useRef, useState } from 'react'

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
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const lines = code.split('\n')
  const lineCount = lines.length

  function handleScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
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
      setOutput('55')
      setIsRunning(false)
    }, 600)
  }

  return (
    <div className="border-border flex h-80 w-full flex-col overflow-hidden rounded-md border font-mono">
      {/* Editor Header */}
      <div className="border-border flex shrink-0 items-center border-b bg-[#0e0e14] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="bg-danger size-2 rounded-full" />
          <span className="size-2 rounded-full bg-[#e0af68]" />
          <span className="bg-success size-2 rounded-full" />
        </div>
        <span className="text-muted flex-1 text-center text-xs">main.envy</span>
        <EditableIndicator />
      </div>

      {/* Editor Body */}
      <div className="bg-surface-1 relative flex min-h-0 flex-1">
        {/* Body Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="flex w-10 shrink-0 flex-col overflow-hidden bg-[#0e0e14] pt-2 pr-2 pb-2 text-right font-mono text-xs leading-5"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className="text-muted">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Body Text */}
        <div className="relative min-h-0 flex-1">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="text-text caret-accent absolute inset-0 resize-none overflow-auto border-none bg-transparent p-2 pl-3 font-mono text-xs leading-5 outline-none"
          />
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="text-accent border-accent/25 bg-accent/10 hover:border-accent/35 hover:bg-accent/20 absolute right-3 bottom-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run'}
          <PlayIcon />
        </button>
      </div>

      {output !== null && (
        <div className="border-border shrink-0 border-t bg-[#0e0e14] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-muted font-mono text-xs">output</span>
            <span className="text-success font-mono text-xs">{output}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function EditableIndicator() {
  return (
    <span className="border-border text-muted flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs">
      <span className="bg-success size-1.5 rounded-full" />
      editable
    </span>
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
