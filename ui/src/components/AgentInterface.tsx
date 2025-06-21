import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Settings, RefreshCw } from 'lucide-react';
import { api, type SystemStatus } from '@/lib/api';
import { PersonalitySelector } from '@/components/PersonalitySelector';
import { TaskSubmission } from '@/components/TaskSubmission';

export function AgentInterface() {
  const [selectedPersonality, setSelectedPersonality] = useState<string>('SteveJobs');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getSystemStatus();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskSubmitted = (taskId: string) => {
    setRecentTasks(prev => [taskId, ...prev.slice(0, 4)]); // Keep last 5 tasks
    fetchSystemStatus(); // Refresh status after task submission
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            AI Super Agent
          </h1>
          <p className="text-muted-foreground text-lg">
            Modular agent system with configurable personality profiles
          </p>
        </div>

        {/* System Status */}
        {systemStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Status
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSystemStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Overall Status</p>
                  <p className={`text-sm ${systemStatus.status === 'running' ? 'text-green-600' : 'text-red-600'}`}>
                    {systemStatus.status.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Active Agents</p>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus.agents.join(', ')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Queue Status</p>
                  <p className="text-sm text-muted-foreground">
                    C: {systemStatus.queues.coordinator}, R: {systemStatus.queues.research}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Redis Status</p>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus.redis.status.includes('error') ? 'Memory Fallback' : 'Connected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
              <CardDescription>
                Last {recentTasks.length} submitted tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentTasks.map((taskId, index) => (
                  <div key={taskId} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">#{index + 1}</span>
                    <code className="flex-1 text-xs">{taskId}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personality Selection */}
        <PersonalitySelector 
          selectedPersonality={selectedPersonality}
          onPersonalityChange={setSelectedPersonality}
        />

        {/* Task Submission */}
        <TaskSubmission 
          selectedPersonality={selectedPersonality}
          onTaskSubmitted={handleTaskSubmitted}
        />
      </div>
    </div>
  );
}