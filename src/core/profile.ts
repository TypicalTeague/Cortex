import type { AgeRange, Domain, Profile, Stage } from './types';

export const DEFAULT_PROFILE: Profile = { aiUses: [], skills: [], onboarded: false };

export const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: 'under-18', label: 'Under 18' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35+', label: '35+' },
];

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'high-school', label: 'High school' },
  { value: 'college', label: 'College' },
  { value: 'recent-grad', label: 'Recent graduate' },
  { value: 'professional', label: 'Working professional' },
];

export const CAREER_DIRECTIONS = [
  'Software engineering',
  'Data & analytics',
  'Business & product',
  'Writing & communications',
  'Design',
  'Research & science',
  'Healthcare',
  'Still exploring',
] as const;

export const AI_USES = ['Coding', 'Writing', 'Research', 'Studying', 'Job applications', 'Data work', 'Planning', 'Brainstorming'];

export const SKILLS = [
  'Problem decomposition',
  'Debugging',
  'System design',
  'Original writing',
  'Building arguments',
  'Interpreting data',
  'Forming hypotheses',
  'Decision-making',
  'Planning',
  'Creative ideas',
  'Telling my story',
];

/** Focus areas per career track — the thinking skills Cortex leans on (spec §3). */
export const CAREER_FOCUS: Record<string, { label: string; focus: string[]; domains: Domain[] }> = {
  software: { label: 'software engineering', focus: ['architecture', 'debugging', 'logic', 'decomposition'], domains: ['coding'] },
  data: { label: 'data analysis', focus: ['hypothesis formation', 'interpreting evidence', 'drawing conclusions'], domains: ['analysis'] },
  business: { label: 'business', focus: ['decision-making', 'planning', 'evaluating tradeoffs'], domains: ['planning', 'analysis'] },
  writing: { label: 'writing', focus: ['originality', 'argument development', 'communication'], domains: ['writing', 'creative'] },
  design: { label: 'design', focus: ['user needs', 'visual hierarchy', 'iteration'], domains: ['creative', 'coding'] },
  research: { label: 'research', focus: ['framing questions', 'evaluating evidence', 'method choice'], domains: ['analysis', 'learning'] },
  healthcare: { label: 'healthcare', focus: ['clinical reasoning', 'evidence', 'communication'], domains: ['learning', 'analysis'] },
};

/** Map free-text career direction or field to a known track key. */
export function careerTrack(profile: Pick<Profile, 'careerDirection' | 'field'>): string | undefined {
  const text = `${profile.careerDirection ?? ''} ${profile.field ?? ''}`.toLowerCase();
  if (!text.trim()) return undefined;
  const rules: [string, RegExp][] = [
    ['software', /software|computer|engineer|developer|programm|cs\b|web dev|coding/],
    ['data', /data|analytic|statistic|machine learning|\bml\b|\bai\b/],
    ['business', /business|product|finance|consult|marketing|management|econ|entrepreneur/],
    ['writing', /writ|journal|communication|english|media|content/],
    ['design', /design|ux|ui\b|art/],
    ['research', /research|science|biology|chemistry|physics|neuro|psych/],
    ['healthcare', /health|medic|nurs|pre-med|premed|pharma/],
  ];
  return rules.find(([, re]) => re.test(text))?.[0];
}

export function isMinor(profile: Pick<Profile, 'ageRange'>): boolean {
  return profile.ageRange === 'under-18';
}

/** Strip fields we should not keep for minors (FR-18). */
export function sanitizeProfile(profile: Profile): Profile {
  if (!isMinor(profile)) return profile;
  const { name: _n, ambitions: _a, ...rest } = profile;
  return rest;
}
