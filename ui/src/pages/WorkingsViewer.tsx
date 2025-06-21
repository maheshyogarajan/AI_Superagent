import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function WorkingsViewer() {
  const { taskId } = useParams()
  const [steps, setSteps] = useState<string[]>([])
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    fetch(`/workings/${taskId}`)
      .then(r => r.json())
      .then(({ steps }) => setSteps(steps || []))
      .catch(() => setSteps([]))
  }, [taskId])

  if (!steps.length) return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Task Documentation</h1>
      <p>Loading documentation for task: {taskId}</p>
    </div>
  )

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <aside className="col-span-3 border-r pr-2 overflow-y-auto">
        <h2 className="font-semibold mb-4">Steps</h2>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCursor(i)}
            className={`block w-full text-left py-2 px-3 rounded mb-2 ${
              i === cursor 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Step {i + 1}
          </button>
        ))}
      </aside>
      <main className="col-span-9">
        <div className="prose dark:prose-invert max-w-none">
          <h2>Step {cursor + 1} of {steps.length}</h2>
          <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded">
            {steps[cursor]}
          </pre>
        </div>
      </main>
    </div>
  )
}