import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, User, ArrowLeft, Download, Eye } from "lucide-react";

interface TaskWorking {
  task_id: string;
  agent: string;
  instruction: string;
  status: string;
  created_at: string;
  completed_at?: string;
  progress: number;
  steps: WorkingStep[];
  result?: TaskResult;
}

interface WorkingStep {
  step_id: string;
  timestamp: string;
  action: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  duration?: number;
}

interface TaskResult {
  summary: string;
  key_findings: string[];
  recommendations: string[];
  data_sources: string[];
  confidence_score: number;
}

export default function WorkingsViewer() {
  const { taskId } = useParams<{ taskId: string }>();
  const [working, setWorking] = useState<TaskWorking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTaskWorkings(taskId);
    }
  }, [taskId]);

  async function fetchTaskWorkings(id: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${id}/workings`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task workings: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWorking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "running": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  function getStepIcon(status: string) {
    switch (status) {
      case "completed": return "✓";
      case "running": return "⟳";
      case "error": return "✗";
      default: return "○";
    }
  }

  function formatDuration(duration?: number) {
    if (!duration) return "";
    if (duration < 60) return `${duration}s`;
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Task Workings</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600">Error loading task workings</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => taskId && fetchTaskWorkings(taskId)}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!working) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Task Workings</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Task not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Task Workings</h1>
            <p className="text-muted-foreground">Detailed execution trace for task {working.task_id}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Raw Data
          </Button>
        </div>
      </div>

      {/* Task Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Overview
            </span>
            <Badge className={getStatusColor(working.status)}>
              {working.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Instruction</p>
              <p className="mt-1">{working.instruction}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agent</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                {working.agent}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                {new Date(working.created_at).toLocaleString()}
              </div>
            </div>
            {working.completed_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {new Date(working.completed_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{working.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${working.progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {working.steps.map((step, index) => (
              <div key={step.step_id} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getStatusColor(step.status)}`}>
                    {getStepIcon(step.status)}
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.action}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {step.duration && (
                        <span>{formatDuration(step.duration)}</span>
                      )}
                      <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {step.output && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm font-mono">
                      {step.output}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {working.result && (
        <Card>
          <CardHeader>
            <CardTitle>Task Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm">{working.result.summary}</p>
            </div>
            
            {working.result.key_findings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Key Findings</h4>
                <ul className="list-disc list-inside space-y-1">
                  {working.result.key_findings.map((finding, index) => (
                    <li key={index} className="text-sm">{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {working.result.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {working.result.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <span className="text-sm font-medium">Confidence Score: </span>
                <Badge variant="outline">
                  {Math.round(working.result.confidence_score * 100)}%
                </Badge>
              </div>
              
              {working.result.data_sources.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {working.result.data_sources.length} data sources used
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}