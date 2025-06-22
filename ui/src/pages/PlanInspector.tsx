import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Eye, Play, Edit, Save, X } from 'lucide-react';

interface PlanStep {
  step_id: string;
  agent_id: string;
  instruction: string;
  dependencies: string[];
  estimated_duration: number;
  complexity?: number;
  parameters?: Record<string, any>;
}

interface Plan {
  plan_id: string;
  outline: PlanStep[];
  status: string;
  created_at: string;
}

const AVAILABLE_AGENTS = [
  { id: 'coordinator', name: 'Coordinator', description: 'Task routing and orchestration' },
  { id: 'research', name: 'Research Agent', description: 'Analysis and investigation' },
  { id: 'creative', name: 'Creative Agent', description: 'Brainstorming and innovation' },
  { id: 'planner', name: 'Strategic Planner', description: 'Planning and strategy' }
];

export function PlanInspector() {
  const [instruction, setInstruction] = useState('');
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editingSteps, setEditingSteps] = useState<Set<string>>(new Set());

  const handleGeneratePlan = async () => {
    if (!instruction.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });

      const result = await response.json();
      if (result.status === 'success' && result.plan) {
        setCurrentPlan({
          plan_id: result.plan.plan_id,
          outline: result.plan.steps || [],
          status: result.plan.status || 'draft',
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateNodeAgent = async (stepIndex: number, newAgentId: string) => {
    if (!currentPlan) return;

    const updatedOutline = [...currentPlan.outline];
    updatedOutline[stepIndex] = {
      ...updatedOutline[stepIndex],
      agent_id: newAgentId
    };

    // Update plan in database
    try {
      await fetch(`/plans/${currentPlan.plan_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: updatedOutline })
      });

      setCurrentPlan({
        ...currentPlan,
        outline: updatedOutline
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const updateNodeDesc = async (stepIndex: number, newDescription: string) => {
    if (!currentPlan) return;

    const updatedOutline = [...currentPlan.outline];
    updatedOutline[stepIndex] = {
      ...updatedOutline[stepIndex],
      instruction: newDescription
    };

    // Update plan in database
    try {
      await fetch(`/plans/${currentPlan.plan_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: updatedOutline })
      });

      setCurrentPlan({
        ...currentPlan,
        outline: updatedOutline
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleApprovePlan = async () => {
    if (!currentPlan) return;

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/plans/${currentPlan.plan_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.status === 'success') {
        setCurrentPlan({
          ...currentPlan,
          status: 'approved'
        });
      }
    } catch (error) {
      console.error('Error approving plan:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearPlan = () => {
    setCurrentPlan(null);
    setInstruction('');
    setEditingSteps(new Set());
  };

  const getAgentBadgeColor = (agentId: string) => {
    const colors = {
      coordinator: 'bg-blue-100 text-blue-800',
      research: 'bg-green-100 text-green-800',
      creative: 'bg-purple-100 text-purple-800',
      planner: 'bg-orange-100 text-orange-800'
    };
    return colors[agentId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Plan Inspector</h1>
        {currentPlan && (
          <Badge variant="outline" className={getAgentBadgeColor(currentPlan.status)}>
            {currentPlan.status.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Create Execution Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Task Instruction
              </label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Enter your task instruction to generate an execution plan..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleGeneratePlan}
                disabled={!instruction.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
              
              {currentPlan && (
                <Button onClick={clearPlan} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Summary */}
        {currentPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Plan ID:</span>
                  <div className="font-mono text-xs text-gray-600 break-all">
                    {currentPlan.plan_id}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Steps:</span>
                  <div>{currentPlan.outline.length}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={getAgentBadgeColor(currentPlan.status)}>
                    {currentPlan.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Estimated Duration:</span>
                  <div>
                    {Math.round(currentPlan.outline.reduce((acc, step) => acc + step.estimated_duration, 0) / 60)}m
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <Button 
                  onClick={handleApprovePlan}
                  disabled={isExecuting || currentPlan.status !== 'draft'}
                  className="w-full"
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Approve & Execute
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Execution Steps */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPlan.outline.map((step, index) => (
                <div 
                  key={step.step_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{step.step_id}</Badge>
                      <Select
                        value={step.agent_id}
                        onValueChange={(value) => updateNodeAgent(index, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_AGENTS.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{agent.name}</span>
                                <span className="text-xs text-gray-500">{agent.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{step.estimated_duration}s</span>
                      {step.dependencies.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Depends: {step.dependencies.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Textarea
                    defaultValue={step.instruction}
                    onBlur={(e) => updateNodeDesc(index, e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Step description..."
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}