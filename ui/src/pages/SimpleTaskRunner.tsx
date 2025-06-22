import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export function SimpleTaskRunner() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan_id');
  
  const [instruction, setInstruction] = useState('')
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [planTasks, setPlanTasks] = useState<any[]>([])
  const [isLoadingPlan, setIsLoadingPlan] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)

  // Fetch tasks when plan_id is provided in URL
  useEffect(() => {
    if (planId) {
      fetchPlanTasks(planId);
      setupSSE(planId);
    }
  }, [planId]);

  const fetchPlanTasks = async (planId: string) => {
    setIsLoadingPlan(true);
    try {
      const response = await fetch(`/api/tasks?plan_id=${planId}`);
      const result = await response.json();
      if (result.tasks) {
        setPlanTasks(result.tasks);
        setStatus('plan-loaded');
      }
    } catch (error) {
      console.error('Error fetching plan tasks:', error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const setupSSE = (planId: string) => {
    const eventSource = new EventSource(`/api/tasks/stream?plan_id=${planId}`);
    
    eventSource.onopen = () => {
      setSseConnected(true);
      console.log('SSE connection opened for plan:', planId);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const taskUpdate = JSON.parse(event.data);
        // Update specific task in the list
        setPlanTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskUpdate.task_id 
              ? { ...task, status: taskUpdate.status, result: taskUpdate.result }
              : task
          )
        );
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = () => {
      setSseConnected(false);
      console.log('SSE connection error, retrying...');
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setSseConnected(false);
    };
  };

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Task Runner</h1>
        {planId && (
          <div className="text-sm text-gray-600">
            Plan: <span className="font-mono">{planId}</span>
          </div>
        )}
      </div>
      
      {/* Plan Tasks Live View */}
      {planId && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Plan Execution Progress</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {sseConnected ? 'Live Updates' : 'Connecting...'}
              </span>
            </div>
          </div>
          {isLoadingPlan ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading plan tasks...</p>
            </div>
          ) : planTasks.length > 0 ? (
            <div className="space-y-3">
              {planTasks.map((task, index) => (
                <div key={task.id || index} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {task.agent_id || 'unknown'}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {task.status || 'pending'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {task.step_id || `Task ${index + 1}`}
                    </span>
                  </div>
                  <p className="text-gray-700">{task.instruction || task.description}</p>
                  {task.id && (
                    <div className="mt-2">
                      <Link 
                        to={`/workings/${task.id}`}
                        className="text-blue-600 text-sm underline hover:text-blue-800"
                      >
                        View Progress
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No tasks found for this plan</p>
            </div>
          )}
        </div>
      )}
      
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