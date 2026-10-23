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
