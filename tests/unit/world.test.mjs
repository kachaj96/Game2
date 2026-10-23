import test from 'node:test';
import assert from 'node:assert/strict';
import { noise2, fbm } from '../../src/world/noise.js';
import { generateWorld, N, CLIFF, WATER, ENTRANCES } from '../../src/world/kraina.js';
import { heightAt, tileBlocked, freeAt, moveWithCollision, findPath, pathLength, newWalker, setPath, stepWalker, lineFree } from '../../src/world/nav.js';
import { WorldView } from '../../src/art/worldview.js';
import { genEntrance, drawEntrance, ENTRANCE_KINDS } from '../../src/art/entrances.js';
import { mockCtx } from './mockctx.mjs';

const W = generateWorld(1);
const sig = (w) => { let h = 0; for (let i = 0; i < w.heights.length; i += 37) h = (h * 31 + Math.round(w.heights[i] * 1000)) | 0; return `${h}:${w.objects.length}:${w.buildings.length}`; };
// płaski świat z rampą do testów ruchu
const flat = (f = () => 0) => { const heights = new Float32Array((N + 1) * (N + 1)); for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) heights[y * (N + 1) + x] = f(x, y); return { heights, blocked: new Uint8Array(N * N), n: N }; };

test('szum: deterministyczny, w zakresie 0..1, gładki', () => {
  for (let i = 0; i < 50; i++) { const v = fbm(3, i * 0.37, i * 0.91); assert.ok(v >= 0 && v <= 1); assert.equal(v, fbm(3, i * 0.37, i * 0.91)); }
  assert.notEqual(noise2(1, 3.3, 4.4), noise2(2, 3.3, 4.4));
  assert.ok(Math.abs(noise2(1, 5.5, 5.5) - noise2(1, 5.501, 5.5)) < 0.01, 'bez skoków');
});

test('świat: ten sam seed daje ten sam świat, inny seed inny, generowanie jest szybkie', () => {
  assert.equal(sig(W), sig(generateWorld(1)));
  assert.notEqual(sig(W), sig(generateWorld(2)));
  const t = Date.now(); generateWorld(5); assert.ok(Date.now() - t < 3000, 'generowanie poniżej 3 s');
  assert.equal(W.n, N); assert.ok(W.objects.length > 2500 && W.buildings.length >= 6 && W.npcs.length >= 5);
});

test('świat: ma nierówności (doliny, wzgórza, rzeka) i klify', () => {
  let mn = 9, mx = -9, steep = 0, water = 0; for (const v of W.heights) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  for (let i = 0; i < N * N; i++) { if (W.steep[i]) steep++; if (W.cellKind[i] === W.KIND.water) water++; }
  assert.ok(mn < -1.5 && mx > 6, `zakres wysokości ${mn.toFixed(1)} do ${mx.toFixed(1)}`);
  assert.ok(steep > 300, 'są klify'); assert.ok(water > 1000, 'jest woda');
  assert.ok(heightAt(W, ...ENTRANCES[0].at) > 3, 'krypta wysoko na wzgórzu'); assert.ok(heightAt(W, ...W.start) < 0.8 && heightAt(W, ...W.start) > -0.5, 'wioska w dolinie');
});

test('chodzenie: start jest wolny, oba wejścia osiągalne pieszo, trasy w rozsądnej długości i bez stromizn', () => {
  assert.ok(freeAt(W, ...W.start));
  for (const e of W.entrances) {
    assert.ok(freeAt(W, ...e.approach), `${e.id}: podejście wolne`);
    const p = findPath(W, W.start, e.approach); assert.ok(p, `${e.id}: ścieżka istnieje`);
    const len = pathLength(p); assert.ok(len > 30 && len < 130, `${e.id}: długość ${len.toFixed(0)}`);
    // żaden odcinek trasy nie jest klifem: przeskok wysokości na kafel poniżej progu
    for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(d / 0.5); for (let j = 1; j <= n; j++) { const f0 = (j - 1) / n, f1 = j / n; const dz = Math.abs(heightAt(W, a[0] + (b[0] - a[0]) * f1, a[1] + (b[1] - a[1]) * f1) - heightAt(W, a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0)); assert.ok(dz / (d / n) < CLIFF, `${e.id}: stromo ${dz / (d / n)}`); } }
  }
  for (const n of W.npcs) assert.ok(freeAt(W, ...n.at, 0.2), `${n.id} stoi na wolnym miejscu`);
});

test('chodzenie: przepaść na zachodzie nie do przejścia, wody głębokiej i klifów nie da się wejść', () => {
  assert.equal(findPath(W, W.start, [30, 130]), null, 'za przepaścią');
  for (let i = 0; i < N * N; i++) if (W.steep[i]) assert.ok(W.blocked[i], 'klif jest blokadą');
  // wejście w kafel z woda głęboka jest zablokowane
  let found = 0; for (let y = 0; y < N && found < 50; y++) for (let x = 0; x < N; x++) { const c = [heightAt(W, x, y), heightAt(W, x + 1, y), heightAt(W, x, y + 1), heightAt(W, x + 1, y + 1)]; if (Math.min(...c) < -1.05) { assert.ok(tileBlocked(W, x, y), 'głęboka woda zablokowana'); found++; } }
  assert.ok(found > 10);
});

test('wioska: budynki stoją na wolnym gruncie, nie na drodze i nie na sobie, a ich podstawa blokuje ruch', () => {
  const seen = new Set();
  for (const b of W.buildings) for (let i = 0; i < b.s.w; i++) for (let j = 0; j < b.s.d; j++) { const x = b.sx - Math.ceil(b.s.w) + i, y = b.sy - Math.ceil(b.s.d) + j, k = y * N + x; assert.ok(!seen.has(k), 'budynki się nakładają'); seen.add(k); assert.ok(W.blocked[k], 'podstawa budynku blokuje'); assert.notEqual(W.cellKind[k], W.KIND.road); assert.notEqual(W.cellKind[k], W.KIND.plaza); }
});

test('kolizje: bohater nie wchodzi w blokadę i ślizga się po ścianie', () => {
  const w = flat(); for (let y = 0; y < N; y++) w.blocked[y * N + 50] = 1;
  const [x, y] = moveWithCollision(w, 49.5, 30.5, 1.2, 0.4); assert.ok(x < 49.71, `x=${x}`); assert.ok(y > 30.5, 'ślizga się wzdłuż ściany');
  assert.ok(!freeAt(w, 50.2, 30)); assert.ok(freeAt(w, 49.5, 30));
  assert.ok(!lineFree(w, [48, 30], [52, 30]));
});

test('ścieżka: omija przeszkodę, nie ścina narożników, wygładza do prostych odcinków', () => {
  const w = flat(); for (let y = 20; y < 60; y++) w.blocked[y * N + 50] = 1;
  const p = findPath(w, [40.5, 40.5], [60.5, 40.5]); assert.ok(p && pathLength(p) > 24 && pathLength(p) < 60, `długość ${p && pathLength(p)}`);
  for (let i = 1; i < p.length; i++) assert.ok(lineFree(w, p[i - 1], p[i]), 'każdy odcinek wolny');
  assert.ok(p.length < 6, 'wygładzona');
  const wall = flat(); for (let x = 0; x < N; x++) wall.blocked[40 * N + x] = 1; assert.equal(findPath(wall, [10.5, 10.5], [10.5, 70.5]), null, 'brak drogi');
});

test('chód: dociera do celu, pod górę wolniej niż z góry, brodem wolniej', () => {
  const ramp = flat((x) => x * 0.25), time = (w, a, b) => { const wk = newWalker(...a); setPath(wk, [a, b]); let t = 0; while (wk.moving && t < 60) { stepWalker(w, wk, 0.05); t += 0.05; } return [t, wk]; };
  const [up] = time(ramp, [20.5, 30.5], [40.5, 30.5]), [down, wk] = time(ramp, [40.5, 30.5], [20.5, 30.5]);
  assert.ok(up > down * 1.15, `pod górę ${up.toFixed(2)} s, z góry ${down.toFixed(2)} s`); assert.ok(Math.hypot(wk.x - 20.5, wk.y - 30.5) < 0.3, 'doszedł'); assert.equal(wk.arrived, true);
  const pond = flat((x) => (x > 30 && x < 40 ? WATER - 0.3 : 0)), [wade] = time(pond, [25.5, 30.5], [45.5, 30.5]), [dry] = time(flat(), [25.5, 30.5], [45.5, 30.5]);
  assert.ok(wade > dry * 1.1, 'brodem wolniej');
  const wk2 = newWalker(40.5, 30.5), wall = flat(); wall.blocked[30 * N + 42] = 1; setPath(wk2, [[40.5, 30.5], [45.5, 30.5]]); for (let i = 0; i < 80; i++) stepWalker(wall, wk2, 0.05); assert.ok(wk2.x < 42.8, 'ściana zatrzymuje chód');
});

test('rzut świata: punkt ekranu wraca do punktu terenu mimo wysokości', () => {
  const v = new WorldView(W);
  for (const [x, y] of [[84, 82], [96, 120], [150, 60], [20, 100], [160, 150]]) { const p = v.pos(x, y), [gx, gy] = v.unproject(p[0], p[1]); assert.ok(Math.hypot(gx - x, gy - y) < 0.08, `(${x},${y}) -> (${gx.toFixed(2)},${gy.toFixed(2)})`); }
});

test('rysowanie świata i wejść: bez błędów, wejścia deterministyczne i różne', () => {
  const v = new WorldView(W);
  for (const at of [W.start, ENTRANCES[0].at, ENTRANCES[1].at, [30, 30]]) { const g = mockCtx(), p = v.pos(...at); v.draw(g, { x: p[0], y: p[1] }, { w: 860, h: 340 }, 0.8, 1, 1.5, [{ x: at[0], y: at[1], draw: () => {} }]); assert.ok(g.__state.calls > 500, `rysuje teren i obiekty (${g.__state.calls})`); assert.deepEqual(g.__state.bad, []); }
  const sig2 = (o) => JSON.stringify(o);
  for (const k of ENTRANCE_KINDS) { assert.equal(sig2(genEntrance(4, k)), sig2(genEntrance(4, k))); assert.notEqual(sig2(genEntrance(4, k)), sig2(genEntrance(5, k))); for (let s = 1; s <= 8; s++) { const g = mockCtx(); drawEntrance(g, 100, 100, genEntrance(s, k)); assert.ok(g.__state.calls > 40); assert.deepEqual(g.__state.bad, [], `${k}#${s}`); } }
  assert.equal(new Set(Array.from({ length: 20 }, (_, i) => genEntrance(i + 1).kind)).size, ENTRANCE_KINDS.length);
});
