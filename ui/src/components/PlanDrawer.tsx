import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Play, Clock, Users } from 'lucide-react';
import JsonView from '@uiw/react-json-view';

interface PlanDrawerProps {
  planId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlanDrawer({ planId, isOpen, onClose }: PlanDrawerProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const { data, error, isLoading, mutate } = useSWR(
    planId ? `/api/plan/${planId}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }
      return response.json();
    }
  );

  const handleApprovePlan = async () => {
    if (!planId) return;
    
    setIsApproving(true);
    setActionMessage('');
    
    try {
      const response = await fetch(`/api/plan/${planId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setActionMessage('Plan approved successfully');
        mutate(); // Refresh plan data
      } else {
        setActionMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setActionMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!planId) return;
    
    setIsExecuting(true);
    setActionMessage('');
    
    try {
      const response = await fetch(`/api/plan/${planId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setActionMessage(`Execution started: ${result.task_id}`);
        mutate(); // Refresh plan data
      } else {
        setActionMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setActionMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'secondary';
      case 'approved': return 'default';
      case 'executing': return 'outline';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execution Plan</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading plan...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">Failed to load plan</div>
            </div>
          )}
          
          {data && data.plan && (
            <div className="space-y-6">
              {/* Plan Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Plan Overview
                      <Badge variant={getStatusBadgeVariant(data.plan.status)}>
                        {data.plan.status}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Plan ID</div>
                      <div className="text-sm text-muted-foreground font-mono">{data.plan.plan_id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Task ID</div>
                      <div className="text-sm text-muted-foreground font-mono">{data.plan.task_id}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Original Instruction</div>
                    <div className="text-sm bg-muted p-3 rounded">{data.plan.original_instruction}</div>
                  </div>
                  
                  {data.plan.summary && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="text-lg font-semibold">{data.plan.summary.total_steps}</div>
                        <div className="text-sm text-muted-foreground">Total Steps</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="text-lg font-semibold">{data.plan.summary.estimated_duration_minutes}m</div>
                        <div className="text-sm text-muted-foreground">Est. Duration</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded">
                        <div className="text-lg font-semibold">{data.plan.summary.agents_involved?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Agents</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {data.plan.status === 'draft' && (
                      <Button 
                        onClick={handleApprovePlan} 
                        disabled={isApproving}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isApproving ? 'Approving...' : 'Approve Plan'}
                      </Button>
                    )}
                    
                    {data.plan.status === 'approved' && (
                      <Button 
                        onClick={handleExecutePlan} 
                        disabled={isExecuting}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isExecuting ? 'Starting...' : 'Execute Plan'}
                      </Button>
                    )}
                    
                    {data.plan.status === 'executing' && (
                      <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-blue-700">Plan is currently executing...</span>
                      </div>
                    )}
                  </div>
                  
                  {actionMessage && (
                    <div className={`p-3 rounded text-sm ${
                      actionMessage.includes('Error') 
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-green-50 border border-green-200 text-green-700'
                    }`}>
                      {actionMessage}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Execution Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Execution Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.plan.steps && data.plan.steps.length > 0 ? (
                    <div className="space-y-3">
                      {data.plan.steps.map((step: any, index: number) => (
                        <div key={step.step_id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Step {index + 1}</span>
                              <Badge variant="outline">{step.agent_id}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {step.estimated_duration}s
                              </span>
                            </div>
                            <Badge variant="secondary">{step.step_id}</Badge>
                          </div>
                          <div className="text-sm mb-2">{step.instruction}</div>
                          {step.dependencies && step.dependencies.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Dependencies: {step.dependencies.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4">
                      No execution steps available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}