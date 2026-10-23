// Kraina Kopca: pierwszy region świata. Ręczne kotwice (wioska, wzgórze z kryptą, las, rzeka, drogi, przepaść) plus generator,
// który z ziarna dokłada nierówności, drzewa, kamienie i kępy. Czysta logika: bez canvasa, DOM i Math.random.
// Współrzędne to siatka izometryczna (x w prawo-dół, y w lewo-dół); ekran: pion = x+y, poziom = x-y.
import { noise2, fbm, hash2, smoothstep, clamp, lerp } from './noise.js';
import { rng } from '../art/rng.js';
import { genBuilding, footprintCells } from '../art/buildings.js';

export const N = 192, HZ = 14;           // N kafli w boku świata, 1 poziom wysokości = 14 px na ekranie
export const CLIFF = 1.1;                 // różnica wysokości w obrębie kafla, od której teren jest klifem
export const WATER = -0.45, DEEP = -1.0;  // poziom wody i próg głębokiej wody (niechodliwej)
const C = N / 2;
// położenie z kompasu: wschód e i południe s liczone na ekranie, na siatkę
export const at = (e, s) => [C + (s + e) / 2, C + (s - e) / 2];

export const VILLAGE = at(0, 34), HILL = at(0, -42), FOREST = at(98, 14);
const HILL_R = 30, FOREST_R = 44, VILLAGE_R = 17;
// drogi jako łamane (punkty w siatce) i ich szerokość; ścieżka na wzgórze ma profil wysokości
const PATH_UP = [at(0, 24), at(-9, 8), at(8, -4), at(-8, -16), at(2, -25)];
const ROAD_E = [at(0, 30), at(22, 22), at(42, 14), at(70, 12), at(92, 14)];
const ROAD_W = [at(0, 34), at(-30, 40), at(-60, 38), at(-82, 34)];
const RIVER = [at(44, -140), at(52, -70), at(44, -10), at(42, 14), at(40, 40), at(46, 100), at(30, 170)];
const FORDS = [at(42, 14)];
const FOREST_PATH = [at(92, 14), at(96, 19), at(98, 24), at(100, 26)];
const RAVINE_E = -88;                      // przepaść na zachodzie (stała wartość x - y)
export const ENTRANCES = [
  { id: 'krypta', dungeon: 'podziemne_korytarze', kind: 'krypta', at: at(2, -26), name: 'Zawalona krypta' },
  { id: 'jama', dungeon: 'gniazdo', kind: 'jama', at: at(100, 26), name: 'Jama pod korzeniami' },
];

const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return [Math.hypot(px - (ax + dx * t), py - (ay + dy * t)), t]; };
// odległość do łamanej i postęp wzdłuż niej (0..1 po długości)
function polyDist(px, py, pts) {
  let best = 1e9, prog = 0, len = 0, acc = 0; const L = [];
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); L.push(l); len += l; }
  for (let i = 0; i < pts.length - 1; i++) { const [d, t] = segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (d < best) { best = d; prog = (acc + L[i] * t) / len; } acc += L[i]; }
  return [best, prog];
}

export function generateWorld(seed = 1) {
  const W1 = N + 1, H = new Float32Array(W1 * W1), cellKind = new Uint8Array(N * N), cellRegion = new Uint8Array(N * N);
  const KIND = { grass: 0, meadow: 1, moss: 2, dry: 3, rock: 4, road: 5, plaza: 6, sand: 7, water: 8, mud: 9 };
  const hi = (x, y) => y * W1 + x;
  const [vx, vy] = VILLAGE, [hx, hy] = HILL, [fx, fy] = FOREST;
  const pathLen = (() => { let l = 0; for (let i = 0; i < PATH_UP.length - 1; i++) l += Math.hypot(PATH_UP[i + 1][0] - PATH_UP[i][0], PATH_UP[i + 1][1] - PATH_UP[i][1]); return l; })();
  const [cx0, cy0] = ENTRANCES[0].at, CRYPT_H = 3.6;
  // wysokość wierzchołka siatki
  const heightAtVertex = (x, y) => {
    let h = (fbm(seed, x / 30, y / 30, 4) - 0.5) * 1.5 + (fbm(seed + 9, x / 9, y / 9, 3) - 0.5) * 0.35;
    const dv = Math.hypot(x - vx, y - vy), dh = Math.hypot(x - hx, y - hy), df = Math.hypot(x - fx, y - fy);
    // wioska i okolica: płasko
    h *= smoothstep(VILLAGE_R + 10, VILLAGE_R - 2, dv) < 0.001 ? 1 : 1 - 0.92 * smoothstep(VILLAGE_R + 12, VILLAGE_R - 2, dv);
    // Cmentarne Wzgórze: kopiec z tarasami; ostrość stopni zależy od kierunku (gdzieniegdzie klif, gdzieniegdzie łagodny stok)
    const bump = smoothstep(HILL_R, 3, dh), raw = 6.4 * Math.pow(bump, 1.25), step = 1.7, tt = raw / step, fl = Math.floor(tt), fr = tt - fl;
    const w = lerp(0.03, 0.4, noise2(seed + 5, x / 14, y / 14)), terr = (fl + smoothstep(1 - w, 1, fr)) * step;
    h += lerp(raw, Math.min(terr, raw + 0.4), 0.85) * (bump > 0.02 ? 1 : 0);
    // Las Robali: niecka z korzeniami
    h += -0.4 * smoothstep(FOREST_R, 6, df) + (fbm(seed + 21, x / 6, y / 6, 3) - 0.5) * 0.8 * smoothstep(FOREST_R, 12, df);
    if (df < FOREST_R) h = Math.max(h, -0.3);
    // rzeka
    const [dr] = polyDist(x, y, RIVER); let depth = -1.7;
    for (const f of FORDS) if (Math.hypot(x - f[0], y - f[1]) < 7) depth = -0.72;
    const rv = smoothstep(7.5, 1.6, dr); h = lerp(h, Math.min(h, depth), rv);
    // przepaść zachodnia
    const re = Math.abs((x - y) - RAVINE_E); h = lerp(h, Math.min(h, -3.2), smoothstep(5.5, 2, re));
    // ścieżka na wzgórze: gładki profil od 0 do poziomu krypty, wygładzony i szeroki
    const [dp, pr] = polyDist(x, y, PATH_UP);
    if (dp < 5) { const target = CRYPT_H * smoothstep(0.08, 0.98, pr), a = smoothstep(5, 1.8, dp); h = lerp(h, target, a); }
    // platforma przed kryptą
    const dc = Math.hypot(x - cx0, y - cy0); h = lerp(h, CRYPT_H, smoothstep(9, 3.5, dc));
    // drogi: lekkie wygładzenie
    for (const road of [ROAD_E, ROAD_W]) { const [d] = polyDist(x, y, road); if (d < 3) h = lerp(h, h * 0.4, smoothstep(3, 1, d)); }
    // góry na brzegu świata
    const de = Math.min(x, y, N - x, N - y); h += 11 * smoothstep(9, 1, de);
    return h;
  };
  for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) H[hi(x, y)] = heightAtVertex(x, y);
  const hv = (x, y) => H[hi(clamp(x, 0, N), clamp(y, 0, N))];
  const cellH = (x, y) => [hv(x, y), hv(x + 1, y), hv(x + 1, y + 1), hv(x, y + 1)];
  // rodzaj gruntu i blokady z terenu
  const blocked = new Uint8Array(N * N), steep = new Uint8Array(N * N);
  const regionOf = (x, y) => {
    if (Math.hypot(x - vx, y - vy) < VILLAGE_R + 3) return 1;
    if (Math.hypot(x - hx, y - hy) < HILL_R) return 2;
    if (Math.hypot(x - fx, y - fy) < FOREST_R) return 3;
    if (Math.abs((x - y) - RAVINE_E) < 28 && (x - y) < RAVINE_E + 28) return 4;
    return 0;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = y * N + x, c = cellH(x, y), mn = Math.min(...c), mx = Math.max(...c), mean = (c[0] + c[1] + c[2] + c[3]) / 4, reg = regionOf(x + 0.5, y + 0.5);
    cellRegion[k] = reg;
    let kind = KIND.grass; const n = fbm(seed + 3, x / 7, y / 7, 3);
    if (reg === 3) kind = n > 0.52 ? KIND.moss : KIND.mud === 0 ? KIND.moss : KIND.moss;
    else if (reg === 2) kind = mean > 3.2 ? KIND.dry : KIND.grass;
    else kind = n > 0.6 ? KIND.meadow : KIND.grass;
    if (mx - mn > CLIFF * 0.75 || mean > 5.2) kind = KIND.rock;
    if (mx - mn > CLIFF) steep[k] = 1;
    if (mn < WATER - 0.1) kind = KIND.water;
    else if (mean < WATER + 0.1 && mean >= WATER - 0.05) kind = KIND.sand;
    cellKind[k] = kind;
    if (steep[k] || mn < DEEP || Math.min(x, y, N - 1 - x, N - 1 - y) < 2) blocked[k] = 1;
  }
  // drogi i plac nadpisują grunt
  const paint = (pts, wd, kind) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [d] = polyDist(x + 0.5, y + 0.5, pts); const k = y * N + x; if (d < wd && cellKind[k] !== KIND.water && cellKind[k] !== KIND.rock) cellKind[k] = kind; } };
  paint(PATH_UP, 1.6, KIND.road); paint(ROAD_E, 1.7, KIND.road); paint(ROAD_W, 1.7, KIND.road);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x + 0.5 - vx, y + 0.5 - vy) < 6.5) cellKind[y * N + x] = KIND.plaza;
  const isRoad = (x, y) => { const k = cellKind[(y | 0) * N + (x | 0)]; return k === KIND.road || k === KIND.plaza; };
  // budynki wioski: róg S w punkcie siatki, podstawa na pełnych kaflach
  const bdefs = [[-9, -9, 11, 'tavern'], [-9, 2, 5, 'tower'], [9, -9, 37, 'townhouse'], [11, 2, 61, 'farmhouse'], [-4, 11, 23, 'shop'], [5, 12, 72, 'cottage'], [-14, 13, 48, 'cottage'], [14, 13, 88, 'townhouse']];
  const buildings = [], taken = new Set();
  for (const [dx, dy, bs, kind] of bdefs) {
    const s = genBuilding(bs, kind), sx = Math.round(vx + dx + s.w), sy = Math.round(vy + dy + s.d), cells = footprintCells(s, sx, sy);
    if (cells.some((c) => taken.has(c.y * N + c.x) || isRoad(c.x, c.y) || blocked[c.y * N + c.x])) continue;
    for (const c of cells) { taken.add(c.y * N + c.x); blocked[c.y * N + c.x] = 1; }
    buildings.push({ s, sx, sy });
  }
  // obiekty: drzewa, krzewy, kamienie, kwiaty; stałe, zależne od ziarna i położenia
  const objects = [], clear = new Set();
  for (const e of ENTRANCES) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) clear.add((Math.floor(e.at[1]) + dy) * N + Math.floor(e.at[0]) + dx);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (polyDist(x + 0.5, y + 0.5, FOREST_PATH)[0] < 2.2) clear.add(y * N + x);
  const R = rng(seed * 977 + 5);
  const put = (k, x, y, extra = {}) => objects.push({ k, x, y, seed: Math.floor(hash2(seed, Math.floor(x * 4), Math.floor(y * 4)) * 1e6) % 9973, ...extra });
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
    const k = y * N + x, kind = cellKind[k], reg = cellRegion[k];
    if (taken.has(k) || clear.has(k) || kind === KIND.road || kind === KIND.plaza || kind === KIND.water || kind === KIND.rock) continue;
    const r = hash2(seed + 31, x, y), ox = 0.2 + 0.6 * hash2(seed + 32, x, y), oy = 0.2 + 0.6 * hash2(seed + 33, x, y), px = x + ox, py = y + oy;
    if (blocked[k] || Math.hypot(px - vx, py - vy) < VILLAGE_R - 3) { if (!blocked[k] && r < 0.07) put('flowers', px, py); continue; }
    let tree = 0.045;
    if (reg === 3) tree = 0.16 + 0.26 * smoothstep(0.48, 0.68, fbm(seed + 8, x / 9, y / 9, 3)); else if (reg === 2) tree = 0.07; else if (kind === KIND.sand) tree = 0.01; else tree = 0.06 + 0.2 * smoothstep(0.55, 0.75, fbm(seed + 8, x / 12, y / 12, 3));
    if (r < tree) {
      const q = hash2(seed + 34, x, y);
      let kk = q < 0.5 ? 'oak' : q < 0.8 ? 'pine' : 'birch';
      if (reg === 3) kk = q < 0.4 ? 'dead' : q < 0.7 ? 'pine' : 'oak';
      if (reg === 2) kk = q < 0.7 ? 'pine' : 'dead';
      put(kk, px, py, { biome: reg === 3 ? 'dark' : reg === 2 ? 'summer' : (hash2(seed + 35, x >> 3, y >> 3) < 0.18 ? 'autumn' : 'summer'), block: true });
      blocked[k] = Math.max(blocked[k], 2);   // 2 = zajęte przez obiekt (omijane przez ścieżki, nie przez teren)
    } else if (r < tree + 0.05) put('bush', px, py, { biome: reg === 3 ? 'dark' : 'summer' });
    else if (r < tree + 0.075) put(reg === 3 ? 'mushrooms' : 'flowers', px, py);
    else if (r < tree + 0.088) { put('rock', px, py, { block: true }); blocked[k] = Math.max(blocked[k], 2); }
    else if (r < tree + 0.095 && reg !== 3) put('stump', px, py);
  }
  const vprops = [['lamp', -3.4, -3.6], ['lamp', 3.6, -3.4], ['lamp', -3.6, 3.8], ['lamp', 3.8, 3.6], ['bench', -5.6, 1.4], ['bench', 6.2, 1.6], ['barrel', -6.6, -6.4], ['crate', -7.8, -6.6], ['barrel', 6.8, -6.2], ['cart', 2.4, 9.8], ['sack', -1.6, 9.6]];
  for (const [kk, dx, dy] of vprops) put(kk, vx + dx, vy + dy, { prop: true });
  objects.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const byTile = new Map();
  for (const o of objects) { const key = Math.floor(o.y) * N + Math.floor(o.x); (byTile.get(key) || byTile.set(key, []).get(key)).push(o); }
  // postaci niezależne: stoją w wiosce i na drogach
  const npcs = [
    { id: 'karczmarz', name: 'Karczmarz', role: 'villager', seed: 14, at: [vx - 4.5, vy - 3.2], line: 'Do areny schodzi się przez cmentarz na wzgórzu. Zimą nikt nie wraca tą samą drogą.' },
    { id: 'kowal', name: 'Kowalka', role: 'warrior', seed: 23, at: [vx + 5.5, vy - 2.8], line: 'Kopacze znoszą ziemię w korytarzach pod wzgórzem. Słyszę ich w nocy przez kowadło.' },
    { id: 'kupiec', name: 'Kupiec', role: 'merchant', seed: 31, at: [vx + 1.2, vy + 5.2], line: 'Za rzeką jest las. Kto wchodzi głębiej niż ścieżka, wraca z pajęczyną we włosach, jeśli wraca.' },
    { id: 'dziecko', name: 'Dziecko', role: 'child', seed: 41, at: [vx - 2.5, vy + 6.8], line: 'Nie wolno nam na wzgórze. Ale tam jest dziura, widziałem.' },
    { id: 'straznik', name: 'Strażnik Traktu', role: 'warrior', seed: 53, at: [ROAD_W[3][0] + 1.5, ROAD_W[3][1] - 1.2], line: 'Most runął w zimie. Droga na zachód zamknięta, dopóki ktoś go nie odbuduje.' },
    { id: 'starzec', name: 'Starzec', role: 'elder', seed: 62, at: [ROAD_E[3][0] - 2.4, ROAD_E[3][1] + 2.4], line: 'Brodem da się przejść. Mostu nie ma, bo woda go lubi.' },
  ];
  const entrances = ENTRANCES.map((e) => ({ ...e, approach: [e.at[0] - 1.6, e.at[1] + 2.6] }));
  const start = [vx + 0.5, vy + 8.5];
  return { n: N, seed, heights: H, cellKind, cellRegion, blocked, steep, objects, byTile, buildings, npcs, entrances, start, KIND, regions: REGIONS, roads: { up: PATH_UP, east: ROAD_E, west: ROAD_W }, river: RIVER };
}
export const REGIONS = [
  { id: 0, name: 'Pola nad rzeką' }, { id: 1, name: 'Kopiec' }, { id: 2, name: 'Cmentarne Wzgórze' }, { id: 3, name: 'Las Robali' }, { id: 4, name: 'Stary Trakt' },
];
