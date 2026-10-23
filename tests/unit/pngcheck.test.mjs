import test from 'node:test';
import assert from 'node:assert/strict';
import '../../mapy/src/pngcheck.js';
const { analyze } = globalThis.PngCheck;

const img = (W, H, fill = [0, 0, 0, 0]) => { const a = new Uint8ClampedArray(W * H * 4); for (let i = 0; i < W * H; i++) a.set(fill, i * 4); return { a, W, H }; };
const inPoly = (p, x, y) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const fillPoly = (im, p, col) => { for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (inPoly(p, x + .5, y + .5)) im.a.set(col, (y * im.W + x) * 4); };
// bryła izometryczna w skali 2x: odcisk w x d kafli, wysokość hj w j, lewa ściana ciemna, prawa jasna
function box({ w = 1, d = 1, hj = 64, margin = 12, tilt = 1, bg = [0, 0, 0, 0], left = [70, 60, 50, 255], right = [190, 170, 150, 255], shadow = false } = {}) {
  const k = 36 * tilt, W = (w + d) * 72 + margin * 2, H = Math.ceil(hj * 2 + (w + d) * k + margin * 2), im = img(W, H, bg);
  const S = [margin + w * 72, H - margin], L = [S[0] - w * 72, S[1] - w * k], R = [S[0] + d * 72, S[1] - d * k], B = [L[0] + R[0] - S[0], L[1] + R[1] - S[1]], u = hj * 2, up = (p) => [p[0], p[1] - u];
  if (shadow) fillPoly(im, [S, [S[0] + 90, S[1] + 0], [S[0] + 90, S[1] - 40], [S[0] - 90, S[1] - 40], [S[0] - 90, S[1]]], [0, 0, 0, 120]);
  fillPoly(im, [S, L, up(L), up(S)], left); fillPoly(im, [S, R, up(R), up(S)], right); fillPoly(im, [up(S), up(L), up(B), up(R)], [225, 210, 190, 255]);
  return im;
}
const run = (im, o) => analyze(im.a, im.W, im.H, o);
const lv = (r, id) => r.checks.find((c) => c.id === id)?.level;

test('poprawna bryła 1x1 z alfą przechodzi wszystkie testy', () => {
  const r = run(box(), { kind: 'bryla', w: 1, d: 1, hj: 64 });
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter((c) => c.level !== 'ok')));
  for (const id of ['alfa', 'margines', 'rzut', 'proporcje', 'swiatlo', 'cien']) assert.equal(lv(r, id), 'ok', id);
});

test('rzut: za płaska albo za stroma podstawa jest odrzucana', () => {
  assert.equal(lv(run(box({ tilt: 0.6 }), { kind: 'bryla' }), 'rzut'), 'fail');
  assert.equal(lv(run(box({ tilt: 1.5 }), { kind: 'bryla' }), 'rzut'), 'fail');
});

test('skala: obiekt dwa razy za wysoki to błąd', () => {
  assert.equal(lv(run(box({ hj: 128 }), { kind: 'bryla', w: 1, d: 1, hj: 64 }), 'proporcje'), 'fail');
  const big = run(box({ w: 1, d: 1, hj: 64 }), { kind: 'bryla', w: 1, d: 1, hj: 64 }); assert.equal(lv(big, 'proporcje'), 'ok');
});

test('margines: obiekt przy krawędzi pliku', () => {
  assert.equal(lv(run(box({ margin: 0 }), { kind: 'bryla' }), 'margines'), 'fail');
  assert.equal(lv(run(box({ margin: 4 }), { kind: 'bryla' }), 'margines'), 'warn');
});

test('światło: lewa jaśniejsza od prawej daje ostrzeżenie', () => {
  assert.equal(lv(run(box({ left: [200, 180, 160, 255], right: [60, 50, 40, 255] }), { kind: 'bryla' }), 'swiatlo'), 'warn');
});

test('cień pod obiektem jest wykrywany', () => {
  assert.equal(lv(run(box({ shadow: true }), { kind: 'bryla' }), 'cien'), 'warn');
});

test('tło #FF00FF: ostrzeżenie, ale reszta testów liczona po wycięciu', () => {
  const r = run(box({ bg: [255, 0, 255, 255] }), { kind: 'bryla', w: 1, d: 1, hj: 64 });
  assert.equal(lv(r, 'alfa'), 'warn'); assert.equal(lv(r, 'rzut'), 'ok'); assert.equal(lv(r, 'margines'), 'ok'); assert.equal(r.ok, true);
});

test('szachownica w tle to fałszywa przezroczystość', () => {
  const im = box({ bg: [255, 255, 255, 255] }); for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) { const i = (y * im.W + x) * 4; if (im.a[i + 3] === 255 && im.a[i] === 255 && im.a[i + 1] === 255) im.a.set(((x >> 3) + (y >> 3)) % 2 ? [204, 204, 204, 255] : [255, 255, 255, 255], i); }
  const r = run(im, { kind: 'bryla' }); assert.equal(lv(r, 'alfa'), 'fail'); assert.equal(r.ok, false);
});

test('pełne tło niemagentowe bez alfy to błąd', () => {
  assert.equal(lv(run(box({ bg: [40, 90, 40, 255] }), { kind: 'bryla' }), 'alfa'), 'fail');
});

test('za duży plik', () => {
  const im = img(1100, 300); fillPoly(im, [[100, 100], [900, 100], [900, 200], [100, 200]], [200, 0, 0, 255]);
  assert.equal(lv(run(im, { kind: 'okragly' }), 'rozmiar'), 'fail');
});

test('podłoże: winieta i rozmycie', () => {
  const W = 400, H = 300, im = img(W, H, [120, 140, 90, 255]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dd = Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2)), v = Math.max(0.3, 1 - dd * 0.7), n = ((x * 7 + y * 13) % 9) * 6; im.a.set([(120 + n) * v, (140 + n) * v, (90 + n) * v, 255], (y * W + x) * 4); }
  const r = run(im, { kind: 'podloze' }); assert.equal(lv(r, 'winieta'), 'warn'); assert.equal(lv(r, 'rozmiar2'), 'warn');
  const flat = run(img(400, 300, [120, 140, 90, 255]), { kind: 'podloze' }); assert.equal(lv(flat, 'ostrosc'), 'warn'); assert.equal(lv(flat, 'winieta'), 'ok');
});
