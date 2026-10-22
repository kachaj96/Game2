// Kreator postaci w przeglądarce z emulacją telefonu: wybór klasy, wygląd, imię, przeszłość, cechy, zapis bohatera.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8111);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
await page.goto('http://127.0.0.1:8111/www/kreator.html');
await page.waitForFunction(() => window.__kreator);
const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__kreator.state)));
const tap = (id) => page.locator('#' + id).tap();

let s = await S(); assert.equal(s.classId, 'grabarz');
// 1. klasa: zmiana przywraca domyślne kolory klasy
await tap('cls-tropiciel'); s = await S(); assert.equal(s.classId, 'tropiciel'); assert.deepEqual(s.colors, ['#3f5a3c', '#8a6a2a', '#2a2a30']);
await tap('cls-zalobnik'); s = await S(); assert.equal(s.classId, 'zalobnik');
// 2. wygląd trafia do specyfikacji, której używa rysowanie
await tap('female'); await tap('face-4'); await tap('hair-braids'); await tap('hc-7'); await tap('sk-4');
let sp = await page.evaluate(() => window.__kreator.spec());
assert.equal(sp.female, true); assert.equal(sp.face.scar, true); assert.equal(sp.hairStyle, 'braids'); assert.equal(sp.hair, '#a8381e'); assert.equal(sp.skin, '#8a5a38');
// 3. kolory: wybrany slot, potem odcień
await tap('slot-1'); await tap('sc-3'); s = await S(); assert.equal(s.colors[1], '#7a2a2a'); assert.equal(s.colors[0], '#2a2438', 'inne sloty bez zmian');
sp = await page.evaluate(() => window.__kreator.spec()); assert.equal(sp.outfit.trim, '#7a2a2a');
// 4. imię: pisanie nie przebudowuje panelu, losowanie zmienia imię i wygląd
await page.locator('#nm').fill('Zbyszko Cichy'); s = await S(); assert.equal(s.name, 'Zbyszko Cichy');
const before = await page.evaluate(() => JSON.stringify(window.__kreator.spec())); await tap('rnd'); s = await S();
assert.notEqual(s.name, 'Zbyszko Cichy'); assert.notEqual(await page.evaluate(() => JSON.stringify(window.__kreator.spec())), before);
await page.locator('#nm').fill('Wiera');
// 5. cechy: dwie, trzecia odrzucona z komunikatem, odznaczenie działa
await tap('tr-twardy'); await tap('tr-szybki'); await tap('tr-cichy');
s = await S(); assert.deepEqual(s.traits, ['twardy', 'szybki']); assert.match(await page.locator('#msg').textContent(), /Maksymalnie 2/);
await tap('tr-twardy'); await tap('tr-cichy'); s = await S(); assert.deepEqual(s.traits, ['szybki', 'cichy']);
// 6. przeszłość z punktem czaru widoczna w podsumowaniu
await tap('org-2'); assert.match(await page.locator('#sum').textContent(), /Punkty czaru 1/);
// 7. obrót i chód
await tap('right'); assert.equal((await S()).dir, 1); await tap('left'); await tap('left'); assert.equal((await S()).dir, 3); await tap('walk'); assert.equal((await S()).walk, true);
// 8. zapis bohatera: statystyki zgodne z danymi klasy, przeszłości i cech
await tap('go'); const hero = await page.evaluate(() => window.__kreator.hero);
assert.equal(hero.name, 'Wiera'); assert.equal(hero.classId, 'zalobnik'); assert.equal(hero.origin, 'uczen'); assert.deepEqual(hero.traits, ['szybki', 'cichy']);
assert.deepEqual([hero.stats.pa, hero.stats.pm], [6, 3]);
assert.equal(hero.stats.hp, 38 - 4); assert.equal(hero.stats.initiative, 28 + 5); assert.equal(hero.stats.agility, 3); assert.equal(hero.stats.power, -2); assert.equal(hero.stats.spellPoints, 1);
assert.equal(hero.look.role, 'mage'); assert.equal(JSON.parse(JSON.stringify(hero)).look.hat.kind, 'veilhat', 'wygląd klasy przetrwał zapis');
// 9. przewijanie panelu nie wraca na górę po wyborze (regresja)
await page.evaluate(() => { document.getElementById('opts').scrollTop = 400; }); const top0 = await page.evaluate(() => document.getElementById('opts').scrollTop);
await tap('tr-szybki'); const top1 = await page.evaluate(() => document.getElementById('opts').scrollTop); assert.ok(top0 > 100 && top1 > 100, `scrollTop ${top0} -> ${top1}`);
// 10. cele dotykowe nie są za małe
const tiny = await page.evaluate(() => [...document.querySelectorAll('.btn,.card,.th,.sw,.org')].map((e) => ({ id: e.id, h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width })).filter((r) => r.h > 0 && (r.h < 38 || r.w < 38)));
assert.deepEqual(tiny, [], 'za małe cele dotykowe');
await page.evaluate(() => { document.getElementById('opts').scrollTop = 0; });
await tap('walk'); await page.evaluate(() => { window.__kreator.state.dir = 0; }); await page.waitForTimeout(120);
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/kreator.png') });

// 11. pion: bez poziomego przewijania
const pc = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const pp = await pc.newPage(); await pp.goto('http://127.0.0.1:8111/www/kreator.html'); await pp.waitForFunction(() => window.__kreator);
assert.ok(await pp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'brak poziomego przewijania w pionie');
await pp.screenshot({ path: path.join(ROOT, 'docs/podglad/kreator-pion.png') });
assert.deepEqual(errors, [], 'błędy strony');
await browser.close(); server.close(); console.log('e2e kreator: OK');
