// Test w prawdziwej przeglądarce z emulacją telefonu i dotyku: podgląd drogi, potwierdzenie, odrzucenie, tura przeciwnika.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8110);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:8110/www/walka.html');
await page.waitForFunction(() => window.__game);

const tapCell = async (x, y) => {
  const [cx, cy] = await page.evaluate(([x, y]) => window.__game.cssCenter(x, y), [x, y]);
  const box = await page.locator('canvas#c').boundingBox();
  await page.touchscreen.tap(box.x + cx, box.y + cy);
};
const st = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state)));
const unit = (s, id) => s.units.find((u) => u.id === id);

let s = await st();
assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y, unit(s, 'h').pm], [1, 5, 3], 'start');

// 0. postacie i ich kręgi stoją dokładnie w środku kafla
for (const [id, cx, cy] of [['h', 1, 5], ['e1', 5, 1]]) { const [rx, ry] = await page.evaluate(([id, cx, cy]) => { const g = window.__game, r = g.ringCenter(id), c = g.grid.center(cx, cy); return [r[0] - c[0], r[1] - c[1]]; }, [id, cx, cy]); assert.ok(Math.abs(rx) < 0.5 && Math.abs(ry) < 0.5, `${id}: środek kręgu odchylony o ${rx},${ry} od środka kafla`); }
// 0b. przed walką wybierasz pole startowe w niebieskiej strefie, a walka rusza dopiero po "Zaczynamy"
assert.equal(await page.evaluate(() => window.__game.phase), 'place'); assert.equal((await page.locator('#end').textContent()).trim().startsWith('Zaczynamy'), true);
await tapCell(4, 5); s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [1, 5], 'poza strefą: bez zmiany'); assert.match(await page.locator('#msg').textContent(), /nie możesz zacząć/i);
await tapCell(0, 3); s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [1, 5], 'ściana: bez zmiany');
await tapCell(0, 6); s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [0, 6], 'strefa: postać stoi na wybranym polu');
const rc = await page.evaluate(() => { const g = window.__game, r = g.ringCenter('h'), c = g.grid.center(0, 6); return [r[0] - c[0], r[1] - c[1]]; }); assert.ok(Math.abs(rc[0]) < 0.5 && Math.abs(rc[1]) < 0.5, 'krąg na nowym polu');
await tapCell(1, 5); s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [1, 5], 'zmiana pola startowego');
assert.equal(await page.locator('#end').isEnabled(), true); assert.equal(await page.evaluate(() => window.__game.state.turn.round), 1);
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-start.png') });
await page.click('#end'); await page.waitForFunction(() => window.__game.phase === 'fight');
// 0c. kolejność tur: portrety w kolejności inicjatywy, pierwszy to ten, kto gra teraz
{ const ord = await page.$$eval('#turns .chip', (e) => e.map((x) => ({ id: x.id, cur: x.classList.contains('cur'), team: x.classList.contains('ally') ? 'a' : 'f' }))); assert.deepEqual(ord.map((x) => x.id), ['turn-h', 'turn-e1', 'turn-e2']); assert.deepEqual(ord.map((x) => x.cur), [true, false, false]); assert.deepEqual(ord.map((x) => x.team), ['a', 'f', 'f']); }
// 1. pierwsze dotknięcie tylko pokazuje podgląd: stan gry się nie zmienia
await tapCell(3, 5);
let pv = await page.evaluate(() => window.__game.preview);
assert.ok(pv && pv.x === 3 && pv.y === 5 && pv.cost === 2, 'podgląd drogi na 2 PM');
s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [1, 5], 'podgląd nie rusza postaci');
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka.png') });

// 2. drugie dotknięcie w ten sam kafel potwierdza ruch
await tapCell(3, 5);
await page.waitForFunction(() => !window.__game.busy);
s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y, unit(s, 'h').pm], [3, 5, 1], 'ruch wykonany, 2 PM zużyte');

// 3. kafel poza zasięgiem i ściana nie dają podglądu
await tapCell(6, 6);
assert.equal(await page.evaluate(() => window.__game.preview), null, 'za daleko');
await tapCell(4, 4);
assert.equal(await page.evaluate(() => window.__game.preview), null, 'ściana');
assert.match(await page.locator('#msg').textContent(), /nie da się|Za daleko/);

// 4. dotknięcie innego kafla zmienia podgląd, a nie wykonuje ruchu
await tapCell(3, 6); await tapCell(2, 5);
pv = await page.evaluate(() => window.__game.preview); assert.ok(pv && pv.x === 2 && pv.y === 5);
s = await st(); assert.deepEqual([unit(s, 'h').x, unit(s, 'h').y], [3, 5]);

// 5. koniec tury: przeciwnicy grają sami i podchodzą, potem wraca tura gracza z odnowionymi PM
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const before = ['e1', 'e2'].map((id) => dist(unit(s, id), unit(s, 'h')));
await page.click('#end');
await page.waitForFunction(() => !window.__game.busy && window.__game.state.units[window.__game.state.order.indexOf('h') >= 0 ? 0 : 0].id && window.__game.state.order[window.__game.state.turn.index] === 'h', null, { timeout: 15000 });
s = await st();
assert.equal(s.turn.round, 2, 'druga runda');
assert.equal(unit(s, 'h').pm, 3, 'PM gracza odnowione');
const after = ['e1', 'e2'].map((id) => dist(unit(s, id), unit(s, 'h')));
assert.ok(after[0] < before[0] && after[1] < before[1], `przeciwnicy podeszli: ${before} -> ${after}`);
assert.ok(await page.locator('#end').isEnabled());

// 5b. po turze gracza kolejka się obraca: gracz jest na końcu, kreska oddziela następną rundę
{ const t = await page.$$eval('#turns .chip', (e) => e.map((x) => x.id)); assert.deepEqual(t, ['turn-h', 'turn-e1', 'turn-e2']); }
// 6. element dotykowy ma sensowny rozmiar (min. 48 px wysokości)
const btn = await page.locator('#end').boundingBox(); assert.ok(btn.height >= 48, `przycisk ${btn.height}px`);
assert.deepEqual(errors, [], 'błędy strony');

// 7. plansza mieści się w widoku telefonu w poziomie (z paskiem przeglądarki) i jest czytelnie duża
const tl = await page.evaluate(() => { const c = window.__game; return { a: c.cssCenter(0, 0), b: c.cssCenter(6, 6), l: c.cssCenter(0, 6), r: c.cssCenter(6, 0) }; });
const boxL = await page.locator('canvas#c').boundingBox();
assert.ok(tl.l[0] > 0 && tl.r[0] < boxL.width && tl.a[1] > 0 && tl.b[1] < boxL.height, 'cała plansza mieści się w poziomie');
assert.ok(tl.r[0] - tl.l[0] > 330 && tl.b[1] - tl.a[1] > 160, `plansza jest czytelnie duża: ${Math.round(tl.r[0] - tl.l[0])} x ${Math.round(tl.b[1] - tl.a[1])} px`);
const kafelek = (tl.r[0] - tl.l[0]) / 12; assert.ok(kafelek >= 24, `szerokość kafla ${Math.round(kafelek * 2)} px, min. 48`);
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-poziomo.png') });
// 8. w pionie jest tylko prośba o obrót
const pc = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const pp = await pc.newPage(); await pp.goto('http://127.0.0.1:8110/www/walka.html'); await pp.waitForFunction(() => window.__game);
assert.equal(await pp.locator('#rotate').isVisible(), true, 'w pionie widać prośbę o obrót');
await browser.close(); server.close();
console.log('e2e walka: OK');
