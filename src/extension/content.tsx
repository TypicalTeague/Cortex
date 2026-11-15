// Content script for chatgpt.com (FR-19..FR-22). Listens only to ChatGPT's own composer.
// Any error → the event passes through untouched (NFR-3).

import { createRoot, type Root } from 'react-dom/client';
import { recordActivity } from '../core/activity';
import { classify } from '../core/classifier';
import { DEFAULT_PROFILE } from '../core/profile';
import { KEYS, chromeStore, loadProfile } from '../core/storage';
import type { Classification, Profile } from '../core/types';
import { CortexCard } from '../ui/CortexCard';
import css from '../ui/styles.css?inline';
import { clickSend, findComposer, isSendButton, readComposer, writeComposer } from './chatgpt-dom';

const store = chromeStore();
let profile: Profile = { ...DEFAULT_PROFILE };
let paused = false;
let bypass = false; // one-shot: let our own programmatic send through
let open = false;
let host: HTMLDivElement | null = null;
let root: Root | null = null;

const OVERLAY_CSS = `
:host { all: initial; }
.cx-overlay { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: flex-end; justify-content: center;
  padding: 24px 16px 132px; background: rgba(20, 20, 18, 0.28); animation: cx-fade .2s both; }
.cx-overlay .cx-card { max-width: 640px; max-height: calc(100vh - 160px); overflow-y: auto; }
.cx-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 2147483647; background: var(--cx-ink);
  color: var(--cx-bg); padding: 10px 16px; border-radius: 10px; font-size: 14px; box-shadow: var(--cx-shadow); }
`;

async function refresh() {
  try {
    profile = await loadProfile(store);
    paused = (await store.get<boolean>(KEYS.paused)) ?? false;
  } catch {
    /* keep defaults */
  }
}

function mount(): Root {
  if (root && host?.isConnected) return root;
  host = document.createElement('div');
  host.id = 'cortex-root';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css + OVERLAY_CSS;
  shadow.appendChild(style);
  const container = document.createElement('div');
  const light = document.documentElement.classList.contains('light');
  container.className = light ? 'cx cx-light' : 'cx';
  shadow.appendChild(container);
  document.documentElement.appendChild(host);
  root = createRoot(container);
  return root;
}

function close() {
  open = false;
  root?.render(<></>);
  setTimeout(() => findComposer()?.focus(), 0);
}

function toast(msg: string) {
  const r = mount();
  r.render(<div className="cx-toast" role="status">{msg}</div>);
  setTimeout(() => !open && r.render(<></>), 4000);
}

async function send(text: string | null) {
  const composer = findComposer();
  if (text !== null && !writeComposer(composer, text)) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Cortex copied your request + your thinking. Paste it into ChatGPT to send.');
    } catch {
      toast('Cortex couldn’t reach the ChatGPT box. Your thoughts are still above. Try again.');
    }
    return;
  }
  bypass = true;
  const sent = await clickSend();
  if (!sent) {
    bypass = false;
    toast('Your message is ready in the ChatGPT box. Press Enter to send.');
  }
  setTimeout(() => (bypass = false), 500);
}

function showCard(request: string, classification: Classification) {
  open = true;
  const r = mount();
  r.render(
    <div
      className="cx-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        e.stopPropagation();
      }}
    >
      <CortexCard
        request={request}
        classification={classification}
        profile={profile}
        skipLabel="Skip — send as is"
        continueLabel="Send to ChatGPT"
        onCancel={close}
        onSkip={() => {
          close();
          recordActivity(store, 'skipped');
          send(null);
        }}
        onStructured={() => recordActivity(store, 'contributed')}
        onContinue={(prompt) => {
          close();
          send(prompt);
        }}
      />
    </div>,
  );
}

/** Returns true if Cortex took over this submission. */
function intercept(): boolean {
  if (bypass || paused || open) return false;
  const composer = findComposer();
  const text = readComposer(composer).trim();
  if (!composer || !text) return false;
  const c = classify(text, profile);
  if (c.kind === 'routine') {
    recordActivity(store, 'passedThrough');
    return false;
  }
  recordActivity(store, 'interventions');
  showCard(text, c);
  return true;
}

function onKeyDown(e: KeyboardEvent) {
  try {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.altKey) return;
    const composer = findComposer();
    if (!composer || !(e.target instanceof Node) || !composer.contains(e.target)) return;
    if (intercept()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  } catch {
    /* pass through */
  }
}

function onClick(e: MouseEvent) {
  try {
    if (!isSendButton(e.target)) return;
    if (intercept()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  } catch {
    /* pass through */
  }
}

refresh();
try {
  chrome.storage?.onChanged.addListener(() => refresh());
} catch {
  /* not in extension context */
}
window.addEventListener('keydown', onKeyDown, true);
window.addEventListener('click', onClick, true);
