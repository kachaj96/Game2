import test from 'node:test';
import assert from 'node:assert/strict';
import { noise2, fbm } from '../../src/world/noise.js';
import { generateWorld, N, ENTRANCES } from '../../src/world/kraina.js';
import { buildOccluders, sunShadow, canopyShade } from '../../src/world/shadowmap.js';
import { heightAt, canStep, tileBlocked, freeAt, moveWithCollision, findPath, pathLength, newWalker, setPath, stepWalker, lineFree } from '../../src/world/nav.js';
import { WorldView } from '../../src/art/worldview.js';
import { genTree, drawTree, SPECIES } from '../../src/art/trees.js';
import { groundRGB } from '../../src/art/groundcolor.js';
import { genEntrance, drawEntrance, ENTRANCE_KINDS } from '../../src/art/entrances.js';
import { mockCtx } from './mockctx.mjs';

const W = generateWorld(1);
const sig = (w) => { let h = 0; for (let i = 0; i < w.lvl.length; i += 37) h = (h * 31 + w.lvl[i] * 7 + w.ramp[i]) | 0; return `${h}:${w.objects.length}:${w.buildings.length}`; };
// płaski świat do testów ruchu: f(x,y) daje poziom kafla, g(x,y) kierunek pochylni
const KIND = { grass: 0, shallow: 9 };
const flat = (f = () => 0, g = () => 0) => { const lvl = new Int8Array(N * N), ramp = new Uint8Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { lvl[y * N + x] = f(x, y); ramp[y * N + x] = g(x, y); } return { lvl, ramp, blocked: new Uint8Array(N * N), cellKind: new Uint8Array(N * N), KIND, n: N }; };

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

test('świat: ma tarasy, pochylnie i wodę, krypta wysoko, wioska w dolinie', () => {
  const hist = {}; let ramps = 0, water = 0;
  for (let i = 0; i < N * N; i++) { hist[W.lvl[i]] = (hist[W.lvl[i]] || 0) + 1; if (W.ramp[i]) ramps++; if (W.cellKind[i] === W.KIND.water) water++; }
  assert.ok(Object.keys(hist).length >= 5, 'kilka poziomów'); assert.ok(ramps > 20, 'są schody'); assert.ok(water > 1000, 'jest woda');
  assert.ok(heightAt(W, ...ENTRANCES[0].at) >= 2, 'krypta na wzgórzu'); assert.equal(Math.round(heightAt(W, ...W.start)), 0, 'wioska w dolinie');
});

test('chodzenie: start jest wolny, oba wejścia osiągalne pieszo, trasy w rozsądnej długości, każdy krok po dozwolonym przejściu', () => {
  assert.ok(freeAt(W, ...W.start));
  for (const e of W.entrances) {
    assert.ok(freeAt(W, ...e.approach), `${e.id}: podejście wolne`);
    const p = findPath(W, W.start, e.approach); assert.ok(p, `${e.id}: ścieżka istnieje`);
    const len = pathLength(p); assert.ok(len > 30 && len < 160, `${e.id}: długość ${len.toFixed(0)}`);
    for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25); for (let j = 1; j <= n; j++) { const x0 = a[0] + (b[0] - a[0]) * (j - 1) / n, y0 = a[1] + (b[1] - a[1]) * (j - 1) / n, x1 = a[0] + (b[0] - a[0]) * j / n, y1 = a[1] + (b[1] - a[1]) * j / n; assert.ok(Math.abs(heightAt(W, x1, y1) - heightAt(W, x0, y0)) < 0.6, `${e.id}: skok wysokości`); } }
  }
  for (const n of W.npcs) assert.ok(freeAt(W, ...n.at, 0.2), `${n.id} stoi na wolnym miejscu`);
});

test('chodzenie: przepaść na zachodzie nie do przejścia, ściana skalna blokuje, pochylnia przepuszcza', () => {
  assert.equal(findPath(W, W.start, [30, 130]), null, 'za przepaścią');
  const w = flat((x) => (x >= 50 ? 1 : 0)); assert.ok(!canStep(w, 49, 30, 50, 30), 'ściana o poziom');
  const r = flat((x) => (x >= 50 ? 1 : 0), (x, y) => (x === 49 && y === 30 ? 1 : 0)); r.lvl[30 * N + 49] = 0;
  assert.ok(canStep(r, 49, 30, 50, 30), 'schody łączą poziomy'); assert.ok(!canStep(r, 49, 31, 50, 31));
  assert.ok(findPath(r, [40.5, 30.5], [60.5, 30.5]), 'trasa przez schody'); assert.equal(findPath(w, [40.5, 30.5], [60.5, 30.5]), null, 'bez schodów nie wejdzie');
});

test('wioska: budynki stoją na wolnym gruncie, nie na drodze i nie na sobie, a ich podstawa blokuje ruch', () => {
  const seen = new Set();
  for (const b of W.buildings) { assert.ok(Number.isInteger(b.w) && Number.isInteger(b.d), 'pełne kafle'); assert.ok(Math.abs(b.s.w * b.k - b.w) < 1e-9 && Math.abs(b.s.d * b.k - b.d) < 1e-9, 'rysunek zgadza się z podstawą'); }
  for (const b of W.buildings) for (let i = 0; i < b.w; i++) for (let j = 0; j < b.d; j++) { const x = b.sx - b.w + i, y = b.sy - b.d + j, k = y * N + x; assert.ok(!seen.has(k), 'budynki się nakładają'); seen.add(k); assert.ok(W.blocked[k], 'podstawa budynku blokuje'); assert.notEqual(W.cellKind[k], W.KIND.road); assert.notEqual(W.cellKind[k], W.KIND.plaza); }
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
  const ramp = flat((x) => x - 20, () => 1), time = (w, a, b) => { const wk = newWalker(...a); setPath(wk, [a, b]); let t = 0; while (wk.moving && t < 60) { stepWalker(w, wk, 0.05); t += 0.05; } return [t, wk]; };
  const [up] = time(ramp, [20.5, 30.5], [35.5, 30.5]), [down, wk] = time(ramp, [35.5, 30.5], [20.5, 30.5]);
  assert.ok(up > down * 1.15, `pod górę ${up.toFixed(2)} s, z góry ${down.toFixed(2)} s`); assert.ok(Math.hypot(wk.x - 20.5, wk.y - 30.5) < 0.3, 'doszedł'); assert.equal(wk.arrived, true);
  const pond = flat(); for (let y = 0; y < N; y++) for (let x = 31; x < 40; x++) pond.cellKind[y * N + x] = KIND.shallow; const [wade] = time(pond, [25.5, 30.5], [45.5, 30.5]), [dry] = time(flat(), [25.5, 30.5], [45.5, 30.5]);
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

test('drzewa: deterministyczne, różne gatunki i ziarna, rysują się bez błędów we wszystkich biomach', () => {
  const sg = (o) => JSON.stringify(o);
  for (const sp of SPECIES) { assert.equal(sg(genTree(3, sp)), sg(genTree(3, sp))); assert.notEqual(sg(genTree(3, sp)), sg(genTree(4, sp))); for (const biome of ['summer', 'autumn', 'dark']) for (let s = 1; s <= 5; s++) { const g = mockCtx(); drawTree(g, 100, 200, genTree(s, sp, biome)); assert.ok(g.__state.calls > 20); assert.deepEqual(g.__state.bad, [], `${sp}/${biome}#${s}`); } }
  assert.equal(new Set(Array.from({ length: 40 }, (_, i) => genTree(i + 1).species)).size, SPECIES.length);
});

test('kolor gruntu: ciągły, mech w lesie ciemniejszy od łąki, woda niebieska', () => {
  let big = 0, n = 400; for (let i = 0; i < n; i++) { const x = 20 + (i % 20) * 7.3, y = 30 + Math.floor(i / 20) * 7.1, a = groundRGB(W, x, y), b = groundRGB(W, x + 0.15, y + 0.15); if (Math.max(...a.map((v, k) => Math.abs(v - b[k]))) > 60) big++; }
  assert.ok(big / n < 0.12, `ostre skoki koloru tylko na krawędziach: ${big}/${n}`);
  const forest = groundRGB(W, ...W.entrances[1].at), meadow = groundRGB(W, W.start[0] - 20, W.start[1] + 20); assert.ok(forest[1] < meadow[1], 'las ciemniejszy od łąki');
  let wet = null; for (let y = 0; y < N && !wet; y += 2) for (let x = 0; x < N; x += 2) if (W.cellKind[y * N + x] === W.KIND.water) { wet = [x + 0.5, y + 0.5]; break; }
  const wc = groundRGB(W, ...wet); assert.ok(wc[2] > wc[0], 'woda niebieska');
});

test('mapa cieni: wysoka ściana rzuca cień na niższy taras, drzewo na swoją platformę, a w pełnym słońcu jest jasno', () => {
  const occ = buildOccluders(W);
  // znajdź krawędź tarasu: kafel niższy tuż za (w stronę +x) kafelkiem wyższym o jeden poziom
  let found = 0, lit = 0;
  for (let y = 5; y < N - 5 && found < 20; y++) for (let x = 5; x < N - 12; x++) { const a = W.lvl[y * N + x], b = W.lvl[y * N + x + 1]; if (a === 1 && b === 0 && !W.ramp[y * N + x] && !W.ramp[y * N + x + 1] && W.lvl[y * N + x - 1] === 1) { if (sunShadow(W, occ, x + 1.2, y + 0.5, 0) > 0) found++; } }
  assert.ok(found >= 3, `cień ściany na niższym poziomie (${found})`);
  let tot = 0; for (let i = 0; i < 400; i++) { const x = 8 + (i * 37) % 176, y = 8 + (i * 53) % 176; if (W.cellKind[y * N + x] !== W.KIND.grass) continue; tot++; if (sunShadow(W, occ, x + 0.5, y + 0.5, heightAt(W, x + 0.5, y + 0.5)) === 0) lit++; }
  assert.ok(tot > 30 && lit / tot > 0.3 && lit < tot, `większość łąk jest oświetlona, ale nie wszystkie (${lit}/${tot})`);
  const tree = W.objects.find((o) => o.k === 'oak'), z = heightAt(W, tree.x, tree.y);
  assert.ok(sunShadow(W, occ, tree.x + 1.2, tree.y - 0.3, z) > 0 || sunShadow(W, occ, tree.x + 2.0, tree.y - 0.5, z) > 0, 'drzewo rzuca cień w prawo');
  assert.ok(canopyShade(W, occ, tree.x, tree.y, 1) > 0, 'pod koroną jest półcień');
});
