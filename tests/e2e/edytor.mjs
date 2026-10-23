// Edytor kolizji: maluje kafle, dodaje obiekt z podstawą, zapisuje wersję roboczą, a gra (?draft=1) ją wczytuje i respektuje.
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8165), browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 }, hasTouch: false, deviceScaleFactor: 1 });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
page.on('dialog', (d) => d.accept('test_obiekt'));
await page.goto('http://127.0.0.1:8165/www/edytor-kolizji.html'); await page.waitForFunction(() => window.__edytor && window.__edytor.D && window.__edytor.M);
const stat0 = await page.evaluate(() => window.__edytor.M.mask.reduce((a, v) => a + v, 0));
// 1. malowanie kafla w trybie Kafle: kafel przy starcie (wolny) staje się zablokowany
await page.locator('[data-m=tiles]').click();
const tile = await page.evaluate(() => { const e = window.__edytor, s = e.D.start, p = e.M.proj.toImage(s[0], s[1]); const c = e.css(p[0], p[1]); const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left + c[0], y: r.top + c[1], k: Math.floor(s[1]) * e.D.cols + Math.floor(s[0]) }; });
await page.mouse.click(tile.x, tile.y);
const blocked = await page.evaluate((k) => window.__edytor.M.mask[k], tile.k); assert.equal(blocked, 1, 'kafel zablokowany ręcznie');
await page.locator('#undo').click(); assert.equal(await page.evaluate((k) => window.__edytor.M.mask[k], tile.k), 0, 'cofnięcie');
await page.mouse.click(tile.x, tile.y);
// 2. nowy obiekt z podstawą (trzy kliknięcia) blokuje kafle pod sobą
await page.locator('[data-m=obj]').click(); await page.getByText('Nowy obiekt').click();
const spot = await page.evaluate(() => { const e = window.__edytor, p = e.M.proj.toImage(5.5, 20.5), c = e.css(p[0], p[1]); const r = document.getElementById('c').getBoundingClientRect(); return { x: r.left + c[0], y: r.top + c[1], k: 20 * e.D.cols + 5 }; });
const before = await page.evaluate((k) => window.__edytor.M.mask[k], spot.k);
for (const [dx, dy] of [[-40, 0], [40, 0], [40, 40], [-40, 40]]) { await page.mouse.click(spot.x + dx, spot.y + dy - 20); }
const nObj = await page.evaluate(() => window.__edytor.D.blocks.length); assert.ok(nObj > 20, 'dodano obiekt');
const foot = await page.evaluate(() => window.__edytor.D.blocks.at(-1).foot.length); assert.equal(foot, 4, '4 punkty podstawy');
// 3. wersja robocza zapisana, gra ją wczytuje
const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('arena.mapdraft.wioska'))); assert.equal(draft.blocks.at(-1).id, 'test_obiekt'); assert.ok(draft.tiles.block.includes(tile.k));
const game = await ctx.newPage(); game.on('pageerror', (e) => errors.push(e.message));
await game.goto('http://127.0.0.1:8165/www/wioska-mapa.html?draft=1'); await game.waitForFunction(() => window.__wioska && window.__wioska.ready);
assert.equal(await game.evaluate((k) => window.__wioska.sc.mask[k], tile.k), 1, 'gra widzi ręczną blokadę z edytora');
assert.equal(await game.evaluate(() => window.__wioska.sc.blocks.at(-1).id), 'test_obiekt');
// 4. oryginał bez wersji roboczej
await page.evaluate(() => localStorage.removeItem('arena.mapdraft.wioska')); const clean = await ctx.newPage(); await clean.goto('http://127.0.0.1:8165/www/wioska-mapa.html'); await clean.waitForFunction(() => window.__wioska && window.__wioska.ready);
assert.equal(await clean.evaluate(() => window.__wioska.sc.blocks.length), nObj - 1, 'oryginał nie ma obiektu z edytora');
assert.deepEqual(errors, [], errors.join('\n')); await browser.close(); server.close(); console.log('e2e edytor: OK');
