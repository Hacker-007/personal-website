import { useEffect, useState } from 'react'

const INTERVAL: number = 80
const FRAMES: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export default function CliSpinner() {
  const [frameIdx, setFrameIdx] = useState(0)
  useEffect(() => {
    const intervalId = setInterval(() => {
        setFrameIdx(currentIdx => (currentIdx + 1) % FRAMES.length)
    }, INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

  return <div>{FRAMES[frameIdx]}</div>
}
