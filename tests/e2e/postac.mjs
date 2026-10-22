// Karta postaci: punkty cech i czarów na dotyk, podgląd obrażeń, zapis, trwałość po przeładowaniu i użycie w walce.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';
import * as P from '../../src/game/progression.js';
import { SAVE_KEY } from '../../src/game/save.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8114);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const seed = P.setLevel(P.newCharacter({ name: 'Wiera', classId: 'zalobnik', origin: 'wygnaniec', traits: [], look: { female: true, face: 3, hairStyle: 'long', hair: '#c8c8d0', skin: '#f0c49a', colors: ['#2a2438', '#e07a3a', '#ff9a4a'] } }), 10);
assert.ok(P.validateCharacter(seed));
const ctx = await browser.newContext({ viewport: { width: 960, height: 600 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [SAVE_KEY, JSON.stringify(seed)]);
const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
await page.goto('http://127.0.0.1:8114/www/postac.html'); await page.waitForFunction(() => window.__postac);
const t = (sel) => page.locator(sel).textContent();
const stored = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
const zar = async () => (await t('.dm[data-spell=zar] b'));

// 1. wczytana postać
assert.equal(await t('#who'), 'Wiera'); assert.match(await t('#sub'), /Żałobnik · poziom 10/); assert.equal(await t('#left'), '45'); assert.equal(await t('#php'), '74'); assert.equal(await zar(), '12-16');
// 2. +10 punktów w Ogień: wartość, punkty i podgląd Żaru rosną (12-16 -> 13-17)
for (let i = 0; i < 10; i++) await page.locator('#p-fire').tap();
assert.equal(await t('#v-fire'), '10'); assert.equal(await t('#left'), '35'); assert.equal(await zar(), '13-17');
// 3. do wyczerpania punktów: 45 = +45% (tabela z planu 17-23), plus wyszarzone
for (let i = 0; i < 35; i++) await page.locator('#p-fire').tap();
assert.equal(await t('#v-fire'), '45'); assert.equal(await t('#left'), '0'); assert.equal(await zar(), '17-23'); assert.equal(await page.locator('#p-fire').isDisabled(), true); assert.equal(await page.locator('#p-earth').isDisabled(), true);
// 4. Witalność dodaje życie 1:1; zwrot punktu
await page.locator('#m-fire').tap(); assert.equal(await t('#left'), '1'); await page.locator('#p-vitality').tap(); assert.equal(await t('#php'), '75'); assert.equal(await t('#v-fire'), '44');
let s = await stored(); assert.equal(s.alloc.fire, 44); assert.equal(s.alloc.vitality, 1); assert.match(await t('#note'), /Zapisano/);
// 5. czary: punkty = poziom-1 = 9, ulepszenie Żaru 3 razy kosztuje 1+2+3
await page.locator('#tab-spells').tap(); assert.equal(await t('#sleft'), '9');
for (let i = 0; i < 3; i++) await page.locator('#sp-zar').tap();
assert.equal(await t('#sleft'), '3'); assert.equal(await page.locator('.card[data-spell=zar] .lv').textContent(), '4');
assert.equal(await page.locator('#sp-zar').isDisabled(), true, 'poz. 4->5 kosztuje 4, zostały 3'); assert.match(await t('.card[data-spell=zar]'), /obrażenia 25-33/, 'poz. 4 z 44% ognia: floor(18*1.44)-floor(23*1.44)');
// 6. zdjęcie czaru z paska
await page.locator('#eq-stos').tap(); assert.equal((await stored()).equipped.includes('stos'), false); assert.match(await t('#eq-stos'), /Poza paskiem/);
// 7. przeładowanie: wszystko zostaje
await page.reload(); await page.waitForFunction(() => window.__postac); s = await stored();
assert.deepEqual([s.alloc.fire, s.alloc.vitality, s.spellLevels.zar, s.equipped.length], [44, 1, 4, 2]); assert.equal(await t('#v-fire'), '44'); assert.equal(await t('#left'), '0');
assert.ok(await page.locator('.dm[data-spell=zar]').isVisible(), 'podgląd po przeładowaniu');
// 8. cele dotykowe
const tiny = await page.evaluate(() => [...document.querySelectorAll('.btn,.card .btn')].map((e) => ({ id: e.id || e.textContent, h: e.getBoundingClientRect().height, w: e.getBoundingClientRect().width })).filter((r) => r.h > 0 && (r.h < 44 || r.w < 44)));
assert.deepEqual(tiny, [], 'za małe cele dotykowe');
await page.screenshot({ path: path.join(ROOT, 'docs/podglad/postac.png') });
await page.locator('#tab-spells').tap(); await page.screenshot({ path: path.join(ROOT, 'docs/podglad/postac-czary.png') });
// 9. ta sama postać w walce: statystyki i czary z zapisu
await page.goto('http://127.0.0.1:8114/www/walka.html?scenario=cast'); await page.waitForFunction(() => window.__game);
const h = await page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state.units.find((u) => u.id === 'h'))));
assert.equal(h.name, 'Wiera'); assert.equal(h.maxHp, 75); assert.equal(h.stats.fire, 44); assert.deepEqual(h.spells, [{ id: 'zar', level: 4 }, { id: 'podmuch', level: 1 }], 'wyposażone czary z poziomami');
assert.equal(await page.locator('.slot').count(), 2); await page.locator('#slot-zar').tap(); assert.match(await t('#card'), /obrażenia 25-33/, 'karta czaru w walce zgadza się z kartą postaci');
// 10. zmiana poziomu w dół zwraca punkty
await page.goto('http://127.0.0.1:8114/www/postac.html'); await page.waitForFunction(() => window.__postac);
for (let i = 0; i < 9; i++) await page.locator('#lvm').tap(); assert.equal(await t('#lv'), '1'); s = await stored(); assert.deepEqual(s.alloc, P.emptyAlloc()); assert.equal(s.spellLevels.zar, 1);
assert.equal(await page.locator('#lvm').isDisabled(), true); assert.equal(await t('#left'), '0');
// 11. uszkodzony zapis nie psuje strony
await page.evaluate((k) => localStorage.setItem(k, '{zepsute'), SAVE_KEY); await page.reload(); await page.waitForFunction(() => window.__postac);
assert.match(await t('#note'), /Brak zapisanej postaci/); assert.equal(await t('#who'), 'Tester');
assert.deepEqual(errors, [], 'błędy strony');
await browser.close(); server.close(); console.log('e2e postac: OK');
