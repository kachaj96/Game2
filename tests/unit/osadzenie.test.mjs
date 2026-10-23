import test from 'node:test';
import assert from 'node:assert/strict';
import { shadowMask, groundLine, LIGHT } from '../../src/art/osadzenie.js';
const solid = (w, h, x0, x1, y0, y1) => { const a = new Uint8ClampedArray(w * h); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[y * w + x] = 255; return a; };
const extent = (m) => { let minX = m.w, maxX = 0, maxY = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.data[y * m.w + x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } return { minX, maxX, maxY }; };

test('światło z lewej góry: cień słupa pada w prawo i w stronę widza, proporcjonalnie do wysokości', () => {
  assert.ok(LIGHT.kx > 0 && LIGHT.ky > 0);
  const w = 20, h = 100, m = shadowMask(solid(w, h, 8, 12, 0, h), w, h), e = extent(m);
  assert.equal(m.ox, 0, 'cień nie wystaje w lewo'); assert.ok(e.maxX > 11 + 0.3 * h, 'długość w prawo ' + e.maxX); assert.ok(e.maxY > h - 1 + 0.1 * h, 'schodzi ku widzowi ' + e.maxY);
  const short = extent(shadowMask(solid(w, 50, 8, 12, 0, 50), w, 50)); assert.ok(short.maxX < e.maxX - 8, 'niższy słup, krótszy cień');
});
test('światło z prawej (kx ujemne): cień pada w lewo i wystaje poza sprite', () => {
  const w = 20, h = 100, m = shadowMask(solid(w, h, 8, 12, 0, h), w, h, { kx: -0.5 }), e = extent(m);
  assert.ok(m.ox > 0.4 * h); assert.ok(e.maxX <= m.ox + 12 + 2, 'nic na prawo od słupa');
});
test('podstawa bryły (corner) wychodzi od zarysu, środek (center) od najniższego piksela', () => {
  const w = 40, h = 40, a = new Uint8ClampedArray(w * h);
  for (let x = 0; x < w; x++) { const yb = h - 1 - Math.abs(x - 20); for (let y = 0; y <= yb; y++) a[y * w + x] = 255; }
  const gl = groundLine(a, w, h, 'corner'); assert.equal(gl[20], h - 1); assert.equal(gl[0], h - 21); assert.ok(groundLine(a, w, h, 'center').every((v) => v === h - 1));
});
