import test from 'node:test';
import assert from 'node:assert/strict';
import { IsoGrid, TW, TH, distance, depth, byDepth } from '../../src/grid.js';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('siatka: ekran i siatka są wzajemnie odwracalne', () => {
  const g = new IsoGrid(12, 12, { x: 500, y: 90 });
  for (let i = 0; i < 400; i++) {
    const gx = (i * 7.31) % 13 - 0.5, gy = (i * 3.77) % 13 - 0.5;
    const [sx, sy] = g.toScreen(gx, gy), [bx, by] = g.toGrid(sx, sy);
    assert.ok(near(bx, gx) && near(by, gy), `${gx},${gy}`);
  }
});

test('siatka: kafel ma proporcje 2:1 i wymiary TW x TH', () => {
  const g = new IsoGrid(4, 4);
  const [top, right, bottom, left] = g.corners(1, 1);
  assert.equal(right[0] - left[0], TW);
  assert.equal(bottom[1] - top[1], TH);
  assert.equal(top[0], bottom[0]);
  assert.equal(left[1], right[1]);
});

test('siatka: środek komórki wraca do tej samej komórki, a punkty w rogach nie wychodzą poza nią', () => {
  const g = new IsoGrid(9, 7, { x: 300, y: 40 });
  for (let x = 0; x < 9; x++) for (let y = 0; y < 7; y++) {
    const [cx, cy] = g.center(x, y);
    assert.deepEqual(g.cellAt(cx, cy), { x, y });
    // punkty blisko każdego rogu, ale w środku rombu, mają należeć do tej komórki
    for (const [dx, dy] of [[0.02, 0.02], [0.98, 0.02], [0.98, 0.98], [0.02, 0.98]]) {
      const [sx, sy] = g.toScreen(x + dx, y + dy);
      assert.deepEqual(g.cellAt(sx, sy), { x, y });
    }
  }
});

test('siatka: poza planszą cellAt zwraca null', () => {
  const g = new IsoGrid(5, 5, { x: 0, y: 0 });
  assert.equal(g.cellAt(...g.toScreen(-0.5, 2)), null);
  assert.equal(g.cellAt(...g.toScreen(2, 5.2)), null);
  assert.equal(g.cellAt(...g.toScreen(5.01, 0.5)), null);
});

test('siatka: sąsiednie komórki dzielą krawędź, a romby wypełniają płaszczyznę bez dziur', () => {
  const g = new IsoGrid(6, 6, { x: 0, y: 0 });
  const a = g.corners(2, 2), b = g.corners(3, 2), c = g.corners(2, 3);
  assert.deepEqual([a[1], a[2]], [b[0], b[3]], 'prawa krawędź (x) jest lewą krawędzią sąsiada w osi x');
  assert.deepEqual([a[2], a[3]], [c[1], c[0]], 'dolna krawędź jest górną sąsiada w osi y');
});

test('siatka: kierunek x idzie w prawo-dół, y w lewo-dół', () => {
  const g = new IsoGrid(4, 4);
  const [x0, y0] = g.toScreen(0, 0), [x1, y1] = g.toScreen(1, 0), [x2, y2] = g.toScreen(0, 1);
  assert.deepEqual([x1 - x0, y1 - y0], [TW / 2, TH / 2]);
  assert.deepEqual([x2 - x0, y2 - y0], [-TW / 2, TH / 2]);
});

test('siatka: blokowanie, sąsiedzi i granice', () => {
  const g = new IsoGrid(3, 3);
  assert.equal(g.neighbors(1, 1).length, 4);
  g.block(2, 1); g.block(1, 0);
  assert.deepEqual(g.neighbors(1, 1).map((c) => `${c.x},${c.y}`).sort(), ['0,1', '1,2']);
  assert.equal(g.neighbors(0, 0).length, 1, 'róg: jeden wolny sąsiad (1,0 zablokowane)');
  assert.ok(g.isBlocked(-1, 0) && g.isBlocked(3, 0), 'poza planszą liczy się jak blokada');
  g.toggle(2, 1); assert.ok(g.walkable(2, 1));
  g.toggle(5, 5); // poza planszą: bez efektu i bez błędu
  assert.equal(g.blocked.size, 1);
  assert.equal(distance({ x: 0, y: 0 }, { x: 2, y: 3 }), 5);
});

test('siatka: głębokość rośnie ku widzowi, więc sortowanie rysuje dalsze obiekty pierwsze', () => {
  const list = [{ gx: 5, gy: 5 }, { gx: 1, gy: 2 }, { gx: 4, gy: 1 }].map((o) => ({ ...o, depth: depth(o.gx, o.gy) }));
  list.sort(byDepth);
  assert.deepEqual(list.map((o) => o.depth), [3, 5, 10]);
  const g = new IsoGrid(8, 8);
  assert.ok(g.toScreen(2, 2)[1] < g.toScreen(5, 5)[1], 'większa głębokość to niżej na ekranie');
});

test('siatka: ramka ekranowa obejmuje wszystkie rogi planszy', () => {
  const g = new IsoGrid(10, 6, { x: 400, y: 50 }), b = g.screenBounds();
  for (const [x, y] of [[0, 0], [10, 0], [10, 6], [0, 6]]) { const [sx, sy] = g.toScreen(x, y); assert.ok(sx >= b.minX && sx <= b.maxX && sy >= b.minY && sy <= b.maxY); }
});
