import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Download, Clock, FileText } from 'lucide-react'

interface WorkingStep {
  content: string
  index: number
}

interface WorkingsData {
  task_id: string
  status: string
  step_count: number
  steps: string[]
  markdown: string
}

export function WorkingsViewer() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [workings, setWorkings] = useState<WorkingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current')

  useEffect(() => {
    const fetchWorkings = async () => {
      if (!taskId) return

      try {
        setLoading(true)
        const response = await fetch(`/workings/${taskId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch workings: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.status === 'found') {
          setWorkings(data)
          // Set active step to the last completed step
          setActiveStep(data.step_count - 1)
        } else {
          setError('Task documentation not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task workings')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkings()
  }, [taskId])

  const handleDownload = () => {
    if (!taskId) return
    
    const link = document.createElement('a')
    link.href = `/workings/${taskId}/raw`
    link.download = `task_${taskId}_workings.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (content: string): string => {
    // Extract timestamp from content if present
    const timestampMatch = content.match(/\*\*Started:\*\* ([\d-T:.]+)/)
    if (timestampMatch) {
      const timestamp = new Date(timestampMatch[1])
      return timestamp.toLocaleString()
    }
    return ''
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading task documentation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Documentation Not Found</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!workings) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Task Documentation</h1>
            <p className="text-muted-foreground">ID: {workings.task_id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {workings.step_count} Steps
          </Badge>
          <Button onClick={handleDownload} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={viewMode === 'current' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('current')}
          >
            Current Step
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            All Steps
          </Button>
        </div>
      </div>

      {/* Step Navigation (Current Mode) */}
      {viewMode === 'current' && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Step:</span>
            {workings.steps.map((_, index) => (
              <Button
                key={index}
                variant={activeStep === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStep(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content Display */}
      {viewMode === 'current' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Step {activeStep + 1} of {workings.step_count}</span>
              {formatTimestamp(workings.steps[activeStep]) && (
                <Badge variant="secondary" className="text-xs">
                  {formatTimestamp(workings.steps[activeStep])}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
                {workings.steps[activeStep]}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workings.steps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Step {index + 1}</span>
                  {formatTimestamp(step) && (
                    <Badge variant="secondary" className="text-xs">
                      {formatTimestamp(step)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
                    {step}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Final Step Summary */}
      {workings.markdown && (
        <Card className="mt-6 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300">
              Final Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto">
                {workings.markdown}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}