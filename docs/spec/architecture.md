# Cortex — Architecture

## Stack
- TypeScript, React 18, Vite (build), plain CSS with design tokens (no Tailwind: one stylesheet must work both in the demo page and inside a Shadow DOM on ChatGPT).
- Vitest (unit), Playwright (demo E2E, using pre-installed Chromium).
- Chrome Manifest V3; no extension framework. Two Vite builds: (1) HTML pages (demo, popup) and (2) the content script as one IIFE bundle.

## Modules
```
src/core/            pure, framework-free, unit-tested
  types.ts           shared types (Profile, Classification, Intervention, StructuredThought)
  classifier.ts      FR-1..6   rules engine behind `Classifier` interface
  interventions.ts   FR-7..10  domain × profile → one prompt + starters
  transform.ts       FR-11..14 rough thought → StructuredThought + enriched prompt
  profile.ts         FR-15..18 defaults, option lists, focus areas per field
  storage.ts         FR-17     KeyValueStore adapter (localStorage | chrome.storage.local)
  activity.ts        FR-25     local counters
src/ui/              React components shared by demo + extension
  Onboarding.tsx, CortexCard.tsx (intervention → structured result), StructuredView.tsx
  styles.css         tokens + components (injected into Shadow DOM by content script)
src/demo/            standalone demo app (index.html)
src/extension/
  content.tsx        FR-19..21 ChatGPT adapter + Shadow-DOM overlay
  chatgpt-dom.ts     selector strategy, read/write composer, submit
  popup.tsx          onboarding/settings/pause/activity (popup.html)
public/manifest.json MV3 manifest
```

## Data flow
1. User submits text (demo composer, or ChatGPT composer intercepted in capture phase).
2. `classifier.classify(text, profile)` → `routine` → pass through untouched.
3. `meaningful` → `buildIntervention(classification, profile)` → `CortexCard` shows one prompt.
4. User writes a rough thought (or skips → original text sent).
5. `structureThought(request, thought, classification)` → `StructuredThought` with per-item provenance (`you` | `cortex`).
6. User clicks "Continue with AI" → `buildEnrichedPrompt()` → sent to ChatGPT (extension) or shown in demo chat.

## Storage
`KeyValueStore` interface: `get/set`. Keys: `cortex.profile`, `cortex.activity`, `cortex.paused`.
Demo uses `localStorage`; extension uses `chrome.storage.local` (shared by popup and content script).

## Extension integration
- `content_scripts` matched only to `https://chatgpt.com/*` and `https://chat.openai.com/*`.
- Capture-phase `keydown` (Enter without Shift inside composer) and `click` (send button) listeners.
- Selector strategy with fallbacks: `#prompt-textarea`, `[contenteditable][id*=prompt]`, `textarea`; send: `[data-testid="send-button"]`, `button[aria-label*="Send"]`.
- If composer not found or text empty → do nothing. All handlers are wrapped in try/catch; on error, the event passes through.
- To send: set a one-shot bypass flag, write text via `execCommand('insertText')` (works with ProseMirror) or native value setter for `<textarea>`, then click send. If writing fails, the enriched prompt is copied to clipboard and the user is told.
- UI rendered into a Shadow DOM root to isolate styles both ways.

## Privacy
No network requests, no telemetry, no remote code. Permissions: `storage` only + host match for ChatGPT. Under-18 flow collects less.

## Tradeoffs
- Rules classifier: deterministic, instant, free, explainable; less nuanced than an LLM. Mitigated by the interface (FR-5) and transparent reasons.
- Deterministic transformation: guaranteed not to invent user reasoning (FR-12); phrasing is less fluent than an LLM's.
- DOM interception is brittle by nature; mitigated by graceful no-op and the standalone demo.
