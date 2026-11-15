// Renders the Cortex logo to PNG icons using the pre-installed Chromium.
import { chromium } from 'playwright';
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#2f6f5e"/><path d="M21.5 10.5a8 8 0 1 0 0 11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M18.6 13.4a3.8 3.8 0 1 0 0 5.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.65"/></svg>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
for (const s of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: s, height: s });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg(s)}`);
  await page.locator('svg').screenshot({ path: `public/icons/icon${s}.png`, omitBackground: true });
}
await browser.close();
console.log('icons written');
