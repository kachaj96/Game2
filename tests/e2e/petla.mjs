// Pętla gry w przeglądarce: menu, postać, świat, wejście do lochu, cztery komnaty z nagrodami (XP, poziom), powrót do świata, porażka bez kary.
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
import { newCharacter } from '../../src/game/progression.js';

let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8135);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
const U = (p) => `http://127.0.0.1:8135/www/${p}`;
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('arena.character.v1')));

// 1. menu bez postaci prowadzi do kreatora, z postacią do świata
await page.goto(U('index.html')); await page.waitForSelector('#play');
assert.match(await page.locator('#play').textContent(), /Nowa gra/); assert.match(await page.locator('#play').getAttribute('href'), /kreator\.html/);
const ch = newCharacter({ name: 'Ada', classId: 'zalobnik', look: { face: 1, hairStyle: 'long', hair: '#c8c8d0', skin: '#f0c49a' } });
await page.evaluate((c) => localStorage.setItem('arena.character.v1', JSON.stringify(c)), ch);
await page.goto(U('index.html')); await page.waitForSelector('#play');
assert.match(await page.locator('#play').textContent(), /Graj dalej/); assert.match(await page.locator('#who').textContent(), /Ada/); assert.match(await page.locator('#play').getAttribute('href'), /swiat\.html/);

// 2. świat: pasek poziomu, wejście do lochu otwiera kartę, "Wejdź" zaczyna nowe podejście
await page.goto(U('swiat.html?at=krypta')); await page.waitForFunction(() => window.__swiat);
assert.match(await page.locator('#lvl').textContent(), /poziom 1 · 0\/60 XP/);
await page.evaluate(() => { const s = window.__swiat; s.open ? s.open(0) : null; });
await page.waitForSelector('#card', { state: 'visible', timeout: 5000 }).catch(async () => { const e = await page.evaluate(() => window.__swiat.world.entrances[0].at); const c = await page.evaluate(([x, y]) => window.__swiat.css(x, y), e); await page.touchscreen.tap(c[0], c[1]); await page.waitForSelector('#card', { state: 'visible', timeout: 5000 }); });
const href = await page.locator('#enter').getAttribute('href'); assert.match(href, /new=1&dungeon=korytarze/);
await page.goto(U(href)); await page.waitForFunction(() => window.__game && window.__walka);

// 3. cztery komnaty: boss w ostatniej, XP i poziom rosną, następna komnata po przeładowaniu strony
let info = await page.evaluate(() => window.__walka.info); assert.deepEqual([info.room, info.chambers, info.boss], [1, 4, false]);
let xp0 = 0;
for (let room = 1; room <= 4; room++) {
  info = await page.evaluate(() => window.__walka.info); assert.equal(info.room, room); assert.equal(info.boss, room === 4, 'boss tylko w ostatniej komnacie');
  await page.evaluate(() => window.__walka.finish('victory'));
  await page.waitForSelector('#banner', { state: 'visible' }); const txt = await page.locator('#bx').textContent();
  assert.match(txt, /za tobą\. \+\d+ XP/); const c = await saved(); assert.ok(c.xp > xp0, 'XP w zapisie rośnie'); xp0 = c.xp;
  if (room < 4) { assert.match(await page.locator('#again').textContent(), new RegExp(`Następna komnata \\(${room + 1} z 4\\)`)); await Promise.all([page.waitForNavigation(), page.locator('#again').click()]); await page.waitForFunction(() => window.__game && window.__walka); }
  else { assert.match(txt, /Loch ukończony/); assert.equal(await page.locator('#again').isVisible(), false); }
}
const c4 = await saved(); assert.ok(c4.level >= 3, `poziom po lochu: ${c4.level}`); assert.equal(await page.locator('#sheet').isVisible(), true, 'przy awansie jest przejście do karty postaci');
assert.match(await page.locator('#bx').textContent(), /Nowy poziom/);

// 4. powrót do świata: bohater stoi przy krypcie, pasek pokazuje nowy poziom
await Promise.all([page.waitForNavigation(), page.locator('#world').click()]); await page.waitForFunction(() => window.__swiat);
assert.match(page.url(), /swiat\.html\?at=krypta/); assert.match(await page.locator('#lvl').textContent(), new RegExp(`poziom ${c4.level}`));
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('arena.run.v1'))), null, 'po ukończeniu lochu nie ma otwartego podejścia');

// 5. porażka niczego nie zabiera i pozwala spróbować ponownie tę samą komnatę
await page.goto(U('walka.html?new=1&dungeon=korytarze&level=' + c4.level)); await page.waitForFunction(() => window.__walka);
await page.evaluate(() => window.__walka.finish('defeat')); await page.waitForSelector('#banner', { state: 'visible' });
assert.match(await page.locator('#bx').textContent(), /Nic nie tracisz/); assert.match(await page.locator('#again').textContent(), /Spróbuj jeszcze raz/);
assert.deepEqual([(await saved()).xp, (await saved()).level], [c4.xp, c4.level], 'porażka nie zmienia postaci');
assert.deepEqual(errors, [], errors.join('\n'));
await browser.close(); server.close(); console.log('e2e petla: OK');
