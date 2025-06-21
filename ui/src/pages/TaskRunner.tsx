import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw, Terminal, Send } from "lucide-react";

export default function TaskRunner() {
  const [instruction, setInstruction] = useState("");
  const [agent, setAgent] = useState("coordinator");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [taskResult, setTaskResult] = useState<any>(null);

  async function handleSubmit() {
    if (!instruction.trim()) return;
    
    setIsRunning(true);
    setLogs([]);
    setTaskResult(null);
    
    try {
      // Submit task to backend
      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          instruction: instruction.trim(),
          recipient: agent,
          context: {}
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit task: ${response.statusText}`);
      }
      
      const result = await response.json();
      setTaskId(result.task_id || result.id);
      setLogs(prev => [...prev, `Task submitted: ${result.task_id || result.id}`]);
      setLogs(prev => [...prev, `Status: ${result.status}`]);
      
      if (result.message) {
        setLogs(prev => [...prev, `Message: ${result.message}`]);
      }
      
      setTaskResult(result);
      
    } catch (error) {
      setLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  }

  function handleStop() {
    setIsRunning(false);
    setLogs(prev => [...prev, "Task execution stopped by user"]);
  }

  function handleClear() {
    setLogs([]);
    setTaskResult(null);
    setTaskId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Task Runner</h1>
        <p className="text-muted-foreground">
          Execute tasks and monitor real-time progress across agents
        </p>
      </div>

      {/* Task Submission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Task Submission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instruction Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Task Instruction:
            </label>
            <textarea
              placeholder="e.g. 'Compare GST regimes in AU vs NZ' or 'Analyze market trends for Q4'"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRunning}
            />
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Agent:
            </label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              disabled={isRunning}
              className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="coordinator">Coordinator Agent</option>
              <option value="research">Research Agent</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!instruction.trim() || isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Task
                </>
              )}
            </Button>
            
            {isRunning && (
              <Button 
                variant="outline" 
                onClick={handleStop}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
            
            {logs.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={isRunning}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Status */}
      {taskId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Task Status
              </span>
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? "Running" : "Completed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Task ID:</strong> {taskId}
              </p>
              <p className="text-sm">
                <strong>Agent:</strong> {agent}
              </p>
              {taskResult && (
                <p className="text-sm">
                  <strong>Status:</strong> {taskResult.status}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Execution Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-md p-4 font-mono text-sm text-green-400 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                  {" "}
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Processing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results and Next Actions */}
      {taskResult && !isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Task Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskResult.status === "success" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-green-800 dark:text-green-200">
                  ✓ Task completed successfully
                </p>
                {taskResult.message && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {taskResult.message}
                  </p>
                )}
              </div>
            )}
            
            {taskResult.status === "error" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-800 dark:text-red-200">
                  ✗ Task failed
                </p>
                {taskResult.message && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {taskResult.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.open('/strategy', '_blank')}>
                View Strategy Documents ↗
              </Button>
              <Button variant="outline" onClick={() => window.open('/logs', '_blank')}>
                View System Logs ↗
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Task Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Research the latest AI developments in 2024",
              "Compare market strategies for tech startups",
              "Analyze competitive landscape for SaaS products",
              "Generate strategic recommendations for Q1 2025"
            ].map((example, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left justify-start h-auto p-3"
                onClick={() => setInstruction(example)}
                disabled={isRunning}
              >
                <div className="text-sm">{example}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}