// Pasek skrótów przy wielu czarach: strony, przesunięcie palcem, karta czaru, karta wroga z odkrywaniem odporności, kolory żywiołów.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8113);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
await page.goto('http://127.0.0.1:8113/www/walka.html?scenario=cast&spells=all'); await page.waitForFunction(() => window.__game);
const tapCell = async (x, y) => { const [cx, cy] = await page.evaluate(([x, y]) => window.__game.cssCenter(x, y), [x, y]); const b = await page.locator('canvas#c').boundingBox(); await page.touchscreen.tap(b.x + cx, b.y + cy); };
const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state)));
const ids = () => page.$$eval('.slot', (els) => els.map((e) => e.id.replace('slot-', '')));
const swipe = (dx) => page.evaluate((dx) => { const bar = document.getElementById('bar'), r = bar.getBoundingClientRect(), x0 = r.left + r.width / 2, y = r.top + r.height / 2, ev = (t, x) => bar.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 1, bubbles: true, pointerType: 'touch' })); ev('pointerdown', x0); ev('pointermove', x0 + dx / 2); ev('pointermove', x0 + dx); ev('pointerup', x0 + dx); }, dx);

// 1. osiem czarów: 3 z klasy i 5 testowych, dwie strony
let list = await ids(); assert.equal(list.length, 6, 'strona 1: 6 ikon'); assert.equal(await page.locator('#pgi').textContent(), '1/2');
assert.equal(await page.locator('#prev').isDisabled(), true); assert.equal(await page.locator('#next').isDisabled(), false);
assert.deepEqual(list, ['zar', 'podmuch', 'stos', 'lzy_zaloby', 'kamienny_calun', 'plonacy_belt']);
// 2. następna strona przyciskiem
await page.locator('#next').tap(); list = await ids(); assert.deepEqual(list, ['szron', 'wicher']); assert.equal(await page.locator('#pgi').textContent(), '2/2'); assert.equal(await page.evaluate(() => window.__game.page), 1);
assert.equal(await page.locator('#next').isDisabled(), true, 'ostatnia strona');
// 3. przesunięcie palcem po pasku: w prawo wraca, w lewo idzie dalej, a przesunięcie nie wybiera czaru
await swipe(120); assert.equal(await page.evaluate(() => window.__game.page), 0); assert.equal(await page.evaluate(() => window.__game.selSpell), null, 'swipe nie wybiera czaru');
await swipe(-120); assert.equal(await page.evaluate(() => window.__game.page), 1); await swipe(120);
// 4. wybór czaru testowego z drugiej strony i karta czaru z żywiołem
await page.locator('#slot-lzy_zaloby').tap(); assert.equal(await page.evaluate(() => window.__game.selSpell), 'lzy_zaloby');
let card = await page.locator('#card').textContent(); assert.match(card, /Łzy Żałoby \(Woda\) · 3 PA · zasięg 2-5, widoczność/); assert.match(card, /obrażenia 11-15/);
assert.match(await page.locator('#card b').getAttribute('style'), /#5ab0ff/i, 'kolor nazwy czaru = kolor żywiołu Wody');
// 5. karta wroga: wszystkie odporności nieznane na początku
await page.locator('#slot-lzy_zaloby').tap(); // anuluj wybór
await tapCell(5, 4); let foe = page.locator('#foe'); assert.equal(await foe.isVisible(), true); assert.match(await foe.textContent(), /Strażnik 22\/22/);
assert.equal(await page.locator('#foe .r').count(), 5); assert.deepEqual(await page.$$eval('#foe .r span', (e) => e.map((x) => x.textContent)), ['?', '?', '?', '?', '?'], 'nic nie odkryte');
// 6. pierwsze trafienie wodą odkrywa odporność na wodę (0%) i tylko ją
await page.locator('#slot-lzy_zaloby').tap(); await tapCell(5, 4); await tapCell(5, 4); await page.waitForFunction(() => !window.__game.busy, null, { timeout: 15000 });
let s = await S(); assert.deepEqual(s.known, { e1: { water: 0 } }); const hp1 = s.units.find((u) => u.id === 'e1').hp; assert.ok(hp1 >= 22 - 15 && hp1 <= 22 - 11, `woda 11-15, hp ${hp1}`);
await tapCell(5, 4); assert.deepEqual(await page.$$eval('#foe .r', (e) => e.map((x) => `${x.dataset.el}:${x.querySelector('span').textContent}`)), ['earth:?', 'fire:?', 'water:0%', 'air:?', 'neutral:?']);
// 7. wybór Żaru wraca na stronę 1, podgląd nie zdradza odporności na ogień, po trafieniu -20% jest odkryte
await page.locator('#next').tap(); await page.locator('#slot-szron').waitFor(); assert.equal(await page.evaluate(() => window.__game.page), 1);
await page.locator('#prev').tap(); await page.locator('#slot-zar').tap(); assert.equal(await page.evaluate(() => window.__game.page), 0);
await tapCell(5, 4); card = await page.locator('#card').textContent(); assert.match(card, /odporność nieznana/); assert.match(await page.locator('#foe').textContent(), /\?/);
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-pasek.png') });
await tapCell(5, 4); await page.waitForFunction(() => window.__game.state.result === 'victory' || !window.__game.busy, null, { timeout: 15000 });
s = await S(); assert.equal(s.known.e1.fire, -20, 'odkryta słabość na ogień'); assert.equal(s.known.e1.water, 0);
assert.ok(s.units.find((u) => u.id === 'e1').hp < hp1, 'Żar zranił wroga');
// 8. stan ikony po wydaniu PA: Żar rzucony, PA 0, pozostałe czary niedostępne
assert.equal(s.units.find((u) => u.id === 'h').pa, 0);
const states = await page.$$eval('.slot', (e) => e.map((x) => x.dataset.state)); assert.ok(states.every((x) => ['soon', 'noPa', 'wait'].includes(x)), `brak PA: ${states}`);
assert.deepEqual(errors, [], 'błędy strony');
await browser.close(); server.close(); console.log('e2e pasek: OK');
