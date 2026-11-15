// Shared domain types for Cortex. Pure TypeScript — no DOM, no React.

export type AgeRange = 'under-18' | '18-24' | '25-34' | '35+';
export type Stage = 'high-school' | 'college' | 'recent-grad' | 'professional';

export type Domain =
  | 'coding'
  | 'writing'
  | 'career'
  | 'analysis'
  | 'planning'
  | 'creative'
  | 'learning';

export interface Profile {
  name?: string;
  ageRange?: AgeRange;
  stage?: Stage;
  field?: string; // field of study or profession, free text
  careerDirection?: string; // one of CAREER_DIRECTIONS or free text
  ambitions?: string;
  aiUses: string[];
  skills: string[];
  onboarded: boolean;
}

export interface Classification {
  kind: 'routine' | 'meaningful';
  domain?: Domain;
  /** 0..1 — how sure the rules are. Describes the classifier, never the user. */
  confidence: number;
  /** Human-readable explanation of what the rules noticed. */
  reasons: string[];
  /** True when the task connects to the user's stated career direction. */
  careerRelevant: boolean;
}

export interface Intervention {
  domain: Domain;
  /** The single question Cortex asks. */
  question: string;
  /** Short line explaining why this moment matters, tied to profile when possible. */
  why: string;
  placeholder: string;
  /** Optional sentence starters (not answers, not choices). */
  starters: string[];
}

export type Provenance = 'you' | 'cortex';

export interface ThoughtItem {
  text: string;
  source: Provenance;
}

export interface StructuredThought {
  goal: ThoughtItem; // derived from the user's own request
  ideas: ThoughtItem[]; // proposed structure / components / points
  approach: ThoughtItem[]; // methods, tools, first steps
  constraints: ThoughtItem[]; // deadlines, must-haves, limits
  openDecisions: ThoughtItem[]; // uncertainties turned into decisions
  suggestions: ThoughtItem[]; // always source: 'cortex'
}

export interface Activity {
  interventions: number;
  contributed: number;
  skipped: number;
  passedThrough: number;
}
