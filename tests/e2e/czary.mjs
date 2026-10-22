// Rzucanie czarów dotykiem: wybór czaru, podgląd celu, potwierdzenie, linia widzenia, śmierć i grób, koniec walki.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8112);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const open = async (scenario) => {
  const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:8112/www/walka.html?scenario=${scenario}`); await page.waitForFunction(() => window.__game);
  const tapCell = async (x, y) => { const [cx, cy] = await page.evaluate(([x, y]) => window.__game.cssCenter(x, y), [x, y]); const b = await page.locator('canvas#c').boundingBox(); await page.touchscreen.tap(b.x + cx, b.y + cy); };
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state)));
  const idle = () => page.waitForFunction(() => !window.__game.busy, null, { timeout: 15000 });
  return { page, tapCell, S, idle };
};
const unit = (s, id) => s.units.find((u) => u.id === id);

// --- scenariusz "cast": mag (2,4), strażnik (5,4) z 22 życia, czysta linia ---
{
  const { page, tapCell, S, idle } = await open('cast');
  // pasek skrótów: Żar gotowy, Podmuch gotowy, Stos jeszcze nie działa
  const st = (id) => page.locator('#slot-' + id).getAttribute('data-state');
  assert.equal(await st('zar'), 'ready'); assert.equal(await st('podmuch'), 'ready'); assert.equal(await st('stos'), 'soon');
  const btn = await page.locator('#slot-zar').boundingBox(); assert.ok(btn.height >= 44 && btn.width >= 44, `ikona czaru ${btn.width}x${btn.height}px`);

  await page.locator('#slot-zar').tap(); assert.equal(await page.evaluate(() => window.__game.selSpell), 'zar');
  assert.match(await page.locator('#card').textContent(), /Żar \(Ogień\) · 3 PA · zasięg 2-6, widoczność/);
  assert.deepEqual(await page.evaluate(() => window.__game.targets('zar')), [{ x: 5, y: 4 }], 'jedyny cel w zasięgu i widoczny');
  // pierwsze dotknięcie celu: tylko podgląd, bez zmiany stanu
  await tapCell(5, 4); let pv = await page.evaluate(() => window.__game.preview);
  assert.ok(pv && pv.kind === 'cast' && pv.lo === 12 && pv.hi === 16 && pv.known === false, 'odporność nieodkryta: podgląd nie zdradza -20%'); assert.match(await page.locator('#card').textContent(), /odporność nieznana/); assert.equal(unit(await S(), 'e1').hp, 22);
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-czar.png') });
  // drugie potwierdza: obrażenia w widełkach, 3 PA zużyte, wybór czaru zdjęty
  await tapCell(5, 4); await idle(); let s = await S(); const dmg = 22 - unit(s, 'e1').hp;
  assert.ok(dmg >= 14 && dmg <= 19, `obrażenia ${dmg}`); assert.equal(unit(s, 'h').pa, 3); assert.equal(await page.evaluate(() => window.__game.selSpell), null);
  assert.deepEqual(s.known, { e1: { fire: -20 } }, 'po trafieniu odkryta odporność na ogień');
  // drugi rzut zabija (22 życia, min 24 obrażeń łącznie): grób na kaflu, zwycięstwo
  await page.locator('#slot-zar').tap(); await tapCell(5, 4); assert.match(await page.locator('#card').textContent(), /obrażenia 14-19 \(odporność -20%\)/, 'po odkryciu podgląd uwzględnia odporność'); await tapCell(5, 4); await page.waitForFunction(() => window.__game.state.result === 'victory', null, { timeout: 15000 }); await page.waitForSelector('#banner', { state: 'visible' });
  s = await S(); assert.equal(unit(s, 'e1').hp, 0); assert.deepEqual(s.graves, [{ x: 5, y: 4, unit: 'e1' }]); assert.equal(s.result, 'victory');
  assert.equal(await page.locator('#banner').isVisible(), true); assert.match(await page.locator('#bt').textContent(), /Zwycięstwo/);
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-zwyciestwo.png') });
  await page.locator('#again').tap(); await page.waitForFunction(() => window.__game.state.result === null);
  assert.equal(unit(await S(), 'e1').hp, 22, 'Jeszcze raz zaczyna od nowa');
}

// --- scenariusz "wall": ściana na linii rzutu, brak celów ---
{
  const { page, tapCell, S } = await open('wall');
  await page.locator('#slot-zar').tap();
  assert.deepEqual(await page.evaluate(() => window.__game.targets('zar')), [], 'ściana zasłania wroga');
  // zasięg pokazuje też pola zasłonięte (tam nie trafisz) i to, co zasłania widok
  const rg = await page.evaluate(() => window.__game.range('zar')); const key = (a) => a.map((c) => `${c.x},${c.y}`).sort();
  assert.deepEqual(key(rg.blockers), ['3,4'], 'ściana oznaczona jako zasłona');
  assert.ok(key(rg.hidden).includes('5,4') && key(rg.hidden).includes('4,4'), 'pola za ścianą oznaczone jako zasłonięte');
  assert.ok(!key(rg.hidden).includes('1,2') && key(rg.inRange).includes('1,2'), 'pole z wolną linią widzenia normalnie w zasięgu');
  assert.match(await page.locator('#msg').textContent(), /zasłonięty/i, 'legenda czerwonych pól');
  const under = await page.evaluate(() => { const r = document.getElementById('card').getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2).id; });
  assert.equal(under, 'c', 'karta czaru nie przechwytuje dotknięć (pod nią jest plansza)');
  await tapCell(5, 4); assert.match(await page.locator('#msg').textContent(), /nie widzisz celu/i);
  assert.equal(await page.evaluate(() => window.__game.preview), null); assert.equal(unit(await S(), 'e1').hp, 22);
  assert.equal(unit(await S(), 'h').pa, 6, 'nieudana próba nie kosztuje PA');
  // anulowanie wyboru czaru ponownym dotknięciem
  await page.locator('#slot-zar').tap(); assert.equal(await page.evaluate(() => window.__game.selSpell), null);
}

// --- scenariusz "default": wróg rzuca czar i rani bohatera, tura wraca do gracza ---
{
  const { page, S, idle } = await open('default');
  // doprowadź strażników do bohatera: kilka tur bez ruchu gracza
  for (let i = 0; i < 4; i++) { await page.locator('#end').tap(); await page.waitForFunction(() => !window.__game.busy && window.__game.state.order[window.__game.state.turn.index] === 'h' || window.__game.state.result, null, { timeout: 20000 }); if ((await S()).result) break; }
  const s = await S(); const h = unit(s, 'h');
  assert.ok(h.hp < h.maxHp, `strażnicy zranili bohatera: ${h.hp}/${h.maxHp}`);
  assert.ok(s.units.filter((u) => u.team === 'wrog').every((u) => u.hp === u.maxHp), 'bohater nie atakował');
}
// --- scenariusz "push": Grabarz odpycha strażnika o 2 kafle, ściana zatrzymuje go po 1 i zadaje obrażenia ---
{
  const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:8112/www/walka.html?scenario=push&hero=grabarz'); await page.waitForFunction(() => window.__game);
  const tapCell = async (x, y) => { const [cx, cy] = await page.evaluate(([x, y]) => window.__game.cssCenter(x, y), [x, y]); const b = await page.locator('canvas#c').boundingBox(); await page.touchscreen.tap(b.x + cx, b.y + cy); };
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state)));
  // Grabarz ma trzy czary; Dół (pułapka) jeszcze nie działa, Zrzut Ziemi i Cios tak
  assert.equal(await page.locator('#slot-dol').getAttribute('data-state'), 'soon'); assert.equal(await page.locator('#slot-zrzut_ziemi').getAttribute('data-state'), 'ready');
  await page.locator('#slot-zrzut_ziemi').tap();
  assert.deepEqual((await page.evaluate(() => window.__game.targets('zrzut_ziemi'))), [{ x: 4, y: 4 }], 'cel w linii i w zasięgu');
  await tapCell(4, 4); await tapCell(4, 4); await page.waitForFunction(() => !window.__game.busy, null, { timeout: 15000 });
  const s = await S(), e = unit(s, 'e1');
  assert.deepEqual([e.x, e.y], [5, 4], 'odepchnięty o 1 kafel i zatrzymany ścianą');
  const lost = 22 - e.hp; assert.ok(lost >= 4 + 4 && lost <= 5 + 4, `obrażenia czaru (6-8 po odporności Ziemi +30% to 4-5) plus kolizja 4: ${lost}`);
  assert.equal(unit(s, 'h').pa, 3); assert.equal(unit(s, 'h').cooldowns.zrzut_ziemi, 4, 'odnowienie 3 tury: wartość 4 na starcie');
  assert.equal(await page.locator('#slot-zrzut_ziemi').getAttribute('data-state'), 'cooldown:4', 'czar w odnowieniu: 4 tury do powrotu');
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/walka-odpychanie.png') });
}
assert.deepEqual(errors, [], 'błędy strony');
await browser.close(); server.close(); console.log('e2e czary: OK');
