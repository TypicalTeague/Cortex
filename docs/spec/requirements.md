# Cortex — Requirements

Status: v1.0 (EmoryHacks 2026, Rogue Track). IDs are stable; tests and tasks reference them.

## Product principle
The user's thinking becomes the foundation of the AI output. Cortex never makes people
answer questions to *earn* AI help; it makes their own thinking a rewarding part of using AI.

## Functional requirements

### Classification (Stage A)
- **FR-1** Cortex classifies each submitted request as `routine` or `meaningful`.
- **FR-2** Routine requests (factual lookups, unit conversions, definitions, short arithmetic, greetings) pass through with no intervention.
- **FR-3** Meaningful requests are tagged with a domain: `coding`, `writing`, `career`, `analysis`, `planning`, `creative`, `learning`.
- **FR-4** Classification returns human-readable reasons and a confidence value (for transparency, not scoring).
- **FR-5** The classifier sits behind a `Classifier` interface so a model-assisted classifier can replace or augment the rules engine later.
- **FR-6** Cortex never grades or scores prompt quality.

### Intervention (Stage B)
- **FR-7** For a meaningful request, Cortex shows exactly ONE short, contextual prompt before the AI answers.
- **FR-8** The prompt adapts to domain and to the profile (field, career direction, skills to strengthen).
- **FR-9** Every intervention has a one-click **Skip** that sends the original request unchanged.
- **FR-10** No word counts, no quizzes, no multiple-choice, no repeated questioning. Optional sentence starters may be offered.

### Transformation (Stage C)
- **FR-11** Cortex turns the user's rough thought into a structured "Your idea, structured" output: goal, ideas/structure, approach, constraints, and open decisions.
- **FR-12** Every item derived from the user is traceable to their words; Cortex must not invent personal reasoning.
- **FR-13** Any Cortex-added suggestion is visually and structurally separated and labelled as a Cortex suggestion.
- **FR-14** The user can continue to AI help with their structured thinking attached as context (an enriched prompt).

### Onboarding & profile
- **FR-15** Short onboarding collects: optional name, age range, stage, field, career direction, ambitions (optional), AI use areas, skills to strengthen.
- **FR-16** Onboarding is skippable; Cortex works with a default profile.
- **FR-17** Profile persists locally (localStorage in demo, `chrome.storage.local` in extension).
- **FR-18** Under-18 users are not asked for name or free-text ambitions.

### ChatGPT integration (extension)
- **FR-19** A Manifest V3 Chrome extension intercepts submissions on chatgpt.com / chat.openai.com only.
- **FR-20** For meaningful requests, the extension shows the Cortex card over ChatGPT, then writes the chosen prompt (original or enriched) into the composer and submits it.
- **FR-21** If ChatGPT's DOM is unrecognised, the extension does nothing and ChatGPT works normally.
- **FR-22** Users can pause Cortex from the extension popup.

### Standalone demo
- **FR-23** A self-contained web demo runs the full flow (onboarding → routine pass-through → meaningful intervention → structured output → continuation) without ChatGPT.
- **FR-24** Any scripted assistant response in the demo is labelled as scripted.

### Activity (P1)
- **FR-25** Cortex keeps a local count of interventions shown, thoughts contributed, and skips. Real counts only.

## Non-functional requirements
- **NFR-1 Privacy:** no network calls, analytics, or tracking. All data stays on device.
- **NFR-2 No secrets:** no API keys in the repo or the extension. No paid API required.
- **NFR-3 Resilience:** extension failures must never break ChatGPT input.
- **NFR-4 Speed:** classification + transformation < 50 ms locally.
- **NFR-5 Accessibility:** keyboard operable, visible focus, labelled controls, respects reduced motion.
- **NFR-6 Honesty:** docs distinguish deterministic logic from AI; no fabricated metrics.
- **NFR-7 Testability:** core logic is pure TypeScript with unit tests; demo flow has a browser test.
