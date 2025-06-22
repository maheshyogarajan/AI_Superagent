import React from 'react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PlanStep {
  step_id: string;
  agent_id: string;
  instruction: string;
  dependencies: string[];
  estimated_duration: number;
  complexity?: number;
  parameters?: Record<string, any>;
}

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface EditableStepProps {
  node: PlanStep;
  agentOptions: Agent[];
  onChange: (stepId: string, field: string, value: any) => void;
}

export function EditableStep({ node, agentOptions, onChange }: EditableStepProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-2 py-1 rounded border text-xs font-medium">{node.step_id}</div>
          <Select
            value={node.agent_id}
            onValueChange={(value) => onChange(node.step_id, 'agent_id', value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agentOptions.map((agent) => (
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
          <span>{node.estimated_duration}s</span>
          {node.dependencies.length > 0 && (
            <div className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
              Depends: {node.dependencies.join(', ')}
            </div>
          )}
        </div>
      </div>
      
      <Textarea
        defaultValue={node.instruction}
        onBlur={(e) => onChange(node.step_id, 'instruction', e.target.value)}
        className="min-h-[80px]"
        placeholder="Step description..."
      />
    </div>
  );
}