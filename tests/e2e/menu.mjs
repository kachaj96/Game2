// Menu i opcje w świecie: przyciski Postać i Menu działają, jakość i pora dnia zapisują się, noc ściemnia ekran, chód ma 8 kierunków.
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
import { newCharacter } from '../../src/game/progression.js';

let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8145);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
const U = (p) => `http://127.0.0.1:8145/www/${p}`;
await page.goto(U('index.html')); await page.evaluate((c) => localStorage.setItem('arena.character.v1', JSON.stringify(c)), newCharacter({ name: 'Ada', classId: 'zalobnik' }));

await page.goto(U('swiat.html')); await page.waitForFunction(() => window.__swiat);
// Menu otwiera panel, opcje zapisują się, Wznów zamyka
await page.locator('#mmenu').tap(); await page.waitForSelector('#pause.on');
await page.locator('#oq button', { hasText: 'Niska' }).tap(); await page.locator('#ot button', { hasText: 'Zawsze noc' }).tap(); await page.locator('#of button', { hasText: 'Wł.' }).tap();
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('arena.settings.v1'))); assert.deepEqual(st, { quality: 'low', time: 'night', fps: true, theme: 'default' });
await page.locator('#presume').tap(); assert.equal(await page.locator('#pause').evaluate((e) => e.classList.contains('on')), false);
await page.waitForTimeout(800); assert.match(await page.locator('#fps').textContent(), /FPS/);
// noc: lewy górny róg ekranu (daleko od światła) jest prawie czarny
const dark = await page.evaluate(() => { const c = document.getElementById('c'), g = c.getContext('2d'), d = g.getImageData(c.width - 40, c.height - 40, 1, 1).data; return d[0] + d[1] + d[2]; });
assert.ok(dark < 90, `noc jest ciemna (${dark})`);
// zapisane ustawienia wracają po przeładowaniu
await page.reload(); await page.waitForFunction(() => window.__swiat); await page.locator('#mmenu').tap(); assert.equal(await page.locator('#oq button.on').textContent(), 'Niska'); await page.locator('#presume').tap();

// 8 kierunków: bohater idzie w osiach i po przekątnych, kierunek wynika z ruchu na ekranie
const dirs = new Set();
for (const [dx, dy] of [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]) {
  await page.evaluate(([dx, dy]) => { const s = window.__swiat; s.hero.x = 80.5; s.hero.y = 100.5; s.hero.dx = dx; s.hero.dy = dy; s.hero.path = [[80.5, 100.5], [80.5 + dx * 3, 100.5 + dy * 3]]; s.hero.i = 1; s.hero.moving = true; }, [dx, dy]);
  await page.waitForTimeout(120); dirs.add(await page.evaluate(() => window.__swiat.face));
}
assert.equal(dirs.size, 8, `kierunki: ${[...dirs]}`);

// Postać prowadzi do karty postaci z powrotem do świata
await page.locator('#mchar').tap(); await page.waitForURL(/postac\.html/); assert.match(page.url(), /back=swiat\.html/);
assert.match(await page.locator('#tofight').textContent(), /Do świata/);
assert.deepEqual(errors, [], errors.join('\n'));
await browser.close(); server.close(); console.log('e2e menu: OK');
