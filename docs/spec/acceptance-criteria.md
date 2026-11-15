# Cortex — Acceptance Criteria

Each criterion is observable and mapped to requirements and tests.

| ID | Criterion | Reqs | Verified by |
|----|-----------|------|-------------|
| AC-1 | "What is the capital of Belgium?" and "Convert 15 miles into kilometers." classify as `routine`; no card is shown. | FR-1, FR-2 | `classifier.test.ts`, `demo.spec.ts` |
| AC-2 | "Complete my programming assignment", "Help me create a portfolio website", "Help me analyze this dataset", "Write my internship cover letter" classify as `meaningful` with domains coding / coding\|career / analysis / career. | FR-1, FR-3 | `classifier.test.ts` |
| AC-3 | For a profile with career direction "Software engineering", a coding request's prompt references engineering skills (e.g. decomposition/architecture); for "Data analysis" an analysis request references hypotheses/evidence. | FR-8 | `interventions.test.ts` |
| AC-4 | The user can type a short unstructured thought (≥1 word, no minimum) and submit it. | FR-7, FR-10 | `demo.spec.ts` |
| AC-5 | Structuring the portfolio example yields: goal mentions portfolio website; structure lists Homepage, Project section, Resume section; approach mentions React components; open decision about organizing. Every `you` item's content words appear in the user's input or request. | FR-11, FR-12 | `transform.test.ts` |
| AC-6 | Cortex suggestions carry `source: 'cortex'` and render under a "Cortex suggests" label. | FR-13 | `transform.test.ts`, `demo.spec.ts` |
| AC-7 | Clicking Skip sends the original request unchanged. | FR-9 | `demo.spec.ts` |
| AC-8 | Clicking "Continue with AI" produces an enriched prompt containing the original request and the user's structured ideas. | FR-14 | `transform.test.ts`, `demo.spec.ts` |
| AC-9 | After onboarding and reload, the profile is still present. | FR-17 | `storage.test.ts`, `demo.spec.ts` |
| AC-10 | `npm run build` produces `dist/extension` with manifest.json, content.js, popup.html. | FR-19 | build + `scripts/verify-extension.mjs` |
| AC-11 | The demo runs end-to-end in a browser without network access to ChatGPT. | FR-23 | `demo.spec.ts` |
| AC-12 | No intervention text contains a score, grade, or rating of the prompt. | FR-6 | `interventions.test.ts` |
| AC-13 | Unknown ChatGPT DOM → content script does nothing and throws nothing. | FR-21, NFR-3 | `chatgpt-dom.test.ts` |
