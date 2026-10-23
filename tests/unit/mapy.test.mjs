import test from 'node:test';
import assert from 'node:assert/strict';
import { Iso, TW, TH, footprintCells, byDepth } from '../../mapy/src/iso.js';
import { buildMap } from '../../mapy/src/mapdata.js';

const def = () => ({
  id: 't', size: [768, 512], origin: [384, 20],
  sprites: { chata: { footprint: { w: 3, d: 3 }, height: 140 }, brama: { footprint: { w: 3, d: 1 }, height: 100, free: [[-2, -1]] } },
  objects: [{ sprite: 'chata', x: 10, y: 10 }],
  exits: [{ cells: [[2, 12], [3, 12]], to: { map: 'las', x: 20, y: 5 } }],
  levels: { '5,5': 1, '6,5': 1, '7,5': 2 }, ramps: [[5, 4]],
});

test('izometria 30 stopni: kafel 72 x 42, przeliczenie w obie strony', () => {
  assert.equal(TW, 72); assert.equal(TH, 42);
  const g = new Iso({ ox: 100, oy: 50 });
  assert.deepEqual(g.toScreen(1, 0), [100 + 36, 50 + 21]); assert.deepEqual(g.toScreen(0, 1), [100 - 36, 50 + 21]);
  for (const [x, y, z] of [[3.5, 7.25, 0], [10, 2, 1], [0.1, 0.9, 2]]) { const [sx, sy] = g.toScreen(x, y, z), [a, b] = g.toGrid(sx, sy, z); assert.ok(Math.abs(a - x) < 1e-9 && Math.abs(b - y) < 1e-9); }
  assert.equal(g.toScreen(2, 2, 1)[1], 50 + 84 - 42);
});

test('siatka jest przycięta do prostokąta mapy i wypełnia go', () => {
  const g = new Iso({ ox: 384, oy: 20, w: 768, h: 512 }), c = g.cells();
  assert.ok(c.length > 150); for (const [x, y] of c) assert.ok(g.inside(x, y));
  assert.ok(!c.some(([x, y]) => g.center(x, y)[0] > 768));
});

test('odcisk obiektu blokuje kafle za rogiem S, nic poza nim', () => {
  assert.equal(footprintCells(10, 10, 3, 3).length, 9);
  const m = buildMap(def());
  assert.ok(m.blocked(9, 9) && m.blocked(7, 7) && m.blocked(7, 9)); assert.ok(!m.blocked(10, 10) && !m.blocked(6, 7));
});

test('wolny kafel odcisku (łuk bramy) przepuszcza', () => {
  const d = def(); d.objects = [{ sprite: 'brama', x: 10, y: 10 }]; const m = buildMap(d);
  assert.ok(m.blocked(9, 9)); assert.ok(!m.blocked(8, 9));
});

test('A*: omija chatę, nie ścina rogów, nie wchodzi w blok', () => {
  const m = buildMap(def()), p = m.findPath([4, 8], [12, 10]);
  assert.ok(p && p.length > 5); for (const [x, y] of p) assert.ok(!m.blocked(x, y));
  for (let i = 1; i < p.length; i++) { const dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1]; assert.ok(Math.abs(dx) <= 1 && Math.abs(dy) <= 1); if (dx && dy) { assert.ok(!m.blocked(p[i - 1][0] + dx, p[i - 1][1])); assert.ok(!m.blocked(p[i - 1][0], p[i - 1][1] + dy)); } }
  assert.equal(m.findPath([4, 8], [9, 9]), null);
});

test('wysokości: poziom +1 tylko przez rampę, +2 to klif', () => {
  const m = buildMap(def());
  assert.ok(!m.stepOk(4, 5, 5, 5)); assert.ok(m.stepOk(5, 4, 5, 5));   // z rampy na poziom 1
  assert.ok(m.stepOk(5, 5, 6, 5)); assert.ok(!m.stepOk(6, 5, 7, 5));   // 1 -> 2 bez rampy
});

test('wyjście na krawędzi zwraca cel przejścia', () => {
  const m = buildMap(def());
  assert.deepEqual(m.exitAt(2, 12), { map: 'las', x: 20, y: 5 }); assert.equal(m.exitAt(5, 5), null);
});

test('sortowanie głębi: bohater przed chatą gdy jest bliżej widza, za nią gdy dalej', () => {
  const m = buildMap(def()), front = { id: 'h', x: 11, y: 11 }, back = { id: 'h', x: 6, y: 6 };
  const order = (hero) => m.drawOrder([hero]).map((o) => o.kind || 'hero');
  assert.deepEqual(order(front), ['object', 'hero']); assert.deepEqual(order(back), ['hero', 'object']);
});

import { shadowMask, sunkMask, groundLine, LIGHT } from '../../mapy/src/osadzenie.js';
const solid = (w, h, x0, x1, y0, y1) => { const a = new Uint8ClampedArray(w * h); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[y * w + x] = 255; return a; };

test('cień: słup rzuca cień w prawo i w stronę widza, proporcjonalny do wysokości', () => {
  const w = 20, h = 100, a = solid(w, h, 8, 12, 0, h), m = shadowMask(a, w, h, { base: 'center', kx: 0.55 });
  let maxX = 0, maxY = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.data[y * m.w + x]) { maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  assert.ok(maxX > 11 + 0.5 * h && maxX < 12 + 0.6 * h + 3, 'długość w prawo ' + maxX);   // koniec cienia około 0,55 wysokości od słupa
  assert.ok(maxY >= h - 1 + 0.2 * h, 'cień schodzi poniżej podstawy ku widzowi ' + maxY);
  const short = shadowMask(solid(w, 50, 8, 12, 0, 50), w, 50, { base: 'center', kx: 0.55 }); let sx = 0; for (let y = 0; y < short.h; y++) for (let x = 0; x < short.w; x++) if (short.data[y * short.w + x]) sx = Math.max(sx, x);
  assert.ok(sx < maxX - 10, 'niższy słup, krótszy cień');
});

test('cień: pod podstawą bryły (corner) wychodzi od zarysu podstawy, nie od najniższego piksela', () => {
  const w = 40, h = 40, a = new Uint8ClampedArray(w * h);   // bryła z podstawą w kształcie V: najniżej w środku
  for (let x = 0; x < w; x++) { const yb = h - 1 - Math.abs(x - 20); for (let y = 0; y <= yb; y++) a[y * w + x] = 255; }
  const gl = groundLine(a, w, h, 'corner'); assert.equal(gl[20], h - 1); assert.equal(gl[0], h - 21);
  assert.ok(groundLine(a, w, h, 'center').every((v) => v === h - 1));
});

test('osadzenie: trawa nachodzi tylko na dolny pas, najmocniej przy gruncie', () => {
  const w = 30, h = 60, a = solid(w, h, 5, 25, 0, h), m = sunkMask(a, w, h, { band: 12 });
  assert.equal(m[0 * w + 10], 0); assert.equal(m[(h - 20) * w + 10], 0);
  assert.ok(m[(h - 1) * w + 10] > m[(h - 6) * w + 10] && m[(h - 6) * w + 10] > 0);
  assert.equal(m[(h - 1) * w + 2], 0, 'poza sylwetką bez maski');
});

test('cień domyślnie pada w lewo (światło z prawej góry, jasna prawa ściana) i w stronę widza', () => {
  assert.ok(LIGHT.kx < 0 && LIGHT.ky > 0);
  const w = 20, h = 100, a = solid(w, h, 8, 12, 0, h), m = shadowMask(a, w, h, { base: 'center', kx: -0.55 });
  let minX = m.w, maxX = 0, maxY = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.data[y * m.w + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  assert.ok(m.ox > 0.5 * h, 'cień wystaje w lewo poza sprite: ' + m.ox);
  assert.ok(minX < m.ox + 8 - 0.5 * h + 3, 'koniec cienia po lewej: ' + minX);
  assert.ok(maxX <= m.ox + 12 + 2, 'nic na prawo od słupa: ' + maxX);
  assert.ok(maxY > h, 'cień schodzi ku widzowi');
});

import { validateMap } from '../../mapy/src/walidacja.js';
test('walidacja: poprawna mapa przechodzi, błędne przypadki są nazwane', () => {
  const d = def(); d.start = [4.5, 8.5]; const sp = def().sprites;
  const ok = validateMap(d, sp); assert.ok(!ok.some((c) => c.level === 'fail'), JSON.stringify(ok));
  const noStart = def(); delete noStart.start; assert.ok(validateMap(noStart, sp).some((c) => c.level === 'fail' && /start/i.test(c.msg)));
  const blockedStart = def(); blockedStart.start = [8.5, 8.5]; assert.ok(validateMap(blockedStart, sp).some((c) => c.level === 'fail' && /zablokowanym/.test(c.msg)));
  const noTarget = def(); noTarget.start = [4.5, 8.5]; noTarget.exits[0].to.map = ''; assert.ok(validateMap(noTarget, sp).some((c) => /nie ma mapy docelowej/.test(c.msg)));
  const walled = def(); walled.start = [4.5, 8.5]; walled.blocked = []; for (let x = -5; x < 30; x++) walled.blocked.push([x, 10]); assert.ok(validateMap(walled, sp).some((c) => c.level === 'fail' && /nie da się dojść/.test(c.msg)));
  const overlap = def(); overlap.start = [4.5, 8.5]; overlap.objects.push({ sprite: 'chata', x: 11, y: 11 }); assert.ok(validateMap(overlap, sp).some((c) => /nakładają/.test(c.msg)));
  const bad = def(); bad.objects = [{ sprite: 'nieistnieje', x: 1, y: 1 }]; assert.ok(validateMap(bad, sp).some((c) => c.level === 'fail'));
});

import { resolveExit, validateWorld } from '../../mapy/src/swiat.js';
const world = () => { const a = def(), b = def(); a.id = 'a'; b.id = 'b'; a.start = [4.5, 8.5]; b.start = [4.5, 8.5]; a.exits = [{ cells: [[2, 12]], to: { map: 'b', x: 4, y: 8 } }]; b.exits = [{ cells: [[3, 12]], to: { map: 'a', x: 4, y: 8 } }]; return { a, b }; };
test('przejście: cel musi istnieć i być wolnym kaflem w mapie', () => {
  const m = world(), sp = def().sprites;
  const ok = resolveExit(m, { map: 'b', x: 4, y: 8 }, sp); assert.deepEqual(ok.pos, [4.5, 8.5]);
  assert.ok(resolveExit(m, { map: 'zzz', x: 1, y: 1 }, sp).error); assert.ok(resolveExit(m, { map: 'b', x: 9, y: 9 }, sp).error, 'zablokowany kafel');
  assert.ok(resolveExit(m, { map: 'b', x: 900, y: 900 }, sp).error, 'poza mapą');
});
test('świat: spójny zestaw przechodzi, braki są nazwane', () => {
  const sp = def().sprites, m = world(); assert.deepEqual(validateWorld(m, sp, 'a').filter((c) => c.level === 'fail'), []);
  const noBack = world(); noBack.b.exits = []; assert.ok(validateWorld(noBack, sp, 'a').some((c) => /z powrotem/.test(c.msg)));
  const lone = world(); lone.c = { ...def(), id: 'c', start: [4.5, 8.5], exits: [] }; assert.ok(validateWorld(lone, sp, 'a').some((c) => /nie jest osiągalna/.test(c.msg)));
  const bad = world(); bad.a.exits[0].to.map = 'x'; assert.ok(validateWorld(bad, sp, 'a').some((c) => c.level === 'fail' && /Nie ma mapy/.test(c.msg)));
  const onExit = world(); onExit.a.exits[0].to = { map: 'b', x: 3, y: 12 }; assert.ok(validateWorld(onExit, sp, 'a').some((c) => /strefie przejścia/.test(c.msg)));
});

test('walidacja: podłoże musi istnieć w bibliotece', () => {
  const d = def(); d.start = [4.5, 8.5]; d.ground = 'x'; const sp = def().sprites;
  assert.ok(validateMap(d, sp, ['x']).every((c) => c.level !== 'fail')); assert.ok(validateMap(d, sp, ['y']).some((c) => c.level === 'fail' && /Podłoże/.test(c.msg)));
  delete d.ground; assert.ok(validateMap(d, sp, ['y']).some((c) => c.level === 'warn' && /podłoża/.test(c.msg)));
  assert.ok(validateMap(d, sp).every((c) => !/odłoż/.test(c.msg)), 'bez listy podłoży nie sprawdza');
});
