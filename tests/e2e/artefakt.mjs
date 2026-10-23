// Wersje jednoplikowe (artefakty) muszą działać tak samo jak strony: budujemy je tym samym skryptem co do publikacji i otwieramy z pliku.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'artefakt-')), root = new URL('../../', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const page of ['podglad', 'edytor']) {
  const out = path.join(dir, page + '.html'); execFileSync('python3', [path.join(root, 'tools/build_single.py'), page + '.html', out, '--artefakt']);
  const p = await browser.newPage({ viewport: { width: 900, height: 520 } }), errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + out); await p.waitForFunction((n) => window[n], page === 'podglad' ? '__podglad' : '__edytor', { timeout: 20000 });
  if (page === 'podglad') { await p.evaluate(() => window.__podglad.go(12, 6)); await p.waitForTimeout(800); assert.ok(await p.evaluate(() => window.__podglad.hero.walk || window.__podglad.hero.x > 10.6), 'bohater rusza'); }
  else { await p.locator('#val').click(); assert.ok((await p.locator('#res div').count()) >= 1); }
  assert.deepEqual(errs, [], page + ': błędy strony'); await p.close();
}
await browser.close(); console.log('e2e artefakt: OK');
