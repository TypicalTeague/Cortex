// FR-25 — honest local counters. No timestamps of content, no prompt text stored.
import { KEYS, type KeyValueStore } from './storage';
import type { Activity } from './types';

export const EMPTY_ACTIVITY: Activity = { interventions: 0, contributed: 0, skipped: 0, passedThrough: 0 };

export async function loadActivity(store: KeyValueStore): Promise<Activity> {
  return { ...EMPTY_ACTIVITY, ...(await store.get<Activity>(KEYS.activity)) };
}

export async function recordActivity(store: KeyValueStore, event: keyof Activity): Promise<Activity> {
  const a = await loadActivity(store);
  a[event] += 1;
  await store.set(KEYS.activity, a);
  return a;
}
