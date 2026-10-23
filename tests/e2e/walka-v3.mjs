// Test: walka na mapie v3 (?v3=1): ta sama logika i sterowanie dotykiem, inne podłoże, przeszkody i siatka izometrii 30 stopni.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8116), browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
await page.goto('http://127.0.0.1:8116/www/walka.html?v3=1&time=0'); await page.waitForFunction(() => window.__game);
const tapCell = async (x, y) => { const [cx, cy] = await page.evaluate(([x, y]) => window.__game.cssCenter(x, y), [x, y]); const box = await page.locator('canvas#c').boundingBox(); await page.touchscreen.tap(box.x + cx, box.y + cy); };
const st = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state))), unit = (s, id) => s.units.find((u) => u.id === id);
assert.equal(await page.evaluate(() => window.__game.grid.th), 42, 'siatka 72 x 42');
await tapCell(4, 5); let s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [1, 5], 'poza strefą: bez zmiany');
await tapCell(0, 6); s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [0, 6], 'strefa: wybór pola startowego dotykiem w nowej siatce');
await tapCell(1, 5); await page.click('#end'); await page.waitForFunction(() => window.__game.phase === 'fight');
await tapCell(3, 5); assert.ok(await page.evaluate(() => window.__game.preview), 'podgląd drogi'); await tapCell(3, 5); await page.waitForFunction(() => !window.__game.busy);
s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y, unit(s, 'h').pm], [3, 5, 1], 'ruch wykonany');
await tapCell(4, 4); assert.equal(await page.evaluate(() => window.__game.preview), null, 'przeszkoda blokuje');
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-v3.png') });
assert.deepEqual(errors, []); await browser.close(); server.close(); console.log('e2e walka v3: OK');
