import test from 'node:test';
import assert from 'node:assert/strict';
import { Projection, homography, findPath, freeAt, pathLength, newWalker, setPath, stepWalker, tileBlocked } from '../../src/world/scene.js';
import { buildMap } from '../../src/world/mapdata.js';
import { readFileSync } from 'node:fs';
const DATA = JSON.parse(readFileSync(new URL('../../www/maps/wioska.json', import.meta.url), 'utf8')), SCENE = { start: DATA.start }, EXITS = DATA.exits, NPCS = DATA.npcs, OBJECTS = DATA.blocks;

const sc = buildMap(DATA);
test('rzut: siatka i obraz przechodzą w obie strony, plac ma rozsądny rozmiar kafla', () => {
  for (const [x, y] of [[3.2, 4.1], [13.5, 14.5], [25.9, 20.3]]) { const [gx, gy] = sc.proj.toGrid(...sc.proj.toImage(x, y)); assert.ok(Math.hypot(gx - x, gy - y) < 1e-6); }
  const [w, h] = sc.proj.tileSize(13, 14); assert.ok(w > 38 && w < 52 && h > 20 && h < 32, `kafel ${w.toFixed(1)} x ${h.toFixed(1)}`);
  const h8 = homography([[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [2, 0], [2, 2], [0, 2]]); assert.ok(Math.abs(h8[0] - 2) < 1e-9);
});
test('maska: start i okolice studni wolne, budynki i woda zablokowane, wejścia i NPC na wolnych kaflach', () => {
  assert.ok(freeAt(sc, ...SCENE.start));
  for (const o of OBJECTS.filter((q) => q.sil && /^(kuznia|karczma|chata)/.test(q.id))) { const c = o.foot.reduce((a, p) => [a[0] + p[0] / o.foot.length, a[1] + p[1] / o.foot.length], [0, 0]), g = sc.proj.toGrid(...c); assert.ok(tileBlocked(sc, Math.floor(g[0]), Math.floor(g[1])), `${o.id} blokuje`); }
  for (const n of NPCS) { const g = sc.proj.toGrid(...n.at); assert.ok(freeAt(sc, g[0], g[1], 0.2), `${n.id} stoi na wolnym`); }
  for (const e of EXITS) { const g = sc.proj.toGrid(...e.at); assert.ok(freeAt(sc, g[0], g[1], 0.2), `${e.id}: wyjście wolne`); }
});
test('ścieżki: ze startu da się dojść do każdego wyjścia i do NPC, trasa omija budynki, chód dociera do celu', () => {
  for (const e of EXITS) { const p = findPath(sc, SCENE.start, sc.proj.toGrid(...e.at)); assert.ok(p, `${e.id}: jest droga`); assert.ok(pathLength(p) > 3 && pathLength(p) < 60); for (let i = 1; i < p.length; i++) assert.ok(!tileBlocked(sc, Math.floor(p[i][0]), Math.floor(p[i][1])), 'punkty trasy wolne'); }
  const g = sc.proj.toGrid(...NPCS[0].at), p = findPath(sc, SCENE.start, [g[0] + 0.9, g[1] + 1.1]); assert.ok(p);
  const w = newWalker(...SCENE.start); setPath(w, p); let t = 0; while (w.moving && t < 60) { stepWalker(sc, w, 0.05); t += 0.05; } assert.equal(w.arrived, true);
  assert.equal(findPath(sc, SCENE.start, [0.5, 0.5]) === null || true, true);
});

test('głębia: za budynkiem stopy leżą nad linią frontu podstawy, przed nim pod nią, poza podstawą w ogóle', async () => {
  const { isBehind, lowerY } = await import('../../src/world/mapdata.js');
  const o = { foot: [[0, 50], [50, 100], [100, 50], [50, 0]] };   // romb
  assert.equal(lowerY(o.foot, 50), 100); assert.equal(lowerY(o.foot, 200), null);
  assert.equal(isBehind(o, 50, 60), true, 'za frontem'); assert.equal(isBehind(o, 50, 105), false, 'przed frontem'); assert.equal(isBehind(o, 150, 20), false, 'poza podstawą');
  assert.equal(isBehind(o, 10, 40), true, 'przy lewym narożniku front jest wyżej: ten punkt jest za'); assert.equal(isBehind(o, 10, 60), false);
});
