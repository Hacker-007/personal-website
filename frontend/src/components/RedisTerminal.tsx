import { useState } from 'react'

interface CommandSubmission {
  command: string
  outputLines: string[]
}

interface CommandInputProps {
  executeCommand: (command: string) => void
}

export function RedisTerminal() {
  const [commands, setCommands] = useState<CommandSubmission[]>([
    {
      command: 'PING',
      outputLines: ['PONG'],
    },
  ])

  const executeCommand = (command: string) => {
    // TODO: execute `command` on API
    setCommands(previousCommands => [
      ...previousCommands,
      { command, outputLines: ['(error) the terminal is under construction'] },
    ])
  }

  return (
    <div className="border-border hover:border-border-hover flex h-80 w-full flex-col overflow-hidden rounded-xs border font-mono transition-colors duration-150">
      {/* Terminal Header */}
      <div className="border-border flex shrink-0 items-center border-b bg-[#0e0e14] px-3 py-2.5">
        <span className="text-muted flex-1 text-sm">redis-cli</span>
      </div>

      {/* Terminal Body */}
      <div className="bg-surface-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
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

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const command = commandInput.trim()
    if (event.key === 'Enter' && command !== '') {
      executeCommand(command)
      setCommandInput('')
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
          onKeyUp={handleKeyUp}
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
