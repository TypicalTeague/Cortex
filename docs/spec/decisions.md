# Cortex — Architecture Decision Records

### ADR-1 Repository
The session's GitHub access is scoped to the existing public repo `TypicalTeague/CognitiveLoad`; creating a new `cortex` repo was not possible from this environment. Cortex lives there. It can be renamed to `cortex` in GitHub settings later (GitHub redirects old URLs).

### ADR-2 Rules-based classifier first
Deterministic weighted rules (routine patterns vs. delegation verbs + domain keywords + length). Instant, free, private, explainable. Wrapped in a `Classifier` interface so a model-assisted classifier can be added (FR-5).

### ADR-3 Deterministic thought transformation
Clause splitting + cue-phrase extraction, with per-item provenance. Chosen because FR-12 (never invent user reasoning) is a hard requirement we can *test*. Cortex suggestions are template-based and explicitly labelled. An LLM path is P1 and would require a backend; none ships now, so no API key is ever needed.

### ADR-4 No Tailwind, plain CSS tokens
The same stylesheet is injected into a Shadow DOM on ChatGPT and used by the demo. A single CSS file with custom properties is simplest and avoids PostCSS config in two builds.

### ADR-5 No extension framework
Two small Vite builds (pages + IIFE content script) instead of WXT/CRXJS, to avoid framework risk under a hard deadline.

### ADR-6 Continuation = enriched prompt
"Continue with AI" sends the original request plus the user's structured thinking and an instruction to build on it rather than replace it. In the extension this goes to ChatGPT; in the demo it's shown in a demo chat with a clearly labelled scripted reply and an "Open in ChatGPT" link.

### ADR-7 Privacy by default
No network calls, telemetry, or remote code. Only the `storage` permission.
