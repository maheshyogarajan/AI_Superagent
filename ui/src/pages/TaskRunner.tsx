import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Play, Square, FileText, Download, ExternalLink, Eye } from 'lucide-react'
import { PlanDrawer } from '../components/PlanDrawer'

export function TaskRunner() {
  const navigate = useNavigate()
  const [instruction, setInstruction] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('coordinator')
  const [isRunning, setIsRunning] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [planId, setPlanId] = useState<string | null>(null)

  const taskExamples = [
    "Research the latest developments in artificial intelligence for 2024",
    "Analyze market trends in renewable energy sector",
    "Evaluate competitive landscape for fintech startups",
    "Study consumer behavior patterns in e-commerce"
  ]

  const handlePreviewPlan = async () => {
    if (!instruction.trim()) return

    try {
      setLogs(['Creating execution plan...'])
      
      const response = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction
        })
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        setPlanId(result.plan.plan_id)
        setLogs(prev => [...prev, `Plan created: ${result.plan.plan_id}`])
      } else {
        throw new Error(result.message || 'Plan creation failed')
      }
    } catch (error) {
      setLogs(prev => [...prev, `Error creating plan: ${error instanceof Error ? error.message : 'Unknown error'}`])
    }
  }

  const handleSubmitTask = async () => {
    if (!instruction.trim() || isRunning) return

    try {
      setIsRunning(true)
      setLogs(['Submitting task to agent system...'])
      
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          recipient: selectedAgent,
          context: { priority: 'normal' }
        })
      })

      const result = await response.json()
      
      if (result.status === 'success') {
        setCurrentTaskId(result.task_id)
        setTaskStatus('running')
        setLogs(prev => [...prev, `Task submitted: ${result.task_id}`])
        
        // Simulate task completion after delay
        setTimeout(() => {
          setIsRunning(false)
          setTaskStatus('completed')
          setLogs(prev => [...prev, 'Task execution completed'])
        }, 3000)
      } else {
        throw new Error(result.message || 'Task submission failed')
      }
    } catch (error) {
      setLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
      setIsRunning(false)
      setTaskStatus('error')
    }
  }

  const handleViewWorkings = () => {
    if (currentTaskId) {
      navigate(`/workings/${currentTaskId}`)
    }
  }

  const handleDownloadWorkings = () => {
    if (currentTaskId) {
      const link = document.createElement('a')
      link.href = `/workings/${currentTaskId}/raw`
      link.download = `task_${currentTaskId}_workings.md`
      link.click()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Task Runner</h1>
        <p className="text-muted-foreground">
          Submit tasks to the AI agent system and monitor execution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Submission */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Task Instruction
                </label>
                <Textarea
                  placeholder="Enter your task instruction here..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={4}
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Agent
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="research">Research Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handlePreviewPlan} 
                  disabled={!instruction.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Plan
                </Button>
                
                <Button 
                  onClick={handleSubmitTask} 
                  disabled={!instruction.trim() || isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Task
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Example Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {taskExamples.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3"
                  onClick={() => setInstruction(example)}
                  disabled={isRunning}
                >
                  {example}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Task Status & Logs */}
        <div className="space-y-6">
          {/* Task Status */}
          {currentTaskId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Task Status</CardTitle>
                <Badge variant={taskStatus === 'completed' ? 'default' : taskStatus === 'error' ? 'destructive' : 'secondary'}>
                  {taskStatus}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Task ID</p>
                  <p className="font-mono text-sm">{currentTaskId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <p className="text-sm">{selectedAgent}</p>
                </div>
                
                {taskStatus === 'completed' && (
                  <div className="flex gap-2 pt-2">
                    <Link to={`/workings/${currentTaskId}`} className="underline text-primary">
                      View Workings
                    </Link>
                    <Button size="sm" variant="outline" onClick={handleDownloadWorkings}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Execution Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No logs yet. Submit a task to see execution details.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        <span className="text-muted-foreground">
                          [{new Date().toLocaleTimeString()}]
                        </span>{' '}
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}