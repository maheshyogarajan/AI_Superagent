export interface Envelope {
  sender: string;
  recipient: string;
  timestamp: string;        // ISO‑8601 UTC
  task_id: string;
  parent_task_id?: string;
  scenario_id?: string;
  instruction: string;
  parameters: { temperature: number; max_tokens: number };
  context?: Record<string, unknown>;
  simulation_spec?: Record<string, unknown>;
  risk_profile?: Record<string, number>;
  progress_updates?: { at: string; percent_complete: number; status: string }[];
  result?: { status: string; data_output_ref?: string };
  quality_score?: { self: number; coordinator?: number };
  signature: string;
}

export interface ProgressUpdate {
  at: string;
  percent_complete: number;
  status: string;
}

export interface TaskResult {
  status: string;
  data_output_ref?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface QualityScore {
  self?: number;
  coordinator?: number;
}

export interface SimulationSpec {
  players: string[];
  strategies: Record<string, string[]>;
  solution_concept?: string;
}

export interface RiskProfile {
  regulatory?: number;
  competitive?: number;
  tech?: number;
}