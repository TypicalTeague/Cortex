# Cortex — Architecture Decision Records

### ADR-1 Repository
The session's GitHub access was scoped to an existing public repo (`TypicalTeague/CognitiveLoad`), so Cortex was built there and the repo was then renamed to `TypicalTeague/cortex`. GitHub redirects the old URL.

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

### ADR-8 Extension verified against a ChatGPT-shaped mock
The build sandbox cannot reach chatgpt.com. The real built extension is loaded into Chromium and a mock page mirroring ChatGPT's composer (`#prompt-textarea` contenteditable, `data-testid="send-button"`) is served at `https://chatgpt.com` via Playwright routing. Live-site verification is a manual step in `docs/demo-script.md`.

### ADR-9 Composer write strategy
Writing into ChatGPT's ProseMirror editor: synthetic `paste` (ProseMirror handles it natively) → `execCommand('insertText')` → paragraph DOM + `input` event. If none succeed, the enriched prompt is copied to the clipboard and the user is told. Sending uses a one-shot bypass flag so Cortex never intercepts its own send.

### ADR-10 Committed release zip
`release/cortex-extension.zip` is committed so judges can install without a toolchain. Regenerate with `npm run package`.
