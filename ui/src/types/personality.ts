export interface PersonalityProfile {
  profile_id: string;
  name: string;
  tone: string;
  decision_style: string;
  communication_style: string;
  max_temperature: number;
}

export interface PersonalityTraits {
  risk_tolerance: string;
  time_horizon: string;
  analytical_approach: string;
  creativity_level: string;
  leadership_style: string;
}

export interface PersonalityBehavior {
  typical_phrases: string[];
  decision_criteria: string[];
  communication_preferences: string[];
  problem_solving_approach: string[];
}

export interface FullPersonalityProfile extends PersonalityProfile {
  traits: PersonalityTraits;
  behavior: PersonalityBehavior;
  description: string;
  examples: string[];
}