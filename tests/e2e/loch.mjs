// Tryb lochu w przeglądarce: skład wrogów z composeEncounter, poziom przycięty do pasma, wrogowie Kopacze rysowani i grający wg swoich profili.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';
import { composeEncounter } from '../../src/game/encounter.js';
import { enemyHp } from '../../src/game/enemies.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8115);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const open = async (query) => {
  const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:8115/www/walka.html?${query}`); await page.waitForFunction(() => window.__game); return { page, errors, ctx };
};
const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__game.state)));

// 1. poziom wrogów przycięty do pasma lochu (2 do 6), skład zgodny z generatorem, motyw lochu
{
  const { page, errors, ctx } = await open('dungeon=korytarze&level=20&seed=7');
  const g = await page.evaluate(() => window.__game.dungeon); assert.deepEqual([g.id, g.heroLevel, g.enemyLevel], ['korytarze', 20, 6], 'bohater 20, wrogowie przycięci do 6');
  assert.match(g.advice, /słabsi/); assert.match(await page.locator('#msg').textContent(), /Podziemne Korytarze, komnata 1 z 4: wrogowie mają poziom 6/);
  const s = await S(page), foes = s.units.filter((u) => u.team === 'wrog'), spec = composeEncounter(7, 6, 0);
  assert.deepEqual(foes.map((u) => u.kind), spec.map((x) => x.kind), 'skład z composeEncounter');
  for (const f of foes) assert.equal(f.maxHp, enemyHp(f.kind, 6), `${f.kind}: HP z poziomu 6`);
  assert.ok(foes.length >= 2 && foes.length <= 4, 'solo maks. 4 wrogów'); assert.equal((await page.$$('#turns .chip')).length, foes.length + 1, 'kolejka tur z portretami wrogów');
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/loch-start.png') });
  await ctx.close(); assert.deepEqual(errors, []);
}
// 2. poniżej pasma bohater trafia na wrogów silniejszych od siebie
{ const { page, ctx } = await open('dungeon=korytarze&level=1&seed=2'); const g = await page.evaluate(() => window.__game.dungeon); assert.deepEqual([g.heroLevel, g.enemyLevel], [1, 2]); assert.match(g.advice, /silniejsi/); await ctx.close(); }
// 3. kompan to dodatkowy wróg: ten sam seed, +2 kompanów = +2 wrogów
{ const a = await open('dungeon=korytarze&level=4&seed=3'), b = await open('dungeon=korytarze&level=4&seed=3&companions=2'); const n = async (x) => (await S(x.page)).units.filter((u) => u.team === 'wrog').length; assert.equal(await n(b), (await n(a)) + 2); await a.ctx.close(); await b.ctx.close(); }
// 4. walka z wrogami Kopaczami: start, tury wrogów wg profili, bez błędów strony, aż do wyniku albo kilku rund
{
  const { page, errors, ctx } = await open('dungeon=korytarze&level=3&seed=5&time=0');
  await page.click('#end'); await page.waitForFunction(() => window.__game.phase === 'fight');
  for (let i = 0; i < 6; i++) {
    const r = await page.evaluate(() => window.__game.state.result); if (r) break;
    await page.waitForFunction(() => !window.__game.busy && window.__game.state.order[window.__game.state.turn.index] === 'h' || window.__game.state.result, null, { timeout: 30000 });
    if (await page.evaluate(() => window.__game.state.result)) break;
    await page.click('#end');
  }
  await page.waitForFunction(() => !window.__game.busy || window.__game.state.result, null, { timeout: 30000 });
  const s = await S(page), foes = s.units.filter((u) => u.team === 'wrog'); assert.ok(s.turn.round >= 2 || s.result, 'walka toczy się'); assert.ok(foes.some((f) => f.x !== undefined));
  assert.ok(s.log.some((c) => c.unit !== 'h'), 'wrogowie wykonali komendy');
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/loch-walka.png') });
  await ctx.close(); assert.deepEqual(errors, []);
}
// 5. boss: Król Kopców z dodatkami, widoczny w kolejce, wezwanie dokłada wroga bez błędu rysowania
{
  const { page, errors, ctx } = await open('dungeon=korytarze&level=5&seed=4&boss=1&time=0');
  const s = await S(page); assert.equal(s.units.find((u) => u.id === 'e1').kind, 'krol'); assert.equal(s.units.find((u) => u.id === 'e1').boss, true); assert.ok(s.units.filter((u) => u.team === 'wrog').length <= 3, 'solo: boss i maks. 2 dodatki');
  await page.click('#end'); await page.waitForFunction(() => window.__game.phase === 'fight');
  for (let i = 0; i < 5; i++) { if (await page.evaluate(() => window.__game.state.result)) break; await page.waitForFunction(() => (!window.__game.busy && window.__game.state.order[window.__game.state.turn.index] === 'h') || window.__game.state.result, null, { timeout: 30000 }); if (await page.evaluate(() => window.__game.state.result)) break; await page.click('#end'); }
  await page.waitForFunction(() => !window.__game.busy || window.__game.state.result, null, { timeout: 30000 });
  const s2 = await S(page); assert.ok(s2.units.some((u) => u.id.startsWith('s')) || s2.units.find((u) => u.id === 'e1').cooldowns.wezwanie !== undefined || s2.result, 'boss wzywa pomocnika albo walka skończona');
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/loch-boss.png') });
  await ctx.close(); assert.deepEqual(errors, []);
}
await browser.close(); server.close(); console.log('e2e loch: OK');
