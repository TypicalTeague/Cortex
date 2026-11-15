// AC-10: verify the built extension is complete and loadable.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/extension';
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
const files = ['popup.html', 'content.js', ...Object.values(manifest.icons)];
for (const f of files) if (!existsSync(join(dir, f))) fail(`missing ${f}`);
for (const cs of manifest.content_scripts) for (const js of cs.js) if (!existsSync(join(dir, js))) fail(`missing ${js}`);
const content = readFileSync(join(dir, 'content.js'), 'utf8');
if (/^\s*(import|export)\s/m.test(content)) fail('content.js must be a classic script (no ES module syntax)');
if (/sk-[A-Za-z0-9]{20,}/.test(content)) fail('possible API key in bundle');
const hosts = manifest.content_scripts.flatMap((c) => c.matches);
if (hosts.some((h) => !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(h))) fail('content script must only match ChatGPT');
console.log(`✓ extension OK: ${files.length} files, MV3, matches ${hosts.join(', ')}`);
