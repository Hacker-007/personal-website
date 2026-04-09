import { useEffect, useRef, useState } from 'react'
import { RedisResponse } from '../types/redis'
import { type } from 'arktype'
import { apiFetch } from '../utils/api'

interface CommandSubmission {
  command: string
  outputLines: string[]
}

interface CommandInputProps {
  executeCommand: (command: string) => Promise<void>
}

export function RedisTerminal() {
  const bodyRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const [commands, setCommands] = useState<CommandSubmission[]>([
    {
      command: 'PING',
      outputLines: ['PONG'],
    },
  ])

  useEffect(() => {
    if (shouldAutoScrollRef.current && bodyRef.current) {
      const el = bodyRef.current
      el.scrollTop = el.scrollHeight
    }
  }, [commands])

  const handleScroll = () => {
    const el = bodyRef.current
    if (!el) {
      return
    }

    // We should auto-scroll to the bottom of the
    // container if we are within 10px from the
    // bottom.
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10
    shouldAutoScrollRef.current = atBottom
  }

  const executeCommand = async (command: string) => {
    const response = await apiFetch('/api/redis', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
      .then(res => res.json())
      .then(RedisResponse)

    if (response instanceof type.errors) {
      return
    }

    setCommands(previousCommands => [...previousCommands, response])
  }

  return (
    <div className="border-border hover:border-border-hover flex h-80 w-full flex-col overflow-hidden rounded-xs border font-mono transition-colors duration-150">
      {/* Terminal Header */}
      <div className="border-border flex shrink-0 items-center border-b bg-[#0e0e14] px-3 py-2.5">
        <span className="text-muted flex-1 text-sm">redis-cli</span>
      </div>

      {/* Terminal Body */}
      <div
        ref={bodyRef}
        onScroll={handleScroll}
        className="bg-surface-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {commands.map(({ command, outputLines }, i) => (
          <SubmittedCommand
            key={i}
            command={command}
            outputLines={outputLines}
          />
        ))}
        <CommandInput executeCommand={executeCommand} />
      </div>
    </div>
  )
}

function SubmittedCommand({ command, outputLines }: CommandSubmission) {
  return (
    <div>
      {/* Command Input */}
      <p className="flex items-center gap-1 text-sm">
        <span className="text-muted">redis</span>
        <span className="text-accent">
          <PromptIcon className="size-3" />
        </span>
        <span className="text-text">{command}</span>
      </p>

      {/* Command Output */}
      <div className="border-l-accent/10 mt-1 border-l-2 pl-3">
        {outputLines.map((line, i) => (
          <p key={i} className="text-muted text-sm">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function CommandInput({ executeCommand }: CommandInputProps) {
  const [commandInput, setCommandInput] = useState('')
  const [history, setHistory] = useState<string[]>(['PING'])
  const [_, setHistoryIndex] = useState<number | null>(null)

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const command = commandInput.trim()
    if (event.key === 'Enter' && command !== '') {
      await executeCommand(command)

      setCommandInput('')
      setHistory(previous => [...previous, command])
      setHistoryIndex(null)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHistoryIndex(previous => {
        const index =
          previous === null ? history.length - 1 : Math.max(previous - 1, 0)

        setCommandInput(history[index] ?? '')
        return index
      })
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHistoryIndex(previous => {
        if (previous === null) {
          return null
        }

        const index = previous + 1
        if (index >= history.length) {
          setCommandInput('')
          return null
        }

        setCommandInput(history[index])
        return index
      })
    }
  }

  return (
    <div>
      <p className="flex items-center gap-1 text-sm">
        <span className="text-muted">redis</span>
        <span className="text-accent">
          <PromptIcon className="size-3" />
        </span>

        <input
          className="text-text caret-accent w-full border-none bg-transparent outline-none focus:border-none focus:outline-none"
          placeholder="Type a command..."
          value={commandInput}
          onChange={e => setCommandInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
      </p>
    </div>
  )
}

function PromptIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  )
}
