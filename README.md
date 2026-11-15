# Cortex

**A thinking companion for ChatGPT.** Cortex helps you use AI without handing over your own reasoning. Quick questions go straight through. When a task deserves your thinking, Cortex asks one short question, turns your rough answer into a clear structure, and sends that structure to ChatGPT so the AI builds on *your* ideas.

> Built for **EmoryHacks 2026 · Rogue Track**.

- **Try the live demo:** https://typicalteague.github.io/Cortex/ (or [run it locally](#run-the-standalone-demo)).
- **Install the extension:** [`release/cortex-extension.zip`](release/cortex-extension.zip), then follow the [steps below](#install-the-chrome-extension).

---

## The problem

Students and early-career professionals now hand whole tasks to AI: assignments, cover letters, analyses, project plans. The result arrives fast, but the thinking that would have built their skills never happens. That thinking is decomposition, forming hypotheses, weighing tradeoffs, and finding their own voice. These are the abilities an AI-driven workforce will reward most, and they are being outsourced the fastest.

Blocking AI doesn't work, and quiz-style "learning tools" feel like homework. People need a way to keep using AI that *keeps them in the loop*.

## What Cortex does

| Stage | What happens |
|---|---|
| **A · Classify** | Every message is checked locally. Lookups, conversions, definitions and small talk pass through with **no interruption**. Meaningful work (coding, writing, career, analysis, planning, creative, studying) is flagged. |
| **B · Capture your thinking** | For meaningful tasks, Cortex asks **one** contextual question, tuned to the task and your career direction. Software engineers get *"How would you break this into pieces?"*; data analysts get *"What's your hypothesis before looking?"*. No word counts, no quizzes, and a **Skip** button is always there. |
| **C · Turn thoughts into progress** | Your rough, half-formed answer becomes **"Your idea, structured"**: goal, your proposed structure, your approach, constraints you named, and decisions still to make. Every item comes from your own words. Cortex's own suggestions are labelled separately. |
| **Continue** | One click sends ChatGPT your request **plus your structured thinking**, with an instruction to build on it rather than replace it. |

Example: you type *"Help me create a portfolio website"*, then jot down *"I'd make a homepage, project section, and resume section. Probably use React components but I'm not sure how to organize them."* Cortex returns:

```
YOUR IDEA, STRUCTURED
Create a portfolio website

Your proposed structure     · Homepage · Project section · Resume section
Your approach               · Use React components
Decisions still to make     ▢ Decide how to organize the React components

✦ Cortex suggests: Ask the AI to review your structure before it writes code…
```

### Core features
- Rules-based task classifier with transparent reasons ("Why did Cortex step in?")
- Career-aware single-question interventions, with optional sentence starters
- Deterministic thought structuring with per-item provenance (`you` vs `cortex`)
- Enriched-prompt handoff to ChatGPT
- Short, skippable onboarding (name, age range, stage, field, career direction, AI uses, skills). Users under 18 are asked less.
- Local-only activity counts (thoughts shared / stepped in / passed through / skipped)
- Pause toggle in the extension popup
- Standalone interactive demo that doesn't depend on ChatGPT

## What's AI-powered vs. deterministic (honest accounting)

- **Classification, interventions and thought structuring are deterministic TypeScript** running locally. Cortex makes **no AI calls, no network requests, and needs no API key.** We chose this on purpose: it's instant, private and free, and we can *test* that Cortex never invents your reasoning.
- **The AI is ChatGPT itself.** The extension hands your enriched prompt to ChatGPT in your own session.
- **In the standalone demo, assistant replies are scripted** and labelled that way in the UI, except unit conversions, which are actually calculated. The demo shows the exact prompt that would go to ChatGPT, and has a "Send this to ChatGPT for real" link.
- The classifier sits behind a `Classifier` interface, so a model-assisted classifier can be added later (see roadmap).

## Architecture

```
src/core/          Pure TypeScript, unit-tested
  classifier.ts    Stage A: weighted rules → routine | meaningful + domain + reasons
  interventions.ts Stage B: domain × career track → one question, why-line, starters
  transform.ts     Stage C: rough thought → StructuredThought (+ enriched prompt)
  profile.ts       Onboarding options, career tracks and their focus skills
  storage.ts       KeyValueStore: localStorage (demo) | chrome.storage.local (extension)
  activity.ts      Local counters
src/ui/            React components shared by demo + extension (CortexCard, StructuredView, Onboarding)
src/demo/          Standalone demo app
src/extension/     MV3: content.tsx (ChatGPT overlay in Shadow DOM), chatgpt-dom.ts (selectors), popup
public/manifest.json
```

**Data flow:** submit → `classify()` → routine: pass through · meaningful: `CortexCard` shows `buildIntervention()` → user writes a thought or skips → `structureThought()` → "Continue" → `buildEnrichedPrompt()` → written into ChatGPT's composer and sent.

**Extension integration.** The content script runs only on `chatgpt.com` and `chat.openai.com`. It listens in the capture phase for Enter in ChatGPT's composer and for clicks on its send button. For routine requests it does nothing. For meaningful ones it holds the send, shows the Cortex card in an isolated Shadow DOM, and afterwards writes the chosen prompt back into the composer and clicks send. If ChatGPT's DOM is unrecognised, Cortex does nothing and ChatGPT keeps working normally. Every handler is wrapped so errors fall through.

**Privacy.** No network calls, analytics or remote code. The only permission is `storage`. Your profile and counters stay on your device. Cortex does not store prompt text.

Full specs: [`docs/spec/`](docs/spec): [requirements](docs/spec/requirements.md), [architecture](docs/spec/architecture.md), [acceptance criteria](docs/spec/acceptance-criteria.md), [tasks](docs/spec/tasks.md), [decisions](docs/spec/decisions.md).

## Tech stack
TypeScript · React 18 · Vite 6 · Chrome Manifest V3 · plain CSS design tokens · Vitest · Playwright

## Local installation

Requires Node 18+ (developed on Node 22).

```bash
npm install
```

## Run the standalone demo

```bash
npm run dev
```

Open http://localhost:5173. For the production build:

```bash
npm run build
```

```bash
npm run preview
```

Then open http://localhost:4173.

Suggested path: finish onboarding (pick *Software engineering*), click **"What is the capital of Belgium?"** (passes straight through), then **"Help me create a portfolio website"**. Type a rough thought, click **Shape my thinking**, then **Continue with AI**. The *Under the hood* panel (*Details* on mobile) shows the classification and its reasons live.

## Install the Chrome extension

**Option A (prebuilt):** download [`release/cortex-extension.zip`](release/cortex-extension.zip) and unzip it.
**Option B (from source):** run `npm run build`; the extension is written to `dist/extension/`.

Then:
1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder (or `dist/extension`).
4. Pin Cortex, click its icon, and complete the short onboarding.
5. Open https://chatgpt.com and try *"What is the capital of Belgium?"* (no interruption), then *"Help me create a portfolio website"* (Cortex steps in).

Use the popup toggle to pause Cortex at any time.

## Testing

```bash
npm test            # Vitest unit tests for classifier, interventions, transformation, storage
npm run typecheck
npm run e2e         # builds, then runs Playwright
```

`npm run e2e` runs two suites:
- `tests/e2e/demo.spec.ts`: the full demo flow (onboarding → routine pass-through → intervention → structured output → continue → skip → reload persistence).
- `tests/e2e/extension.spec.ts`: loads the **real built extension** into Chromium and serves a mock page shaped like ChatGPT's DOM at `https://chatgpt.com`. It checks routine pass-through, intervention → enriched prompt sent, skip → original sent, and no-op on an unknown DOM.

Playwright uses Chromium at `/opt/pw-browsers/chromium` by default. Point it at your own Chromium with `PW_CHROMIUM=/path/to/chrome`, or delete `launchOptions` in `playwright.config.ts` after running `npx playwright install chromium`.

Requirement traceability: test names reference acceptance criteria (`AC-*`) from [`docs/spec/acceptance-criteria.md`](docs/spec/acceptance-criteria.md).

## Known limitations
- **Live ChatGPT:** the content script is tested against a mock of ChatGPT's DOM (`#prompt-textarea` and `data-testid="send-button"`), not the live site. Our build environment couldn't reach chatgpt.com. ChatGPT changes its markup often. If the selectors stop matching, Cortex steps aside (ChatGPT keeps working) until `src/extension/chatgpt-dom.ts` is updated.
- **Rules-based classification** can misjudge borderline prompts. For example, it treats short emails or "explain X" as routine. Reasons are shown so users can see why.
- **Deterministic structuring** is faithful but not eloquent. Very long or rambling thoughts produce longer lists.
- **ChatGPT only** for now. Claude, Gemini and other assistants are *not* supported yet.
- The standalone demo has no live model; its replies are scripted and labelled.
- English only.

## Hosting the demo
The demo is live at https://typicalteague.github.io/Cortex/. `.github/workflows/pages.yml` rebuilds and republishes it on every push to `main`.

## Roadmap
- **Next:** optional model-assisted classification and phrasing via a small backend (keys server-side, deterministic fallback kept), smarter selector recovery, a richer activity history.
- **Later:** Claude and Gemini adapters, opt-in sync across devices, longitudinal insight into which skills you practice, team/classroom modes.

## Hackathon attribution
Built for **EmoryHacks 2026 (Rogue Track)**. All code in this repository was written during the hackathon. Built with help from Claude Code as an AI pair-programmer. Third-party libraries: React, Vite, Vitest, Playwright (MIT / Apache-2.0).

License: MIT.
