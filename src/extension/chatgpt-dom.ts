// ChatGPT DOM adapter (FR-19..FR-21). All selectors live here, layered from most to least
// specific. Every function returns null/false instead of throwing when the DOM is unfamiliar,
// so an interface change makes Cortex step aside rather than break ChatGPT (NFR-3).

export const COMPOSER_SELECTORS = [
  '#prompt-textarea',
  'div[contenteditable="true"][id*="prompt"]',
  'form div.ProseMirror[contenteditable="true"]',
  'form textarea[name="prompt-textarea"]',
];

export const SEND_SELECTORS = [
  'button[data-testid="send-button"]',
  'button#composer-submit-button',
  'form button[aria-label*="Send" i]',
];

function first<T extends Element>(root: ParentNode, selectors: string[]): T | null {
  for (const s of selectors) {
    try {
      const el = root.querySelector<T>(s);
      if (el) return el;
    } catch {
      /* invalid selector in this browser — try next */
    }
  }
  return null;
}

export function findComposer(root: ParentNode = document): HTMLElement | null {
  return first<HTMLElement>(root, COMPOSER_SELECTORS);
}

export function findSendButton(root: ParentNode = document): HTMLButtonElement | null {
  return first<HTMLButtonElement>(root, SEND_SELECTORS);
}

export function isSendButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return SEND_SELECTORS.some((s) => target.closest(s));
  } catch {
    return false;
  }
}

export function readComposer(el: HTMLElement | null): string {
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement) return el.value;
  return (el.innerText ?? el.textContent ?? '').replace(/ /g, ' ');
}

function normalize(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

/** Replace the composer's content with `text`. Returns true if the composer now holds it. */
export function writeComposer(el: HTMLElement | null, text: string): boolean {
  if (!el) return false;
  const ok = () => normalize(readComposer(el)).startsWith(normalize(text).slice(0, 40));
  try {
    if (el instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return ok();
    }
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);

    // 1) Synthetic paste — ProseMirror turns text/plain into paragraphs.
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
      if (ok()) return true;
    } catch {
      /* fall through */
    }
    // 2) execCommand insertText.
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    if (document.execCommand?.('insertText', false, text) && ok()) return true;
    // 3) Last resort: paragraphs + input event.
    el.innerHTML = '';
    for (const line of text.split('\n')) {
      const p = document.createElement('p');
      p.textContent = line;
      el.appendChild(p);
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    return ok();
  } catch {
    return false;
  }
}

/** Click ChatGPT's send button, waiting briefly for it to enable. */
export async function clickSend(root: ParentNode = document, timeoutMs = 1500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const btn = findSendButton(root);
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
      btn.click();
      return true;
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  return false;
}
