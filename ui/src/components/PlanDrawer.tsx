import React, { useState, useEffect } from 'react';
import { Drawer } from './ui/drawer';
import JsonView from '@uiw/react-json-view';

interface PlanData {
  plan_id: string;
  status: string;
  original_instruction: string;
  created_at: string;
  steps: Array<{
    step_id: string;
    agent_id: string;
    instruction: string;
    estimated_duration: number;
    dependencies: string[];
    parameters: Record<string, any>;
  }>;
  summary: {
    total_steps: number;
    estimated_duration_seconds: number;
    estimated_duration_minutes: number;
    agents_involved: string[];
    complexity: string;
  };
  dag: {
    nodes: Array<{
      id: string;
      label: string;
      agent: string;
      duration: number;
      type: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
}

export function PlanDrawer({ planId, onClose }: { planId: string | null; onClose?: () => void }) {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setData(null);
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/plan/${planId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch plan: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.plan);
        } else {
          throw new Error(result.message || 'Failed to load plan');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  if (!planId) return null;

  return (
    <Drawer title="Execution Plan" isOpen={!!planId} onClose={onClose}>
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading plan...</div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="text-destructive font-medium">Error loading plan</div>
          <div className="text-sm text-muted-foreground mt-1">{error}</div>
        </div>
      )}
      
      {data && !loading && !error && (
        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Plan Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan ID:</span> {data.plan_id}
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  data.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  data.status === 'approved' ? 'bg-green-100 text-green-800' :
                  data.status === 'executing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {data.status}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Steps:</span> {data.summary.total_steps}
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Duration:</span> {data.summary.estimated_duration_minutes.toFixed(1)} minutes
              </div>
              <div>
                <span className="text-muted-foreground">Complexity:</span> {data.summary.complexity}
              </div>
              <div>
                <span className="text-muted-foreground">Agents:</span> {data.summary.agents_involved.join(', ')}
              </div>
            </div>
          </div>

          {/* Original Instruction */}
          <div>
            <h3 className="font-semibold mb-2">Original Instruction</h3>
            <div className="bg-muted/30 p-3 rounded border-l-4 border-primary">
              {data.original_instruction}
            </div>
          </div>

          {/* Execution Steps */}
          <div>
            <h3 className="font-semibold mb-2">Execution Steps</h3>
            <div className="space-y-3">
              {data.steps.map((step, index) => (
                <div key={step.step_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{step.agent_id}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">{step.estimated_duration}s</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{step.step_id}</span>
                  </div>
                  <div className="text-sm mb-2">{step.instruction}</div>
                  {step.dependencies.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Dependencies: {step.dependencies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Full Plan Data */}
          <details className="group">
            <summary className="cursor-pointer font-semibold mb-2 group-open:mb-4">
              Full Plan Data (JSON)
            </summary>
            <div className="border rounded-lg overflow-hidden">
              <JsonView 
                value={data} 
                collapsed={2}
                style={{
                  backgroundColor: 'transparent',
                  fontSize: '12px'
                }}
              />
            </div>
          </details>
        </div>
      )}
    </Drawer>
  );
}