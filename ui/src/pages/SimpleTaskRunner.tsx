import { useState } from 'react'
import { Link } from 'react-router-dom'

export function SimpleTaskRunner() {
  const [instruction, setInstruction] = useState('')
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')

  const handleSubmit = async () => {
    if (!instruction.trim()) return

    setStatus('submitting')
    
    try {
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction,
          recipient: 'coordinator'
        }),
      })

      const result = await response.json()
      
      if (result.task_id) {
        setCurrentTaskId(result.task_id)
        setStatus('completed')
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Task submission failed:', error)
      setStatus('error')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Task Runner</h1>
      
      <div className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Task Instruction
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-vertical"
            placeholder="Enter your task instruction here..."
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!instruction.trim() || status === 'submitting'}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Task'}
        </button>
        
        {status === 'completed' && currentTaskId && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Task Completed</h3>
            <p className="text-green-700 mb-3">Task ID: {currentTaskId}</p>
            <Link 
              to={`/workings/${currentTaskId}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              View Workings
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800">Task Failed</h3>
            <p className="text-red-700">Please try again or check your input.</p>
          </div>
        )}
      </div>
    </div>
  )
}