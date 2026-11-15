import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { resolve } from 'node:path';

// Loads the REAL built extension (dist/extension) into Chromium and serves a mock
// chatgpt.com page via request interception. Verifies FR-19..FR-21 against a DOM
// shaped like ChatGPT's (#prompt-textarea contenteditable + send-button).

const EXT = resolve('dist/extension');

const MOCK_CHATGPT = `<!doctype html><html><body>
<main><ul id="sent"></ul>
<form id="f" onsubmit="return false">
  <div id="prompt-textarea" contenteditable="true" style="min-height:40px;border:1px solid #ccc"></div>
  <button type="button" data-testid="send-button" id="send">Send</button>
</form></main>
<script>
  const box = document.getElementById('prompt-textarea');
  function submit(){ const t = box.innerText.trim(); if(!t) return; const li=document.createElement('li'); li.textContent=t; document.getElementById('sent').appendChild(li); box.innerHTML=''; }
  document.getElementById('send').addEventListener('click', submit);
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } });
</script></body></html>`;

const UNKNOWN_DOM = `<!doctype html><html><body><textarea id="other"></textarea><ul id="log"></ul>
<script>document.getElementById('other').addEventListener('keydown',e=>{if(e.key==='Enter'){const li=document.createElement('li');li.textContent='sent';document.getElementById('log').appendChild(li);}});</script>
</body></html>`;

let ctx: BrowserContext;

test.beforeAll(async () => {
  ctx = await chromium.launchPersistentContext('', {
    executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium',
    headless: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--headless=new'],
  });
  await ctx.route('https://chatgpt.com/**', (r) => r.fulfill({ contentType: 'text/html', body: MOCK_CHATGPT }));
  await ctx.route('https://chat.openai.com/**', (r) => r.fulfill({ contentType: 'text/html', body: UNKNOWN_DOM }));
});
test.afterAll(async () => ctx?.close());

async function type(page: import('@playwright/test').Page, text: string) {
  await page.locator('#prompt-textarea').click();
  await page.keyboard.insertText(text);
}

test('routine request passes through untouched', async () => {
  const page = await ctx.newPage();
  await page.goto('https://chatgpt.com/');
  await page.waitForTimeout(500);
  await type(page, 'What is the capital of Belgium?');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sent li')).toHaveText(['What is the capital of Belgium?']);
  await expect(page.locator('#cortex-root .cx-card')).toHaveCount(0);
});

test('meaningful request → Cortex card → structured → enriched prompt sent', async () => {
  const page = await ctx.newPage();
  await page.goto('https://chatgpt.com/');
  await page.waitForTimeout(500);
  await type(page, 'Help me create a portfolio website');
  await page.keyboard.press('Enter');
  const card = page.locator('#cortex-root [data-testid="cortex-card"]');
  await expect(card).toBeVisible();
  await expect(page.locator('#sent li')).toHaveCount(0); // held back, not blocked forever
  await page.locator('#cortex-root [data-testid="thought-input"]').fill("I'd make a homepage, project section, and resume section. Probably use React components.");
  await page.locator('#cortex-root [data-testid="structure"]').click();
  await expect(page.locator('#cortex-root [data-testid="structured"]')).toContainText('Homepage');
  await page.locator('#cortex-root [data-testid="continue"]').click();
  const sent = page.locator('#sent li');
  await expect(sent).toHaveCount(1);
  await expect(sent).toContainText('Help me create a portfolio website');
  await expect(sent).toContainText('Use React components');
  await expect(sent).toContainText('build on it rather than replacing it');
});

test('skip sends the original request unchanged (send button path)', async () => {
  const page = await ctx.newPage();
  await page.goto('https://chatgpt.com/');
  await page.waitForTimeout(500);
  await type(page, 'Write my internship cover letter');
  await page.locator('#send').click();
  await expect(page.locator('#cortex-root [data-testid="cortex-card"]')).toBeVisible();
  await page.locator('#cortex-root [data-testid="skip"]').click();
  await expect(page.locator('#sent li')).toHaveText(['Write my internship cover letter']);
});

test('unknown DOM → Cortex does nothing (FR-21)', async () => {
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('https://chat.openai.com/');
  await page.waitForTimeout(500);
  await page.locator('#other').fill('Write my internship cover letter');
  await page.locator('#other').press('Enter');
  await expect(page.locator('#log li')).toHaveCount(1);
  await expect(page.locator('#cortex-root .cx-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});
