export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// Import shared types
import type { Envelope, SimulationSpec, RiskProfile } from '@/types/mcp';
import type { PersonalityProfile } from '@/types/personality';

// API response types
export interface PersonalitiesResponse {
  status: string;
  personalities: Record<string, string>;
  count: number;
}

export interface SystemStatus {
  status: string;
  message: string;
  queues: {
    coordinator: number;
    research: number;
  };
  agents: string[];
  redis: {
    status: string;
    url: string;
  };
}

export interface TaskSubmission {
  instruction: string;
  personality_id?: string;
  context?: Record<string, unknown>;
  parameters?: {
    temperature?: number;
    max_tokens?: number;
  };
  simulation_spec?: SimulationSpec;
  risk_profile?: RiskProfile;
}

export interface TaskResponse {
  status: string;
  message: string;
  task_id: string;
  envelope_id: string;
  recipient: string;
}

// API client functions
export const api = {
  async getPersonalities(): Promise<PersonalitiesResponse> {
    return request<PersonalitiesResponse>('/personalities');
  },

  async getSystemStatus(): Promise<SystemStatus> {
    return request<SystemStatus>('/status');
  },

  async submitTask(task: TaskSubmission): Promise<TaskResponse> {
    return request<TaskResponse>('/task', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>('/health');
  },
};