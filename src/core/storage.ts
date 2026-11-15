// Local persistence (FR-17, NFR-1). One small async key-value interface,
// backed by localStorage (demo) or chrome.storage.local (extension). Nothing leaves the device.

import { DEFAULT_PROFILE, sanitizeProfile } from './profile';
import type { Profile } from './types';

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export const KEYS = { profile: 'cortex.profile', activity: 'cortex.activity', paused: 'cortex.paused' } as const;

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    async get<T>(k: string) {
      const v = m.get(k);
      return v === undefined ? undefined : (JSON.parse(v) as T);
    },
    async set<T>(k: string, v: T) {
      m.set(k, JSON.stringify(v));
    },
  };
}

export function localStorageStore(ls: Storage = globalThis.localStorage): KeyValueStore {
  return {
    async get<T>(k: string) {
      try {
        const v = ls.getItem(k);
        return v === null ? undefined : (JSON.parse(v) as T);
      } catch {
        return undefined;
      }
    },
    async set<T>(k: string, v: T) {
      try {
        ls.setItem(k, JSON.stringify(v));
      } catch {
        /* storage unavailable — Cortex still works for this session */
      }
    },
  };
}

export function chromeStore(): KeyValueStore {
  return {
    get<T>(k: string) {
      return new Promise<T | undefined>((resolve) => {
        try {
          chrome.storage.local.get(k, (r) => resolve(r?.[k] as T | undefined));
        } catch {
          resolve(undefined);
        }
      });
    },
    set<T>(k: string, v: T) {
      return new Promise<void>((resolve) => {
        try {
          chrome.storage.local.set({ [k]: v }, () => resolve());
        } catch {
          resolve();
        }
      });
    },
  };
}

export async function loadProfile(store: KeyValueStore): Promise<Profile> {
  const p = await store.get<Profile>(KEYS.profile);
  return p ? { ...DEFAULT_PROFILE, ...p } : { ...DEFAULT_PROFILE };
}

export async function saveProfile(store: KeyValueStore, profile: Profile): Promise<Profile> {
  const clean = sanitizeProfile(profile);
  await store.set(KEYS.profile, clean);
  return clean;
}
