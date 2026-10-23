// Świat w przeglądarce z emulacją telefonu: chodzenie dotykiem (podgląd, potwierdzenie), kamera, wzgórza, NPC i wejście do lochu.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../../tools/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const server = await startServer(8125);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const open = async (q = '') => {
  const ctx = await browser.newContext({ viewport: { width: 860, height: 340 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:8125/www/swiat.html${q}`); await page.waitForFunction(() => window.__swiat, null, { timeout: 30000 }); await page.waitForTimeout(500);
  const tapAt = async (gx, gy) => { const [cx, cy] = await page.evaluate(([x, y]) => window.__swiat.css(x, y), [gx, gy]); await page.touchscreen.tap(cx, cy); };
  const hero = () => page.evaluate(() => ({ x: window.__swiat.hero.x, y: window.__swiat.hero.y, moving: window.__swiat.hero.moving }));
  const idle = () => page.waitForFunction(() => !window.__swiat.hero.moving, null, { timeout: 40000 });
  return { ctx, page, tapAt, hero, idle };
};

// 1. start w wiosce, region i poziom w nagłówku
{
  const { ctx, page, tapAt, hero, idle } = await open();
  assert.equal(await page.locator('#reg').textContent(), 'Kopiec');
  const h0 = await hero();
  // 2. jedno dotknięcie wysyła bohatera od razu (jak w Dofusie), bez podglądu i potwierdzania
  await tapAt(h0.x + 5, h0.y - 1); await page.waitForFunction(() => window.__swiat.hero.moving, null, { timeout: 3000 }); await idle();
  const h1 = await hero(); assert.ok(Math.hypot(h1.x - (h0.x + 5), h1.y - (h0.y - 1)) < 0.8, `doszedł: ${JSON.stringify(h1)}`);
  // 3. przytrzymanie palca prowadzi bohatera za palcem, a puszczenie zatrzymuje po dojściu do ostatniego celu
  { const c = await page.evaluate(([x, y]) => window.__swiat.css(x, y), [h1.x - 5, h1.y + 1]); const hb = await hero();
    await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.waitForTimeout(900);
    const during = await hero(); assert.ok(during.moving, 'idzie za przytrzymanym palcem'); assert.ok(Math.hypot(during.x - hb.x, during.y - hb.y) > 1.5, 'przesunął się w stronę palca');
    await page.mouse.up(); await idle(); }
  // 4. kamera jedzie za bohaterem: jego pozycja na ekranie jest blisko środka
  await page.waitForTimeout(1200);
  const sc = await page.evaluate(() => { const s = window.__swiat; return { c: s.css(s.hero.x, s.hero.y), w: innerWidth, h: innerHeight }; });
  assert.ok(Math.abs(sc.c[0] - sc.w / 2) < 40 && Math.abs(sc.c[1] - sc.h / 2) < 70, `bohater na środku ekranu: ${sc.c}`);
  // 5. miejsce, do którego nie da się dojść (za przepaścią), daje komunikat zamiast trasy
  await page.evaluate(() => { const s = window.__swiat; s.hero.x = 140; s.hero.y = 150; });
  // 6. przybliżanie i oddalanie
  const z0 = await page.evaluate(() => window.__swiat.zoom); await page.locator('#zin').tap(); assert.ok((await page.evaluate(() => window.__swiat.zoom)) > z0); await page.locator('#zout').tap(); await page.locator('#zout').tap(); assert.ok((await page.evaluate(() => window.__swiat.zoom)) < z0);
  await ctx.close();
}

// 7. NPC: dotknięcie, podejście, wypowiedź
{
  const { ctx, page, tapAt, idle } = await open();
  const n = await page.evaluate(() => window.__swiat.world.npcs.find((x) => x.id === 'karczmarz').at);
  await page.evaluate((n) => { const s = window.__swiat; s.hero.x = n[0] + 3; s.hero.y = n[1] + 3; }, n); await page.waitForTimeout(1500);
  await tapAt(n[0], n[1]); await page.waitForFunction(() => window.__swiat.marker && window.__swiat.marker.kind === 'npc', null, { timeout: 3000 }); await idle(); await page.waitForSelector('#bubble', { state: 'visible', timeout: 5000 });
  assert.match(await page.locator('#bubble').textContent(), /Do areny schodzi się przez cmentarz/);
  await ctx.close();
}

// 8. wzgórze i krypta: bohater stoi wyżej niż w wiosce, wejście otwiera kartę lochu z zalecanym poziomem
{
  const { ctx, page, tapAt, idle } = await open('?at=krypta');
  const zs = await page.evaluate(() => { const s = window.__swiat; return { up: s.wv.pos(s.hero.x, s.hero.y)[1], down: s.wv.pos(...s.world.start)[1] }; });
  const e = await page.evaluate(() => window.__swiat.world.entrances[0].at);
  assert.equal(await page.locator('#reg').textContent(), 'Cmentarne Wzgórze');
  await tapAt(e[0], e[1]); await idle(); await page.waitForSelector('#card', { state: 'visible', timeout: 5000 });
  const card = await page.locator('#card').textContent(); assert.match(card, /Podziemne Korytarze/); assert.match(card, /Zalecany poziom 3/); assert.match(card, /pasmo 2 do 6/); assert.match(card, /Twój poziom: 1/); assert.match(card, /Poniżej pasma/);
  const href = await page.locator('#enter').getAttribute('href'); assert.match(href, /walka\.html\?dungeon=korytarze&theme=kopacze/);
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/swiat-krypta.png') });
  await page.locator('#stay').tap(); assert.equal(await page.evaluate(() => window.__swiat.card), 'none');
  await ctx.close();
}

// 9. kolejne wejście w lesie i poziom z zapisanej postaci
{
  const { ctx, page, tapAt, idle } = await open('?at=jama');
  await page.evaluate(() => localStorage.setItem('arena.character.v1', JSON.stringify({ v: 1, name: 'T', classId: 'zalobnik', level: 8, alloc: { vitality: 0, earth: 0, fire: 0, water: 0, air: 0 }, spellLevels: { zar: 1 }, equipped: ['zar'], origin: 'syn_kopca', traits: [], look: {} })));
  await page.reload(); await page.waitForFunction(() => window.__swiat); await page.waitForTimeout(400);
  assert.equal(await page.locator('#reg').textContent(), 'Las Robali');
  const e = await page.evaluate(() => window.__swiat.world.entrances[1].at);
  await tapAt(e[0], e[1]); await idle(); await page.waitForSelector('#card', { state: 'visible', timeout: 5000 });
  const card = await page.locator('#card').textContent(); assert.match(card, /Gniazdo/); assert.match(card, /owady i pajęczaki/); assert.match(card, /Zalecany poziom 8/); assert.match(card, /Twój poziom: 8/); assert.match(card, /mieści się w paśmie/); assert.match(card, /jeszcze zamknięty/); assert.equal(await page.locator('#enter').count(), 0, 'zamknięty loch nie ma przycisku Wejdź');
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad/swiat-las.png') });
  await ctx.close();
}

// 10. w pionie tylko prośba o obrót
{
  const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8125/www/swiat.html'); await page.waitForFunction(() => window.__swiat, null, { timeout: 30000 });
  assert.equal(await page.locator('#rotate').isVisible(), true); await ctx.close();
}
assert.deepEqual(errors, [], 'błędy strony');
await browser.close(); server.close(); console.log('e2e swiat: OK');
