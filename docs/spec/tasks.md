# Cortex — Tasks & Implementation Plan

## Implementation order
1. Scaffold (Vite, TS, Vitest, Playwright config) — T-1
2. Core logic + unit tests: classifier → interventions → transform → storage/activity — T-2..T-5
3. Shared UI: styles, CortexCard, StructuredView, Onboarding — T-6, T-7
4. Standalone demo — T-8
5. Extension: DOM adapter, content script, popup, manifest — T-9..T-11
6. E2E demo test, build verification — T-12, T-13
7. README, submission, demo script — T-14

## Risks
- ChatGPT DOM changes → layered selectors, graceful no-op, demo as the reliable path.
- Writing into ProseMirror composer → `execCommand('insertText')` + clipboard fallback.
- Time (≈5.5 h) → P0 vertical slice first; P1 only after tests pass.

## Tasks
| ID | P | Task | Reqs | Status |
|----|---|------|------|--------|
| T-1 | P0 | Project scaffold, build scripts | NFR-7 | done |
| T-2 | P0 | Rules classifier behind `Classifier` interface | FR-1..6 | done |
| T-3 | P0 | Intervention generator (domain × profile) | FR-7..10 | done |
| T-4 | P0 | Thought transformation + enriched prompt | FR-11..14 | done |
| T-5 | P0 | Storage adapter + profile defaults | FR-15..18 | done |
| T-6 | P0 | Onboarding UI | FR-15, FR-16, FR-18 | done |
| T-7 | P0 | CortexCard + StructuredView UI | FR-7..14 | done |
| T-8 | P0 | Standalone demo app | FR-23, FR-24 | done |
| T-9 | P0 | ChatGPT DOM adapter | FR-19..21 | done |
| T-10 | P0 | Content script overlay | FR-20, NFR-3 | done |
| T-11 | P0 | Popup (onboarding, pause) + manifest | FR-17, FR-22 | done |
| T-12 | P0 | Playwright demo E2E | AC-1,4,6,7,8,9,11 | done |
| T-13 | P0 | Extension build verification script | AC-10 | done |
| T-14 | P0 | README and submission materials (submission materials kept private) | — | done |
| T-15 | P1 | Local activity counts in popup + demo | FR-25 | done |
| T-16 | P1 | GitHub Pages workflow for hosted demo | — | done (workflow; Pages must be enabled in repo settings) |
| T-17 | P1 | Optional LLM-assisted transformation via backend | — | deferred (keeps zero-network guarantee for MVP) |
| T-21 | P1 | Real-extension E2E against ChatGPT-shaped mock | FR-19..21 | done |
| T-22 | P1 | Prebuilt extension zip in `release/` | — | done |
| T-18 | P2 | Claude / Gemini adapters | — | future |
| T-19 | P2 | Accounts & sync | — | future |
| T-20 | P2 | Longitudinal skill insights | — | future |

## Testing approach
- Unit (Vitest): classifier corpus, intervention personalisation, transformation provenance, storage round-trip, DOM adapter no-op.
- E2E (Playwright): demo flow from onboarding through continuation, plus reload persistence; real built extension loaded into Chromium against a mock `https://chatgpt.com` page (routed by Playwright).
- Not automated: live chatgpt.com (unreachable from the build sandbox) → manual check in the demo checklist.
- Build check: script asserts extension output files and manifest validity.
