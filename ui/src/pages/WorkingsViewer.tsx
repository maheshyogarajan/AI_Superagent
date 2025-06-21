import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function WorkingsViewer() {
  const { taskId } = useParams()
  const [steps, setSteps] = useState<string[]>([])
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    fetch(`/workings/${taskId}`)
      .then(r => r.json())
      .then(({ steps }) => setSteps(steps))
  }, [taskId])

  if (!steps.length) return <p>Loading…</p>

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <aside className="col-span-3 border-r pr-2 overflow-y-auto">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCursor(i)}
            className={`block w-full text-left py-1 px-2 rounded ${i===cursor?'bg-primary text-white':'hover:bg-muted'}`}
          >
            Step {i+1}
          </button>
        ))}
      </aside>
      <main className="col-span-9 prose dark:prose-invert max-w-none">
        <ReactMarkdown>{steps[cursor]}</ReactMarkdown>
      </main>
    </div>
  )
}