import { describe, expect, it } from 'vitest';
import { classify } from './classifier';
import type { Profile } from './types';

const swe: Profile = { careerDirection: 'Software engineering', aiUses: [], skills: [], onboarded: true };

describe('classifier (FR-1..FR-6)', () => {
  it.each([
    'What is the capital of Belgium?',
    'Convert 15 miles into kilometers.',
    'convert 100 usd to eur',
    'What is 15% of 80?',
    '12 * 7',
    'Define photosynthesis',
    'What does ephemeral mean?',
    'How many ounces are in a cup?',
    'Who was the first president of the United States?',
    'thanks!',
    'hello',
    'When was the Eiffel Tower built?',
  ])('AC-1 routine: %s', (q) => {
    expect(classify(q).kind).toBe('routine');
  });

  it.each([
    ['Complete my programming assignment', ['coding']],
    ['Help me create a portfolio website', ['coding', 'career']],
    ['Help me analyze this dataset', ['analysis']],
    ['Write my internship cover letter', ['career']],
    ['Write my essay on the causes of World War I', ['writing']],
    ['Should I take the job offer in Atlanta or stay in grad school?', ['planning', 'career']],
    ['Debug my python function that keeps returning None', ['coding']],
    ['Help me brainstorm ideas for a short story', ['creative']],
    ['Make a study plan for my organic chemistry final', ['planning', 'learning']],
  ])('AC-2 meaningful: %s', (q, domains) => {
    const c = classify(q as string);
    expect(c.kind).toBe('meaningful');
    expect(domains).toContain(c.domain);
    expect(c.reasons.length).toBeGreaterThan(0);
  });

  it('FR-4 returns confidence within 0..1 and reasons', () => {
    const c = classify('Write my internship cover letter');
    expect(c.confidence).toBeGreaterThan(0);
    expect(c.confidence).toBeLessThanOrEqual(1);
  });

  it('marks career relevance from the profile', () => {
    const c = classify('Complete my programming assignment', swe);
    expect(c.careerRelevant).toBe(true);
    expect(c.reasons.join(' ')).toMatch(/software engineering/);
  });

  it('prefers the domain matching the user career on ties', () => {
    expect(classify('Help me create a portfolio website', swe).domain).toBe('coding');
  });

  it('FR-6 never grades prompt quality', () => {
    for (const q of ['do my homework', 'What is the capital of Belgium?', 'Help me analyze this dataset']) {
      expect(classify(q).reasons.join(' ')).not.toMatch(/score|grade|rating|quality|bad prompt|good prompt/i);
    }
  });
});
