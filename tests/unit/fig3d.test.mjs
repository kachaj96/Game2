import test from 'node:test';
import assert from 'node:assert/strict';
import { camera, v3, hit, ell, box, cyl, rod, renderRGBA } from '../../src/art/fig3d.js';
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const M = { col: [200, 200, 200] };

test('kamera: osie są ortonormalne, R x U = V, wysokość patrzenia zgodna z kątem', () => {
  for (const yaw of [0, 45, 135, -90]) { const c = camera(yaw, 30); assert.ok(near(v3.len(c.R), 1) && near(v3.len(c.U), 1) && near(v3.len(c.V), 1)); assert.ok(near(v3.dot(c.R, c.U), 0) && near(v3.dot(c.R, c.V), 0) && near(v3.dot(c.U, c.V), 0)); const x = v3.cross(c.R, c.U); assert.ok(near(x[0], c.V[0]) && near(x[1], c.V[1]) && near(x[2], c.V[2])); assert.ok(near(c.V[1], Math.sin(Math.PI / 6))); }
});
test('kula, pudełko i walec: trafienia i normalne', () => {
  const o = [0, 0, 100], d = [0, 0, -1];
  let q = hit(ell([0, 0, 0], [10, 10, 10], M), o, d); assert.ok(near(q.t, 90) && near(q.n[2], 1));
  q = hit(box([0, 0, 0], [5, 5, 5], M), o, d); assert.ok(near(q.t, 95) && near(q.n[2], 1));
  q = hit(cyl([0, 0, 0], [4, 6, 4], M), o, d); assert.ok(near(q.t, 96) && near(q.n[2], 1), 'bok walca');
  q = hit(cyl([0, 0, 0], [4, 6, 4], M), [0, 100, 0], [0, -1, 0]); assert.ok(near(q.t, 94) && near(q.n[1], 1), 'wieczko walca');
  assert.equal(hit(ell([0, 0, 0], [10, 10, 10], M), [30, 0, 100], d), null); assert.equal(hit(box([0, 0, 0], [5, 5, 5], M), [30, 0, 100], d), null);
  q = hit(box([0, 0, 0], [5, 5, 5], M), [0, 0, -100], [0, 0, 1]); assert.ok(near(q.n[2], -1), 'wejście od tyłu');
  q = hit(rod([0, -10, 0], [0, 10, 0], 3, M), [100, 0, 0], [-1, 0, 0]); assert.ok(near(q.t, 97), 'walec wzdłuż osi y');
});
test('render: kula ma kontur, jaśniejszą lewą stronę (światło z lewej góry) i jest deterministyczna', () => {
  const parts = [ell([0, 20, 0], [14, 14, 14], { col: [180, 180, 180] })], o = { w: 80, h: 80, ppu: 1, feet: [40, 60], yaw: 0, elev: 30 };
  const a = renderRGBA(parts, o), b = renderRGBA(parts, o), px = (r, x, y) => r.data[(y * r.w + x) * 4];
  assert.deepEqual(a.data, b.data); assert.equal(a.data[3], 0, 'róg przezroczysty'); const cy = 60 - 20 * Math.cos(Math.PI / 6) | 0;
  assert.equal(a.data[(cy * 80 + 40) * 4 + 3], 255, 'środek pełny'); assert.ok(px(a, 33, cy) > px(a, 47, cy) + 10, 'lewa strona jaśniejsza od prawej');
  assert.ok(px(a, 40, cy) > 60, 'wnętrze nie jest czarne');
});
test('render: obrót obiektu zmienia obraz, a kula obraca się bez zmiany', () => {
  const o = { w: 120, h: 120, ppu: 1, feet: [60, 100], elev: 30 }, tall = [box([14, 40, 0], [6, 40, 6], { col: [200, 120, 60] }), ell([-14, 40, 0], [10, 10, 10], { col: [60, 120, 200] })];
  const a = renderRGBA(tall, { ...o, yaw: 0 }), b = renderRGBA(tall, { ...o, yaw: 90 }); assert.notDeepEqual(a.data, b.data);
  const sph = [ell([0, 30, 0], [12, 12, 12], { col: [150, 150, 150] })], s0 = renderRGBA(sph, { ...o, yaw: 0 }), s1 = renderRGBA(sph, { ...o, yaw: 70 });
  let diff = 0; for (let i = 0; i < s0.data.length; i += 4) diff += Math.abs(s0.data[i] - s1.data[i]); assert.ok(diff / (s0.w * s0.h) < 2, 'światło stałe w kamerze, więc kula wygląda tak samo');
});

import { grabarzParts, renderGrabarz } from '../../src/art/grabarz3d.js';
import { heroSpec } from '../../src/art/classes.js';
test('Grabarz: render 4 kierunków i chodu, różne kierunki i klatki dają różne obrazy, wysokość postaci mieści się w ramce', () => {
  const sp = heroSpec('grabarz', { seed: 3 }), imgs = ['SE', 'SW', 'NE', 'NW'].map((dir) => renderGrabarz(sp, { dir }));
  for (const im of imgs) { let n = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) n++; assert.ok(n > 3000 && n < 20000, 'sylwetka niepusta i nie za duża: ' + n); }
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.notDeepEqual(imgs[i].data, imgs[j].data);
  const f = [0, 0.25, 0.5, 0.75].map((t) => renderGrabarz(sp, { dir: 'SE', t })); assert.notDeepEqual(f[0].data, f[1].data); assert.notDeepEqual(f[0].data, renderGrabarz(sp, { dir: 'SE' }).data);
  assert.deepEqual(renderGrabarz(sp, { dir: 'SW', t: 0.3 }).data, renderGrabarz(sp, { dir: 'SW', t: 0.3 }).data, 'deterministyczny');
  assert.ok(grabarzParts(sp, {}).length > 40);
});
test('Grabarz: kreator działa (płeć, skóra, broda zmieniają obraz)', () => {
  const a = renderGrabarz(heroSpec('grabarz', { seed: 3, female: false, beard: 'full' }), { dir: 'SE' }), b = renderGrabarz(heroSpec('grabarz', { seed: 3, female: true }), { dir: 'SE' }), c = renderGrabarz(heroSpec('grabarz', { seed: 3, skin: '#5e3c26' }), { dir: 'SE' });
  assert.notDeepEqual(a.data, b.data); assert.notDeepEqual(b.data, c.data);
});
