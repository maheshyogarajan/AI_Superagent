import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Brain, Zap, Users, Settings } from 'lucide-react';

interface Personality {
  id: string;
  name: string;
}

interface TaskSubmission {
  instruction: string;
  personality_id: string;
  context?: Record<string, any>;
  parameters?: Record<string, any>;
}

interface SystemStatus {
  status: string;
  agents: string[];
  queues: Record<string, number>;
  redis: {
    status: string;
    url: string;
  };
}

export function AgentInterface() {
  const [personalities, setPersonalities] = useState<Record<string, string>>({});
  const [selectedPersonality, setSelectedPersonality] = useState<string>('Default');
  const [instruction, setInstruction] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalities();
    fetchSystemStatus();
  }, []);

  const fetchPersonalities = async () => {
    try {
      const response = await fetch('/api/personalities');
      const data = await response.json();
      if (data.status === 'success') {
        setPersonalities(data.personalities);
      }
    } catch (error) {
      console.error('Failed to fetch personalities:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const submitTask = async () => {
    if (!instruction.trim()) return;

    setIsSubmitting(true);
    try {
      const taskData: TaskSubmission = {
        instruction: instruction.trim(),
        personality_id: selectedPersonality,
        context: {
          timestamp: new Date().toISOString(),
          interface: 'react_frontend'
        },
        parameters: {
          temperature: 0.8,
          max_tokens: 2000
        }
      };

      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();
      if (result.status === 'success') {
        setLastTaskId(result.task_id);
        setInstruction('');
        fetchSystemStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPersonalityDescription = (personalityId: string): string => {
    const descriptions: Record<string, string> = {
      'SteveJobs': 'Visionary product design with relentless attention to detail',
      'WarrenBuffett': 'Long-term value investing with fundamental analysis',
      'RorySutherland': 'Behavioral psychology meets creative advertising insights',
      'BillGates': 'Systematic problem-solving with technology and philanthropy',
      'ElonMusk': 'First-principles thinking for breakthrough innovation',
      'Default': 'Balanced approach with professional expertise'
    };
    return descriptions[personalityId] || 'Professional AI assistance';
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
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Coordinator: {systemStatus.queues.coordinator}, Research: {systemStatus.queues.research}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Submission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Submit Task
            </CardTitle>
            <CardDescription>
              Describe what you need the AI agents to accomplish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent Personality</label>
              <select
                value={selectedPersonality}
                onChange={(e) => setSelectedPersonality(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                {Object.entries(personalities).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {getPersonalityDescription(selectedPersonality)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Task Instruction</label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe the task you want the AI agents to perform..."
                className="w-full min-h-[120px] p-3 border border-input rounded-md bg-background resize-none"
              />
            </div>

            <Button
              onClick={submitTask}
              disabled={!instruction.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
            </Button>

            {lastTaskId && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Task submitted:</span> {lastTaskId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personality Profiles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Personalities
            </CardTitle>
            <CardDescription>
              Each personality brings unique thinking styles and decision-making approaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(personalities).map(([id, name]) => (
                <div
                  key={id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPersonality === id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPersonality(id)}
                >
                  <h3 className="font-medium">{name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getPersonalityDescription(id)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}