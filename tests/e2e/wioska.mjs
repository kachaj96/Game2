// Mapa wioski z obrazu: wczytuje się, bohater idzie po dotknięciu, nie wchodzi w budynek, NPC otwiera rozmowę, wyjście pyta o opuszczenie wioski.
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8155), browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
await page.goto('http://127.0.0.1:8155/www/wioska-mapa.html'); await page.waitForFunction(() => window.__wioska && window.__wioska.ready);
const hero = () => page.evaluate(() => ({ x: window.__wioska.hero.x, y: window.__wioska.hero.y, m: window.__wioska.hero.moving }));
const idle = async () => { for (let i = 0; i < 80; i++) { if (!(await hero()).m) return; await page.waitForTimeout(100); } };
// 1. dotknięcie ziemi prowadzi bohatera
const h0 = await hero(); const c = await page.evaluate(([x, y]) => window.__wioska.css(x, y), [h0.x + 2.5, h0.y - 1.5]); await page.touchscreen.tap(c[0], c[1]); await idle();
const h1 = await hero(); assert.ok(Math.hypot(h1.x - h0.x, h1.y - h0.y) > 1.5, 'poszedł');
// 2. próba wejścia w budynek (środek karczmy) kończy się przed nim, nie w środku
const inside = await page.evaluate(() => { const w = window.__wioska; const g = w.sc.proj.toGrid(860, 330); w.hero.x = g[0] - 3; w.hero.y = g[1] + 2; return g; });
for (let i = 0; i < 30; i++) { await page.evaluate(([x, y]) => { const w = window.__wioska; w.hero.path = [[w.hero.x, w.hero.y], [x, y]]; w.hero.i = 1; w.hero.moving = true; }, inside); await page.waitForTimeout(100); }
const blocked = await page.evaluate(() => { const w = window.__wioska, h = w.hero; return Math.hypot(h.x - w.sc.proj.toGrid(860, 330)[0], h.y - w.sc.proj.toGrid(860, 330)[1]) > 0.8; }); assert.ok(blocked, 'nie wszedł w środek budynku');
// 3. NPC otwiera dymek
const n = await page.evaluate(() => { const w = window.__wioska, q = w.npcs[0]; w.hero.x = w.sc.start[0]; w.hero.y = w.sc.start[1]; return q.gp; });
await page.waitForTimeout(1500); const nc = await page.evaluate(([x, y]) => window.__wioska.css(x, y), n); await page.touchscreen.tap(nc[0], nc[1]); await idle(); await page.waitForSelector('#bubble', { state: 'visible', timeout: 5000 });
assert.match(await page.locator('#btext').textContent(), /arena|arenie|areny/i); await page.locator('#bclose').tap();
// 4. wyjście pyta o opuszczenie wioski
const ex = await page.evaluate(() => { const w = window.__wioska, e = w.sc.proj.toGrid(330, 568); w.hero.x = e[0] + 2; w.hero.y = e[1] - 1.5; return e; });
await page.waitForTimeout(500); const ec = await page.evaluate(([x, y]) => window.__wioska.css(x, y), ex); await page.touchscreen.tap(ec[0], ec[1]); await idle(); await page.waitForSelector('#leave', { state: 'visible', timeout: 5000 });
assert.match(await page.locator('#lname').textContent(), /Stary|Droga/);
assert.deepEqual(errors, [], errors.join('\n')); await browser.close(); server.close(); console.log('e2e wioska: OK');
