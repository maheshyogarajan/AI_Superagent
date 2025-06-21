// Re-export all types for easier imports
export * from './mcp';
export * from './personality';

// Additional frontend-specific types
export interface AppState {
  selectedPersonality: string;
  recentTasks: string[];
  systemStatus: 'connected' | 'disconnected' | 'error';
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'system';
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface EnvelopeDisplayData {
  taskId: string;
  personalityUsed: string;
  submittedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}