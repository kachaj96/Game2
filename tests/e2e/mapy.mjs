// Podgląd mapy v3: ładuje się, bohater idzie A*, nie wchodzi w obiekty, przejście na krawędzi działa.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
const server = await startServer(8091), browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 860, height: 340 }, deviceScaleFactor: 2, hasTouch: true });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:8091/mapy/podglad.html'); await page.waitForFunction(() => window.__podglad);
const P = () => page.evaluate(() => ({ x: window.__podglad.hero.x, y: window.__podglad.hero.y, dir: window.__podglad.hero.dir, left: window.__podglad.hero.path.length }));
assert.ok(await page.evaluate(() => window.__podglad.go(12, 6)));
await page.waitForFunction(() => window.__podglad.hero.path.length === 0, null, { timeout: 15000 });
let p = await P(); assert.ok(Math.abs(p.x - 12.5) < 0.05 && Math.abs(p.y - 6.5) < 0.05, 'doszedł do celu');
// kolizje: w obrys chaty, drzewa i skrzyni nie da się wejść, tuż obok można
const col = await page.evaluate(() => { const M = window.__podglad.M; return { chata: M.blocked(8, 2), drzewo: M.blocked(2, 8), skrzynia: M.blocked(7, 10), obok: M.blocked(10, 4), droga: M.blocked(5, 5) }; });
assert.deepEqual(col, { chata: true, drzewo: true, skrzynia: true, obok: false, droga: false });
// ścieżka omija chatę: z lewej strony na prawą nie przechodzi przez jej kafle
const path = await page.evaluate(() => { const M = window.__podglad.M, pp = M.findPath([4, 2], [11, 2]); return pp && pp.every(([x, y]) => !M.blocked(x, y)); });
assert.ok(path);
// przejście na krawędzi: kafle po prawej prowadzą do mapy docelowej
const ex = await page.evaluate(() => { const M = window.__podglad.M; const c = M.iso.cells().filter(([x, y]) => M.exitAt(x, y)); return { n: c.length, to: M.exitAt(...c[0]) }; });
assert.ok(ex.n > 4 && ex.to.map === 'las');
// dotyk w zablokowany kafel nie rusza bohatera
const before = await P(); const box = await page.evaluate(() => { const v = window.__podglad.view(), M = window.__podglad.M, [sx, sy] = M.iso.center(7, 1); return [v.ox + sx * v.z, v.oy + sy * v.z]; });
await page.touchscreen.tap(box[0], box[1]); await page.waitForTimeout(200); const after = await P(); assert.equal(after.left, 0); assert.ok(Math.abs(after.x - before.x) < 0.01);
// przejścia: z mapy pilot na wschodniej krawędzi do mapy las, i z powrotem, bez zapętlenia
assert.equal(await page.evaluate(() => window.__podglad.map), 'pilot');
const goEdge = async (cx, cy) => { await page.evaluate(([x, y]) => window.__podglad.go(x, y), [cx, cy]); await page.waitForFunction(() => window.__podglad.busy === true, null, { timeout: 20000 }); await page.waitForFunction(() => window.__podglad.busy === false, null, { timeout: 5000 }); };
const exitCell = await page.evaluate(() => { const M = window.__podglad.M; return M.iso.cells().find(([x, y]) => M.exitAt(x, y) && !M.blocked(x, y)); });
await goEdge(...exitCell);
let w = await page.evaluate(() => ({ map: window.__podglad.map, x: window.__podglad.hero.x, y: window.__podglad.hero.y }));
assert.equal(w.map, 'las'); assert.equal(await page.evaluate(() => window.__podglad.ground), 'podloze_las_zastepcze', 'mapa las ma własne podłoże'); assert.ok(Math.abs(w.x - 3.5) < 0.1 && Math.abs(w.y - 10.5) < 0.1, 'pojawił się przy zachodniej krawędzi');
await page.waitForTimeout(600); assert.equal(await page.evaluate(() => window.__podglad.map), 'las', 'strefa przybycia nie odbija z powrotem');
const back = await page.evaluate(() => { const M = window.__podglad.M; return M.iso.cells().find(([x, y]) => M.exitAt(x, y) && !M.blocked(x, y)); });
await goEdge(...back); w = await page.evaluate(() => ({ map: window.__podglad.map })); assert.equal(w.map, 'pilot');
await page.screenshot({ path: new URL('../../docs/podglad/mapa-v3.png', import.meta.url).pathname });
assert.deepEqual(errs, []); await browser.close(); server.close(); console.log('e2e mapy: OK');
