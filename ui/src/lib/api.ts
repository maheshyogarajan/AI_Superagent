export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// Type definitions for API responses
export interface Personality {
  [key: string]: string;
}

export interface PersonalitiesResponse {
  status: string;
  personalities: Personality;
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
  context?: Record<string, any>;
  parameters?: {
    temperature?: number;
    max_tokens?: number;
  };
  simulation_spec?: {
    players: string[];
    strategies: Record<string, string[]>;
    solution_concept?: string;
  };
  risk_profile?: {
    regulatory?: number;
    competitive?: number;
    tech?: number;
  };
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