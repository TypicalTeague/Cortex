import { describe, expect, it } from 'vitest';
import { classify } from './classifier';
import { buildIntervention } from './interventions';
import type { Profile } from './types';

const p = (careerDirection: string, extra: Partial<Profile> = {}): Profile => ({ careerDirection, aiUses: [], skills: [], onboarded: true, ...extra });

describe('interventions (FR-7..FR-10)', () => {
  it('returns null for routine requests', () => {
    expect(buildIntervention(classify('What is the capital of Belgium?'))).toBeNull();
  });

  it('asks exactly one question', () => {
    const i = buildIntervention(classify('Complete my programming assignment'))!;
    expect(i.question.match(/\?/g)?.length).toBe(1);
  });

  it('AC-3 software engineering → decomposition/architecture framing', () => {
    const prof = p('Software engineering');
    const i = buildIntervention(classify('Complete my programming assignment', prof), prof)!;
    expect(`${i.question} ${i.why}`).toMatch(/break|pieces|decomposition|architecture/i);
  });

  it('AC-3 data analysis → hypothesis/evidence framing', () => {
    const prof = p('Data & analytics');
    const i = buildIntervention(classify('Help me analyze this dataset', prof), prof)!;
    expect(`${i.question} ${i.why}`).toMatch(/hypothes|evidence/i);
  });

  it('career tasks ask about the user experience', () => {
    const i = buildIntervention(classify('Write my internship cover letter'))!;
    expect(i.question).toMatch(/experience|project/i);
  });

  it('AC-12 never scores or grades', () => {
    const prompts = ['Complete my programming assignment', 'Write my essay on climate policy', 'Help me analyze this dataset', 'Write my internship cover letter'];
    for (const q of prompts) {
      const i = buildIntervention(classify(q), p('Business & product'))!;
      expect(JSON.stringify(i)).not.toMatch(/score|grade|rating|\/10|points/i);
      expect(JSON.stringify(i)).not.toMatch(/at least \d+ words|minimum/i);
    }
  });

  it('keeps younger users general', () => {
    const prof = p('Software engineering', { ageRange: 'under-18' });
    const i = buildIntervention(classify('Help me write my history essay', prof), prof)!;
    expect(i.why).not.toMatch(/practice for/);
  });
});
