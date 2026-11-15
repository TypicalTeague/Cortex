// Stage C — turn rough thoughts into progress (FR-11..FR-14).
// Deterministic by design (ADR-3): every item marked `source: 'you'` is built only from
// the user's own words (request + thought). Cortex additions are `source: 'cortex'`.

import type { Classification, Domain, StructuredThought, ThoughtItem } from './types';

const you = (text: string): ThoughtItem => ({ text, source: 'you' });
const cortex = (text: string): ThoughtItem => ({ text, source: 'cortex' });

const LEAD_FILLER =
  /^(?:and|so|also|then|but|or|plus|probably|maybe|perhaps|possibly|likely|i think|i guess|i feel like|i suppose|i'd|i’d|i would|i'll|i’ll|i will|i want to|i wanna|i'm going to|i’m going to|i'm gonna|i plan to|i'm thinking|i’m thinking|we'd|we would|we'll|let's|like|um|uh|honestly|basically|just|ideally|definitely|kind of|sort of|first(?:ly)?,?)\s+/i;
const TRAIL = /[\s,.;:!-]+$/;

const UNCERTAIN =
  /\b(?:not sure|unsure|don'?t know|do not know|no idea|wondering|confused|stuck|can'?t decide|cannot decide|haven'?t decided|idk|unclear|torn between|not certain|no clue)\b/i;
const UNCERTAIN_SPLIT =
  /(?:i'?m |i am |still )?(?:not sure|unsure|don'?t know|do not know|no idea|wondering|haven'?t decided|can'?t decide|cannot decide|not certain|no clue|unclear(?: on| about)?)\s+(?:about\s+)?(how|whether|if|which|what|where|when|who|why)\s+(.+)/i;
const CONSTRAINT =
  /\b(?:deadline|due|by (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|next week|the end of)|must|has to|have to|need to|needs to|can'?t use|cannot use|not allowed|only have|limit|under \d+|at most|no more than|word count|\d+\s*(?:words|pages|minutes|slides))\b/i;
const APPROACH =
  /\b(?:use|using|with|via|start(?:ing)? (?:with|by)|first|then|approach|method|try|go with|plan to|thinking of|leaning toward|look(?:ing)? at|compare|test|check|measure|filter|group|plot|build it|write it in|framework|library)\b/i;
const IDEA_VERB =
  /^(?:make|have|include|add|create|build|focus on|highlight|talk about|mention|cover|show|feature|want|need|split (?:it )?into|break (?:it )?into|organi[sz]e (?:it )?into)\s+(?:it\s+)?(?:into\s+)?/i;

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function fixI(s: string): string {
  return s.replace(/\bi\b/g, 'I').replace(/\bim\b/gi, 'I’m');
}

export function clean(raw: string): string {
  let s = raw.trim().replace(TRAIL, '');
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(LEAD_FILLER, '').trim();
  }
  return cap(fixI(s));
}

function stripArticle(s: string): string {
  return s.replace(/^(?:a|an|the|some|my|our)\s+/i, '').trim();
}

/** "a homepage, project section, and resume section" → ["Homepage", "Project section", "Resume section"] */
export function splitList(s: string): string[] {
  return s
    .split(/\s*,\s*(?:and\s+|or\s+)?|\s+and\s+|\s+or\s+|\s*\/\s*|\s+plus\s+/i)
    .map((x) => cap(stripArticle(x.replace(TRAIL, ''))))
    .filter((x) => x.length > 0);
}

/** Request → goal statement, using only the request's words. */
export function goalFromRequest(request: string): string {
  let s = request.trim().replace(/[?!.\s]+$/, '');
  const polite =
    /^(?:hey|hi|hello|ok|okay|please|so|chatgpt,?|can you|could you|would you|will you|i need you to|i want you to|help me(?: to)?|i need help(?: with)?|i need to|i want to|i have to|i'?m trying to|i would like to|i'd like to|please help me(?: to)?)\s+/i;
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(polite, '').trim();
  }
  s = s.replace(/\s+(?:please|for me|thanks|thank you)$/i, '');
  return cap(s);
}

function toDecision(clause: string, lastObject?: string): string {
  const m = clause.match(UNCERTAIN_SPLIT);
  if (m) {
    const word = m[1].toLowerCase() === 'if' ? 'whether' : m[1].toLowerCase();
    let rest = m[2].replace(TRAIL, '');
    if (lastObject) rest = rest.replace(/\b(them|it|those|these)$/i, `the ${lastObject}`);
    const verb = ['what', 'why', 'who'].includes(word) ? 'Figure out' : 'Decide';
    return `${verb} ${word} ${fixI(rest)}`;
  }
  const torn = clause.match(/torn between\s+(.+)/i);
  if (torn) return `Choose between ${torn[1].replace(TRAIL, '')}`;
  const stuck = clause.match(/stuck (?:on|with)\s+(.+)/i);
  if (stuck) return `Work out ${stuck[1].replace(TRAIL, '')}`;
  return clean(clause.replace(/^(?:i'?m |i am )?(?:not sure|unsure|wondering)\s*(?:about)?\s*/i, '')) || clean(clause);
}

function objectOf(approach: string): string | undefined {
  const m = approach.match(/\b(?:use|using|go with|try|with)\s+(.+)/i);
  return m ? stripArticle(m[1].replace(TRAIL, '')) : undefined;
}

function dedupe(items: ThoughtItem[]): ThoughtItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.text.toLowerCase();
    if (!i.text || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const DOMAIN_SUGGESTION: Record<Domain, string> = {
  coding: 'Ask the AI to review your structure before it writes code, so it fills gaps instead of replacing your plan.',
  writing: 'Keep your main point as the thesis — ask the AI to stress-test it, not rewrite it.',
  career: 'Add one concrete result to your example: a number, an outcome, or how someone reacted.',
  analysis: 'Before running anything, note what result would prove your hunch wrong.',
  planning: 'For each option, list what you’d give up — tradeoffs make the decision clearer.',
  creative: 'Ask for variations on your idea rather than brand-new ones.',
  learning: 'Try the first step yourself, then compare it with the AI’s explanation.',
};

export function structureThought(request: string, thought: string, classification?: Pick<Classification, 'domain'>): StructuredThought {
  const ideas: ThoughtItem[] = [];
  const approach: ThoughtItem[] = [];
  const constraints: ThoughtItem[] = [];
  const openDecisions: ThoughtItem[] = [];

  const sentences = thought
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const isQuestion = /\?\s*$/.test(sentence);
    const clauses = sentence
      .split(/,?\s+(?:but|although|though|however|yet|except)\s+|\s*—\s*|\s+-\s+/i)
      .map((c) => c.trim())
      .filter(Boolean);
    let lastObject: string | undefined;

    for (const clause of clauses) {
      if (UNCERTAIN.test(clause) || (isQuestion && clause === clauses[clauses.length - 1])) {
        openDecisions.push(you(isQuestion && !UNCERTAIN.test(clause) ? clean(clause) + '?' : toDecision(clause, lastObject)));
        continue;
      }
      if (CONSTRAINT.test(clause)) {
        constraints.push(you(clean(clause)));
        continue;
      }
      const cleaned = clean(clause);
      const afterVerb = cleaned.replace(IDEA_VERB, '');
      const hasVerb = afterVerb !== cleaned;
      const hasCommaList = /,/.test(afterVerb) && splitList(afterVerb).length >= 2;
      if (hasCommaList || (hasVerb && !APPROACH.test(cleaned) && splitList(afterVerb).length >= 2)) {
        splitList(afterVerb).forEach((x) => ideas.push(you(x)));
        continue;
      }
      if (APPROACH.test(clause)) {
        approach.push(you(cleaned));
        lastObject = objectOf(cleaned) ?? lastObject;
        continue;
      }
      ideas.push(you(hasVerb ? cap(stripArticle(afterVerb)) : cleaned));
    }
  }

  const suggestions: ThoughtItem[] = [];
  const domain = classification?.domain;
  if (domain) suggestions.push(cortex(DOMAIN_SUGGESTION[domain]));
  if (approach.length === 0 && ideas.length > 0) suggestions.push(cortex('Consider naming the very first step you’d take.'));
  else if (openDecisions.length === 0 && (ideas.length > 0 || approach.length > 0))
    suggestions.push(cortex('Is there a choice you haven’t made yet? That’s where AI input helps most.'));

  return {
    goal: you(goalFromRequest(request)),
    ideas: dedupe(ideas),
    approach: dedupe(approach),
    constraints: dedupe(constraints),
    openDecisions: dedupe(openDecisions),
    suggestions,
  };
}

export function hasUserContent(s: StructuredThought): boolean {
  return s.ideas.length + s.approach.length + s.constraints.length + s.openDecisions.length > 0;
}

/** FR-14 — the prompt sent to the AI: the user's request plus their structured thinking. */
export function buildEnrichedPrompt(request: string, thought: string, s: StructuredThought): string {
  const lines: string[] = [request.trim(), '', 'Before you answer, here is my own thinking. Please build on it rather than replacing it.', ''];
  lines.push(`Goal: ${s.goal.text}`);
  const section = (label: string, items: ThoughtItem[]) => {
    if (items.length) lines.push(`${label}:`, ...items.map((i) => `- ${i.text}`));
  };
  section('What I have in mind', s.ideas);
  section('My approach', s.approach);
  section('Constraints', s.constraints);
  section('Still deciding', s.openDecisions);
  lines.push('', `My rough notes, verbatim: "${thought.trim().replace(/\s+/g, ' ')}"`, '');
  lines.push(
    'Please keep my structure where it works, help me think through the open decisions (explain the tradeoffs), and point out gaps or problems before filling them in.',
  );
  return lines.join('\n');
}
