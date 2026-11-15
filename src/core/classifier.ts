// Stage A — task classification (FR-1..FR-6).
// A deterministic, explainable rules engine behind a `Classifier` interface so a
// model-assisted classifier can be swapped in or layered on later (FR-5).
// It never scores the *quality* of a prompt (FR-6) — only what kind of task it is.

import { CAREER_FOCUS, careerTrack } from './profile';
import type { Classification, Domain, Profile } from './types';

export interface Classifier {
  classify(text: string, profile?: Profile): Classification;
}

interface Rule {
  re: RegExp;
  weight: number;
  reason: string;
}

const UNITS =
  'miles?|mi|km|kilomet(?:er|re)s?|meters?|metres?|m|cm|mm|feet|foot|ft|inch(?:es)?|in|yards?|pounds?|lbs?|kg|kilograms?|grams?|g|oz|ounces?|cups?|liters?|litres?|gallons?|ml|celsius|fahrenheit|°[cf]?|usd|eur|gbp|dollars?|euros?|hours?|minutes?|seconds?|days?|weeks?|mph|kph';

const ROUTINE_RULES: Rule[] = [
  { re: new RegExp(`\\bconvert\\b[^.?!]*\\d`, 'i'), weight: 4, reason: 'Unit or value conversion' },
  { re: new RegExp(`\\d+(?:\\.\\d+)?\\s*(?:${UNITS})\\b[^.?!]*\\b(?:to|in|into)\\b`, 'i'), weight: 4, reason: 'Unit or value conversion' },
  {
    re: /^\s*(?:what(?:'s| is)\s+)?[\d\s.,+\-*/x×÷^%()]+(?:of\s+[\d.,]+)?\s*[?=]?\s*$/i,
    weight: 4,
    reason: 'Quick arithmetic',
  },
  {
    re: /^\s*(?:what|who|when|where|which)(?:'s|\s+is|\s+was|\s+are|\s+were|\s+did)\s+(?:the\s+)?(?:capital|population|president|prime minister|ceo|founder|date|year|height|distance|currency|time zone|time|weather|area|author|largest|smallest|tallest|longest|biggest|first|boiling|melting|speed|address|phone)/i,
    weight: 4,
    reason: 'Factual lookup',
  },
  { re: /^\s*(?:define|definition of|meaning of|synonyms? for|antonyms? for|how do you spell|spell)\b/i, weight: 4, reason: 'Definition or spelling lookup' },
  { re: /^\s*what does\s+["']?[\w\s-]{1,30}["']?\s+mean\s*\??\s*$/i, weight: 4, reason: 'Definition lookup' },
  { re: /^\s*how (?:many|much|far|long|old|tall|big)\b/i, weight: 3, reason: 'Factual quantity lookup' },
  { re: /^\s*(?:hi|hello|hey|thanks|thank you|ok|okay|good (?:morning|night|evening))\b[\s!.?]*$/i, weight: 4, reason: 'Greeting or acknowledgement' },
  { re: /^\s*translate\b/i, weight: 2.5, reason: 'Translation' },
  { re: /^\s*(?:who|when|where)\s+(?:is|was|did|were)\b/i, weight: 2, reason: 'Factual lookup' },
];

const DELEGATION = /\b(write|complete|do|finish|solve|build|create|make|design|develop|draft|generate|code|implement|plan|analy[sz]e|debug|fix|outline|compose|prepare|come up with|brainstorm|figure out|decide|choose|structure|organi[sz]e|refactor|architect|research|rewrite|prove)\b/i;
const OWN_WORK =
  /\b(?:my|our|this|the|a)\s+(?:[\w-]+\s+){0,2}?(assignment|homework|essay|project|paper|code|codebase|program|app|application|website|site|thesis|report|presentation|cover letter|resume|résumé|cv|portfolio|dataset|data set|data|startup|business plan|business|lab report|problem set|pset|proposal|research|capstone|pitch|speech|personal statement|interview|strategy|function|script|query|study plan|plan|final|exam|midterm|notes|outline|integral|equation|proof|derivation|problem|case study)\b/i;
const HELP_ME = /\b(?:help me|can you|could you|i need (?:you )?to|i have to|i want to|i'm trying to|how (?:do|should|would) i)\b/i;
const DECISION = /\b(?:should i|which is better|best way to|how should i approach|pros and cons|tradeoffs?|trade-offs?|whether (?:i|to)|what would you recommend)\b/i;

const DOMAIN_KEYWORDS: Record<Domain, [RegExp, number][]> = {
  coding: [
    [/\b(?:code|coding|program(?:ming)?|function|bug|debug|react|python|java(?:script)?|typescript|api|algorithm|script|sql|compile|frontend|backend|full[- ]stack|leetcode|repo|database|website|web ?app|app|css|html|component|class|recursion)\b/i, 1],
  ],
  writing: [
    [/\b(?:essay|paper|article|blog|thesis|paragraph|argument|report|speech|op-ed|email|letter|draft|write|writing)\b/i, 1],
  ],
  career: [
    [/\b(?:cover letter|resume|résumé|cv|internship|job application|interview|linkedin|personal statement|recruiter|offer letter|salary|networking)\b/i, 2],
    [/\b(?:portfolio|career|job|hiring)\b/i, 1],
  ],
  analysis: [
    [/\b(?:analy[sz]e|analysis|dataset|data set|data|statistics?|regression|chart|trends?|insights?|survey|excel|spreadsheet|correlation|hypothes[ie]s|metrics|experiment results)\b/i, 1],
  ],
  planning: [
    [/\b(?:plan|schedule|strategy|decide|decision|roadmap|prioriti[sz]e|budget|launch|timeline|goals?|should i)\b/i, 1],
  ],
  creative: [
    [/\b(?:brainstorm|ideas?|name for|story|poem|haiku|lyrics|logo|slogan|creative|concept|novel|script for)\b/i, 1],
  ],
  learning: [
    [/\b(?:homework|exam|study|studying|problem set|pset|lecture|midterm|final|prove|derive|understand|learn|integral|derivative|equation|theorem|proof)\b/i, 1],
  ],
};

const DOMAIN_LABEL: Record<Domain, string> = {
  coding: 'Coding task',
  writing: 'Writing task',
  career: 'Career-building task',
  analysis: 'Analytical task',
  planning: 'Planning or decision task',
  creative: 'Creative task',
  learning: 'Learning task',
};

const TIE_ORDER: Domain[] = ['career', 'coding', 'analysis', 'writing', 'planning', 'learning', 'creative'];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function detectDomain(text: string, profile?: Profile): { domain: Domain; scores: Record<Domain, number> } {
  const scores = {} as Record<Domain, number>;
  for (const d of Object.keys(DOMAIN_KEYWORDS) as Domain[]) {
    scores[d] = DOMAIN_KEYWORDS[d].reduce((sum, [re, w]) => sum + (re.test(text) ? w : 0), 0);
  }
  const max = Math.max(...Object.values(scores));
  const tied = (Object.keys(scores) as Domain[]).filter((d) => scores[d] === max);
  const track = profile ? careerTrack(profile) : undefined;
  const preferred = track ? CAREER_FOCUS[track].domains : [];
  const domain =
    max === 0
      ? 'planning'
      : tied.find((d) => preferred.includes(d)) ?? TIE_ORDER.find((d) => tied.includes(d)) ?? tied[0];
  return { domain, scores };
}

export const rulesClassifier: Classifier = {
  classify(rawText: string, profile?: Profile): Classification {
    const text = rawText.trim();
    const reasons: string[] = [];
    let routine = 0;
    let meaningful = 0;

    for (const rule of ROUTINE_RULES) {
      if (rule.re.test(text)) {
        routine += rule.weight;
        if (!reasons.includes(rule.reason)) reasons.push(rule.reason);
      }
    }

    const words = wordCount(text);
    const verb = text.match(DELEGATION)?.[1];
    const own = text.match(OWN_WORK);
    if (verb) {
      meaningful += 1.5;
      reasons.push(`Asks AI to "${verb.toLowerCase()}" something`);
    }
    if (own) {
      meaningful += 2;
      reasons.push(`Involves substantial work ("${own[1].toLowerCase()}")`);
    }
    if (HELP_ME.test(text)) meaningful += 1;
    if (DECISION.test(text)) {
      meaningful += 2;
      reasons.push('Involves a judgment call');
    }
    if (words > 25) meaningful += 1;

    const { domain, scores } = detectDomain(text, profile);
    meaningful += Math.min(scores[domain], 3);

    if (words <= 3 && !own) routine += 2;

    const isMeaningful = meaningful >= 3 && meaningful > routine;
    const margin = Math.abs(meaningful - routine);
    const confidence = Math.round(Math.min(0.99, 0.55 + margin / 12) * 100) / 100;

    if (!isMeaningful) {
      if (reasons.length === 0 || routine === 0) reasons.splice(0, reasons.length, 'Quick request — no deep thinking at stake');
      return { kind: 'routine', confidence, reasons: reasons.filter((r) => !r.startsWith('Asks AI') && !r.startsWith('Involves')).concat(), careerRelevant: false };
    }

    const track = profile ? careerTrack(profile) : undefined;
    const careerRelevant = domain === 'career' || scores.career > 0 || (!!track && CAREER_FOCUS[track].domains.includes(domain));
    reasons.unshift(DOMAIN_LABEL[domain]);
    if (careerRelevant && track) reasons.push(`Connects to your direction in ${CAREER_FOCUS[track].label}`);

    return { kind: 'meaningful', domain, confidence, reasons, careerRelevant };
  },
};

export const classify = (text: string, profile?: Profile) => rulesClassifier.classify(text, profile);
