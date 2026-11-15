import { describe, expect, it } from 'vitest';
import { loadActivity, recordActivity } from './activity';
import { loadProfile, memoryStore, saveProfile } from './storage';

describe('storage (FR-17, FR-18, FR-25)', () => {
  it('AC-9 profile round-trips', async () => {
    const s = memoryStore();
    await saveProfile(s, { name: 'Sam', careerDirection: 'Software engineering', aiUses: ['Coding'], skills: ['Debugging'], onboarded: true });
    const p = await loadProfile(s);
    expect(p.name).toBe('Sam');
    expect(p.onboarded).toBe(true);
  });

  it('defaults when empty', async () => {
    expect((await loadProfile(memoryStore())).onboarded).toBe(false);
  });

  it('drops name and ambitions for minors', async () => {
    const s = memoryStore();
    await saveProfile(s, { name: 'Kid', ambitions: 'astronaut', ageRange: 'under-18', aiUses: [], skills: [], onboarded: true });
    const p = await loadProfile(s);
    expect(p.name).toBeUndefined();
    expect(p.ambitions).toBeUndefined();
  });

  it('counts activity', async () => {
    const s = memoryStore();
    await recordActivity(s, 'contributed');
    await recordActivity(s, 'contributed');
    expect((await loadActivity(s)).contributed).toBe(2);
  });
});
