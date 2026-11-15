import { describe, expect, it } from 'vitest';
import { buildEnrichedPrompt, goalFromRequest, splitList, structureThought } from './transform';
import type { StructuredThought } from './types';

const REQ = 'Help me create a portfolio website';
const THOUGHT = "I'd make a homepage, project section, and resume section. Probably use React components but I'm not sure how to organize them.";

// Words Cortex may add when reframing (e.g. "Decide how to…"), plus function words.
const FRAMING = new Set(['decide', 'figure', 'out', 'choose', 'work', 'the', 'a', 'an', 'i’m', "i'm", 'i']);
const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}'’\s]/gu, ' ').split(/\s+/).filter(Boolean);

function youItems(s: StructuredThought) {
  return [s.goal, ...s.ideas, ...s.approach, ...s.constraints, ...s.openDecisions].filter((i) => i.source === 'you');
}

function assertFaithful(req: string, thought: string) {
  const s = structureThought(req, thought, { domain: 'coding' });
  const source = new Set(words(`${req} ${thought}`));
  for (const item of youItems(s)) {
    for (const w of words(item.text)) {
      if (!FRAMING.has(w)) expect(source.has(w), `"${w}" in "${item.text}" not from user`).toBe(true);
    }
  }
  return s;
}

describe('transform (FR-11..FR-14)', () => {
  it('AC-5 structures the portfolio example', () => {
    const s = structureThought(REQ, THOUGHT, { domain: 'coding' });
    expect(s.goal.text).toBe('Create a portfolio website');
    expect(s.ideas.map((i) => i.text)).toEqual(['Homepage', 'Project section', 'Resume section']);
    expect(s.approach.map((i) => i.text)).toEqual(['Use React components']);
    expect(s.openDecisions.map((i) => i.text)).toEqual(['Decide how to organize the React components']);
  });

  it.each([
    [REQ, THOUGHT],
    ['Write my internship cover letter', 'talk about my robotics club project where i led 4 people, and why i like their mission. due friday'],
    ['Help me analyze this dataset', 'my hunch is sales dip in winter. I would group by month and plot it. not sure whether to remove outliers'],
    ['Should I take the offer?', 'pay is better but I like my team. torn between staying and leaving'],
    ['Write my essay on climate policy', 'carbon tax is more efficient than regulation; maybe use the EU as an example — should I include counterarguments?'],
    ['Do my homework', 'idk'],
  ])('AC-5 never invents user reasoning: %s', (req, thought) => {
    assertFaithful(req, thought);
  });

  it('detects constraints and torn-between decisions', () => {
    const s = structureThought('Should I take the offer?', 'pay is better but I like my team. torn between staying and leaving. I need to decide by Friday');
    expect(s.openDecisions.map((i) => i.text)).toContain('Choose between staying and leaving');
    expect(s.constraints.length).toBe(1);
  });

  it('AC-6 Cortex suggestions are labelled cortex and kept separate', () => {
    const s = structureThought(REQ, THOUGHT, { domain: 'coding' });
    expect(s.suggestions.length).toBeGreaterThan(0);
    expect(s.suggestions.every((i) => i.source === 'cortex')).toBe(true);
    expect(youItems(s).every((i) => i.source === 'you')).toBe(true);
  });

  it('AC-8 enriched prompt contains the request and the user ideas', () => {
    const s = structureThought(REQ, THOUGHT, { domain: 'coding' });
    const p = buildEnrichedPrompt(REQ, THOUGHT, s);
    expect(p.startsWith(REQ)).toBe(true);
    for (const t of ['Homepage', 'Resume section', 'Use React components', 'Decide how to organize']) expect(p).toContain(t);
    expect(p).toContain('build on it rather than replacing it');
    expect(p).not.toContain('Cortex suggests');
  });

  it('helpers', () => {
    expect(goalFromRequest('Can you please help me write my cover letter?')).toBe('Write my cover letter');
    expect(splitList('a homepage, project section, and resume section')).toEqual(['Homepage', 'Project section', 'Resume section']);
  });
});
