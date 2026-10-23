// Kraina Kopca: pierwszy region świata. Ręczne kotwice (wioska, wzgórze z kryptą, las, rzeka, drogi, przepaść) plus generator,
// który z ziarna dokłada nierówności, drzewa, kamienie i kępy. Czysta logika: bez canvasa, DOM i Math.random.
// Współrzędne to siatka izometryczna (x w prawo-dół, y w lewo-dół); ekran: pion = x+y, poziom = x-y.
import { noise2, fbm, hash2, smoothstep, clamp, lerp } from './noise.js';
import { rng } from '../art/rng.js';
import { genBuilding, footprintCells } from '../art/buildings.js';

export const N = 192, LH = 36, HZ = LH;  // N kafli w boku świata, 1 poziom wysokości = 36 px na ekranie (jak wysokość kafla)
const C = N / 2;
// położenie z kompasu: wschód e i południe s liczone na ekranie, na siatkę
export const at = (e, s) => [C + (s + e) / 2, C + (s - e) / 2];

export const VILLAGE = at(0, 34), HILL = at(0, -42), FOREST = at(98, 14);
const HILL_R = 38, FOREST_R = 44, VILLAGE_R = 26;
export const BUILD_K = 1.7;      // budynki rysujemy 1,7 razy większe niż generator, żeby drzwi i piętra pasowały do postaci
// drogi jako łamane (punkty w siatce) i ich szerokość; ścieżka na wzgórze ma profil wysokości
const PATH_UP = [at(0, 24), at(-9, 8), at(8, -4), at(-8, -16), at(2, -25)];
const ROAD_E = [at(0, 30), at(22, 22), at(42, 14), at(70, 12), at(92, 14)];
const ROAD_W = [at(0, 34), at(-30, 40), at(-56, 38), at(-74, 34)];
const RIVER = [at(44, -140), at(52, -70), at(44, -10), at(42, 14), at(40, 40), at(46, 100), at(30, 170)];
const FORDS = [at(42, 14)];
const FOREST_PATH = [at(92, 14), at(96, 19), at(98, 24), at(100, 26)];
const RAVINE_E = -88;                      // przepaść na zachodzie (stała wartość x - y)
export const ENTRANCES = [
  { id: 'krypta', dungeon: 'korytarze', kind: 'krypta', at: at(2, -26), name: 'Zawalona krypta' },
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
  // Teren to płaskie platformy (poziomy całkowite) z pionowymi ścianami skalnymi i pochylniami (schodami) tam, gdzie można przejść między poziomami.
  const lvl = new Int8Array(N * N), ramp = new Uint8Array(N * N), cellKind = new Uint8Array(N * N), cellRegion = new Uint8Array(N * N), blocked = new Uint8Array(N * N);
  const KIND = { grass: 0, meadow: 1, moss: 2, dry: 3, rock: 4, road: 5, plaza: 6, sand: 7, water: 8, shallow: 9, chasm: 10 };
  const [vx, vy] = VILLAGE, [hx, hy] = HILL, [fx, fy] = FOREST;
  const [cx0, cy0] = ENTRANCES[0].at, CRYPT_L = 2;
  const rav = (x, y) => (x - y) - RAVINE_E - 7 * Math.sin((x + y) / 17) - 4 * (fbm(seed + 80, x / 18, y / 18, 2) - 0.5);
  const landK = (x, y) => { const e = x - y, ss = x + y - N, rr = Math.hypot(e / (0.84 * N), ss / (0.64 * N)) * (0.82 + 0.34 * fbm(seed + 60, x / 26, y / 26, 3) + 0.1 * Math.sin((x * 0.11 + y * 0.07))); return smoothstep(1.02, 0.9, rr); };
  const wob = (x, y, sd) => 0.78 + 0.44 * fbm(seed + sd, x / 22, y / 22, 3);
  const dHill = (x, y) => Math.hypot(x - hx, y - hy) * wob(x, y, 40) / (1 + 0.25 * Math.sin((x - y) / 18)), dForest = (x, y) => Math.hypot(x - fx, y - fy) * wob(x, y, 50);
  const idx = (x, y) => y * N + x, inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  const regionOf = (x, y) => {
    if (Math.hypot(x - vx, y - vy) < VILLAGE_R + 3) return 1;
    if (dHill(x, y) < HILL_R) return 2;
    if (dForest(x, y) < FOREST_R) return 3;
    if (Math.abs(rav(x, y)) < 28 && rav(x, y) < 28) return 4;
    return 0;
  };
  // 1. poziomy z pola ciągłego: równiny płaskie, wzgórze w tarasach po 2 jednostki wysokości
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x + 0.5, py = y + 0.5, dh = dHill(px, py), bump = smoothstep(HILL_R, 3, dh);
    let h = 8.2 * Math.pow(bump, 1.2) + (fbm(seed + 9, px / 9, py / 9, 3) - 0.5) * 0.9 * bump;
    if (Math.hypot(px - vx, py - vy) < VILLAGE_R) h = 0;
    lvl[idx(x, y)] = Math.max(0, Math.round(h / 2));
    cellRegion[idx(x, y)] = regionOf(px, py);
  }
  // wygładzenie: pojedyncze kafle odstające od sąsiadów wracają do ich poziomu (bez szumu na tarasach)
  // oraz wąskie wcięcia i wypustki (kafel, którego dwaj przeciwległi sąsiedzi mają ten sam, inny poziom, albo 5 z 8 sąsiadów), żeby krawędzie tarasów były czytelne
  for (let pass = 0; pass < 4; pass++) { const copy = lvl.slice(); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const c = copy[idx(x, y)], g = (i, j) => copy[idx(x + i, y + j)]; let to = c;
    if (g(1, 0) === g(-1, 0) && g(1, 0) !== c) to = g(1, 0); else if (g(0, 1) === g(0, -1) && g(0, 1) !== c) to = g(0, 1);
    else { const cnt = {}; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) cnt[g(i, j)] = (cnt[g(i, j)] || 0) + 1; for (const v in cnt) if (+v !== c && cnt[v] >= 5) to = +v; }
    lvl[idx(x, y)] = to; } }
  // 2. rodzaj gruntu: woda (morze, rzeka), przepaść, bród
  const water = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x + 0.5, py = y + 0.5, k = idx(x, y), reg = cellRegion[k], n = fbm(seed + 3, x / 7, y / 7, 3);
    cellKind[k] = reg === 3 ? KIND.moss : (n > 0.6 ? KIND.meadow : KIND.grass);
    if (reg === 2 && lvl[k] >= 3) cellKind[k] = KIND.dry;
    if (landK(px, py) < 0.45) { cellKind[k] = KIND.water; water[k] = 1; lvl[k] = 0; }
    const [dr] = polyDist(px, py, RIVER); let rw = 3.2 + 1.2 * (fbm(seed + 90, x / 10, y / 10, 2) - 0.5) * 2;
    if (dr < rw) { cellKind[k] = KIND.water; water[k] = 1; lvl[k] = 0; for (const f of FORDS) if (Math.hypot(px - f[0], py - f[1]) < 7) { cellKind[k] = KIND.shallow; water[k] = 0; } }
    // jeziorka w nieckach
    const lake = fbm(seed + 95, x / 14, y / 14, 3); if (lake > 0.76 && reg === 0 && cellKind[k] !== KIND.water) { cellKind[k] = KIND.water; water[k] = 1; lvl[k] = 0; }
    if (Math.abs(rav(px, py)) < 4.6) { cellKind[k] = KIND.chasm; lvl[k] = -4; water[k] = 0; }
  }
  // 3. drogi na równinach leżą na poziomie 0, a ścieżka na wzgórze wspina się pochylniami do poziomu krypty
  const paint = (pts, wd, kind) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [d] = polyDist(x + 0.5, y + 0.5, pts), k = idx(x, y); if (d < wd && !water[k] && cellKind[k] !== KIND.chasm && cellKind[k] !== KIND.shallow) { cellKind[k] = kind; } } };
  for (const road of [ROAD_E, ROAD_W]) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [d] = polyDist(x + 0.5, y + 0.5, road); if (d < 2.6 && !water[idx(x, y)] && cellKind[idx(x, y)] !== KIND.chasm) lvl[idx(x, y)] = 0; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x + 0.5 - vx, y + 0.5 - vy) < VILLAGE_R - 4 && cellKind[idx(x, y)] !== KIND.water) lvl[idx(x, y)] = 0;
  // łańcuch kafli ścieżki (czterosąsiedzki) i jego profil wysokości
  const chain = []; { let last = null; const L = []; let tot = 0; for (let i = 0; i < PATH_UP.length - 1; i++) { const l = Math.hypot(PATH_UP[i + 1][0] - PATH_UP[i][0], PATH_UP[i + 1][1] - PATH_UP[i][1]); L.push(l); tot += l; }
    let acc = 0; for (let i = 0; i < PATH_UP.length - 1; i++) { const n = Math.ceil(L[i] * 4); for (let j = 0; j <= n; j++) { const t = j / n, x = Math.floor(PATH_UP[i][0] + (PATH_UP[i + 1][0] - PATH_UP[i][0]) * t), y = Math.floor(PATH_UP[i][1] + (PATH_UP[i + 1][1] - PATH_UP[i][1]) * t);
      if (!last || last[0] !== x || last[1] !== y) { if (last && Math.abs(x - last[0]) + Math.abs(y - last[1]) === 2) chain.push({ x, y: last[1], p: (acc + L[i] * t) / tot }); chain.push({ x, y, p: (acc + L[i] * t) / tot }); last = [x, y]; } } acc += L[i]; } }
  chain.forEach((c) => { c.l = Math.round(CRYPT_L * smoothstep(0.12, 0.96, c.p)); });
  for (let i = 0; i < chain.length; i++) {
    const c = chain[i], nx = chain[Math.min(chain.length - 1, i + 1)], dx = Math.sign(nx.x - c.x), dy = Math.sign(nx.y - c.y), px2 = -dy, py2 = dx, up = nx.l > c.l && (dx || dy);
    for (const o of [-1, 0, 1]) { const x = c.x + (px2 || 0) * o, y = c.y + (py2 || 0) * o; if (!inb(x, y) || water[idx(x, y)]) continue; lvl[idx(x, y)] = c.l; ramp[idx(x, y)] = up ? (dx === 1 ? 1 : dx === -1 ? 2 : dy === 1 ? 3 : 4) : 0; cellKind[idx(x, y)] = KIND.road; }
  }
  // teren po bokach ścieżki dostaje jej poziom (pas 2 kafli): ścieżka jest półką wciętą w zbocze, a nie wąskim rowem w płaskowyżu
  { const best = new Float32Array(N * N).fill(99); for (const c of chain) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = c.x + dx, y = c.y + dy; if (!inb(x, y)) continue; const k = idx(x, y), d = Math.hypot(dx, dy); if (cellKind[k] === KIND.road || water[k] || cellKind[k] === KIND.chasm || d >= best[k]) continue; best[k] = d; lvl[k] = c.l; } }
  // platforma przed kryptą
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x + 0.5 - cx0, y + 0.5 - cy0) < 7.5) { lvl[idx(x, y)] = CRYPT_L; ramp[idx(x, y)] = 0; if (cellKind[idx(x, y)] !== KIND.road) cellKind[idx(x, y)] = KIND.dry; }
  // dodatkowe schody w paru miejscach tarasów wzgórza (kafel o jeden niższy od sąsiada, bez wody i bez ścieżki)
  { const DIR = [[1, 0, 1], [-1, 0, 2], [0, 1, 3], [0, -1, 4]]; for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const k = idx(x, y); if (cellRegion[k] !== 2 || ramp[k] || cellKind[k] === KIND.road) continue; for (const [dx, dy, code] of DIR) { const u = idx(x + dx, y + dy); if (lvl[u] === lvl[k] + 1 && !ramp[u] && hash2(seed + 55, x * 5 + code, y) < 0.09) { ramp[k] = code; break; } } } }
  // końcowe czyszczenie krawędzi po drogach i schodach: wąskie wcięcia i wypustki poza drogami i sąsiedztwem schodów znikają
  { const fixed = new Uint8Array(N * N); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const k = idx(x, y); if (ramp[k] || cellKind[k] === KIND.road || cellKind[k] === KIND.plaza) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) fixed[idx(x + i, y + j)] = 1; }
    for (let pass = 0; pass < 3; pass++) { const copy = lvl.slice(); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const k = idx(x, y); if (fixed[k] || water[k] || cellKind[k] === KIND.chasm) continue; const c = copy[k], g = (i, j) => copy[idx(x + i, y + j)]; let to = c;
      if (g(1, 0) === g(-1, 0) && g(1, 0) !== c) to = g(1, 0); else if (g(0, 1) === g(0, -1) && g(0, 1) !== c) to = g(0, 1);
      else { const cnt = {}; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) cnt[g(i, j)] = (cnt[g(i, j)] || 0) + 1; for (const v in cnt) if (+v !== c && cnt[v] >= 5) to = +v; }
      lvl[k] = to; } } }
  // 4. drogi, plac, piasek, klasyfikacja końcowa
  paint(ROAD_E, 1.7, KIND.road); paint(ROAD_W, 1.7, KIND.road); paint(PATH_UP, 1.6, KIND.road);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x + 0.5 - vx, y + 0.5 - vy) < 6.5 && !water[idx(x, y)]) cellKind[idx(x, y)] = KIND.plaza;
  // piasek: pas przy wodzie
  { const near = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (inb(x + i, y + j) && water[idx(x + i, y + j)]) return true; return false; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = idx(x, y); if (water[k] || cellKind[k] === KIND.chasm || cellKind[k] === KIND.road || cellKind[k] === KIND.plaza || cellKind[k] === KIND.shallow) continue; if (near(x, y, 1) || (hash2(seed + 61, x, y) < 0.5 && near(x, y, 2))) cellKind[k] = KIND.sand; } }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = idx(x, y); if (water[k] || cellKind[k] === KIND.chasm || x < 2 || y < 2 || x > N - 3 || y > N - 3) blocked[k] = 1; }
  const isRoad = (x, y) => { const k = cellKind[(y | 0) * N + (x | 0)]; return k === KIND.road || k === KIND.plaza; };
  // odległość do lądu dla kafli wody (do barwienia: piana przy brzegu, głębia dalej)
  const shore = new Uint8Array(N * N); { const q = []; for (let i = 0; i < N * N; i++) if (!water[i]) { shore[i] = 0; q.push(i); } else shore[i] = 255;
    for (let h = 0; h < q.length; h++) { const c = q[h], x = c % N, y = (c / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const ni = idx(nx, ny); if (shore[ni] === 255) { shore[ni] = Math.min(60, shore[c] + 1); q.push(ni); } } } }
  // budynki wioski: róg S w punkcie siatki, podstawa na pełnych kaflach
  const bdefs = [[-13, -12, 11, 'tavern'], [-15, 1, 5, 'tower'], [7, -13, 37, 'townhouse'], [10, 0, 61, 'farmhouse'], [-7, 10, 23, 'shop'], [6, 11, 72, 'cottage'], [-17, 11, 48, 'cottage'], [14, 10, 88, 'townhouse']];
  const buildings = [], taken = new Set();
  for (const [dx, dy, bs, kind] of bdefs) {
    const s0 = genBuilding(bs, kind), bw = Math.max(3, Math.round(s0.w * BUILD_K * 1.25)), bd = Math.max(3, Math.round(s0.d * BUILD_K * 1.25)), s = { ...s0, w: bw / BUILD_K, d: bd / BUILD_K };   // pełne kafle: podstawa dokładnie tam, gdzie rysunek
    const sx = Math.round(vx + dx + bw), sy = Math.round(vy + dy + bd), cells = []; for (let i = 0; i < bw; i++) for (let j = 0; j < bd; j++) cells.push({ x: sx - bw + i, y: sy - bd + j });
    if (cells.some((c) => taken.has(c.y * N + c.x) || isRoad(c.x, c.y) || blocked[c.y * N + c.x])) continue;
    for (const c of cells) { taken.add(c.y * N + c.x); blocked[c.y * N + c.x] = 1; }
    buildings.push({ s, sx, sy, k: BUILD_K, w: bw, d: bd });
  }
  // obiekty: drzewa, krzewy, kamienie, kwiaty; stałe, zależne od ziarna i położenia
  const objects = [], clear = new Set();
  for (const e of ENTRANCES) for (let dy = -6; dy <= 6; dy++) for (let dx = -7; dx <= 7; dx++) clear.add((Math.floor(e.at[1]) + dy) * N + Math.floor(e.at[0]) + dx);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (polyDist(x + 0.5, y + 0.5, FOREST_PATH)[0] < 3.2) clear.add(y * N + x);
  // przy schodach nic nie rośnie ani nie stoi (dwa kafle zapasu), żeby drzewa nie wyglądały na zawieszone nad stopniami
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (ramp[y * N + x]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < N && y + dy < N) clear.add((y + dy) * N + x + dx);
  const R = rng(seed * 977 + 5);
  const put = (k, x, y, extra = {}) => objects.push({ k, x, y, seed: Math.floor(hash2(seed, Math.floor(x * 4), Math.floor(y * 4)) * 1e6) % 9973, ...extra });
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
    const k = y * N + x, kind = cellKind[k], reg = cellRegion[k];
    if (taken.has(k) || clear.has(k) || kind === KIND.road || kind === KIND.plaza || kind === KIND.water || kind === KIND.chasm || kind === KIND.shallow || ramp[k]) continue;
    { let lip = false; for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (lvl[idx(x + ddx, y + ddy)] !== lvl[k]) lip = true; if (lip) continue; }
    const r = hash2(seed + 31, x, y), ox = 0.2 + 0.6 * hash2(seed + 32, x, y), oy = 0.2 + 0.6 * hash2(seed + 33, x, y), px = x + ox, py = y + oy;
    if (blocked[k] || Math.hypot(px - vx, py - vy) < VILLAGE_R - 3) { if (!blocked[k] && r < 0.07) put('flowers', px, py); continue; }
    let tree = 0.045;
    if (reg === 3) tree = 0.09 + 0.2 * smoothstep(0.5, 0.7, fbm(seed + 8, x / 9, y / 9, 3)); else if (reg === 2) tree = 0.07; else if (kind === KIND.sand) tree = 0.01; else tree = 0.06 + 0.2 * smoothstep(0.55, 0.75, fbm(seed + 8, x / 12, y / 12, 3));
    if (r < tree) {
      const q = hash2(seed + 34, x, y);
      let kk = q < 0.5 ? 'oak' : q < 0.8 ? 'pine' : 'birch';
      if (reg === 3) kk = q < 0.12 ? 'dead' : q < 0.5 ? 'pine' : 'swamp';
      if (reg === 2) kk = q < 0.7 ? 'pine' : 'dead';
      put(kk, px, py, { biome: reg === 3 ? 'dark' : reg === 2 ? 'summer' : (hash2(seed + 35, x >> 3, y >> 3) < 0.18 ? 'autumn' : 'summer'), block: true });
      blocked[k] = Math.max(blocked[k], 2);   // 2 = zajęte przez obiekt (omijane przez ścieżki, nie przez teren)
    } else if (r < tree + 0.05) put('bush', px, py, { biome: reg === 3 ? 'dark' : 'summer', sc: 0.6 + 0.4 * hash2(seed + 37, x, y) });
    else if (r < tree + 0.075) put(reg === 3 ? 'mushrooms' : 'flowers', px, py);
    else if (r < tree + 0.088) { put('rock', px, py, { block: true, sc: 1 + 1.3 * hash2(seed + 36, x, y) }); blocked[k] = Math.max(blocked[k], 2); }
    else if (r < tree + 0.095 && reg !== 3) put('stump', px, py);
  }
  // zawalony most nad przepaścią: belki i skrzynie przy krawędzi drogi zachodniej
  { const [ex, ey] = ROAD_W[3]; for (const [dx, dy, kk] of [[3.2, -1.6, 'logs'], [2.2, 1.9, 'logs'], [4.2, 0.4, 'crate'], [1.6, -2.8, 'barrel']]) put(kk, ex + dx, ey + dy, { prop: true }); }
  const vprops = [['lamp', -4, -4.4], ['lamp', 4.4, -4], ['lamp', -4.4, 4.6], ['lamp', 4.8, 4.4], ['bench', -5.8, 1.6], ['bench', 6.2, 1.8], ['barrel', -7.4, -6.6], ['crate', -8.6, -7], ['barrel', 7.4, -6.6], ['cart', 2.8, 9.2], ['sack', -2, 9]];
  for (const [kk, dx, dy] of vprops) put(kk, vx + dx, vy + dy, { prop: true });
  objects.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const byTile = new Map();
  for (const o of objects) { const key = Math.floor(o.y) * N + Math.floor(o.x); (byTile.get(key) || byTile.set(key, []).get(key)).push(o); }
  // postaci niezależne: stoją w wiosce i na drogach
  const npcs = [
    { id: 'karczmarz', name: 'Karczmarz', role: 'villager', seed: 14, at: [vx - 5, vy - 3.4], line: 'Do areny schodzi się przez cmentarz na wzgórzu. Zimą nikt nie wraca tą samą drogą.' },
    { id: 'kowal', name: 'Kowalka', role: 'warrior', seed: 23, at: [vx + 5.6, vy - 3], line: 'Kopacze znoszą ziemię w korytarzach pod wzgórzem. Słyszę ich w nocy przez kowadło.' },
    { id: 'kupiec', name: 'Kupiec', role: 'merchant', seed: 31, at: [vx + 1.4, vy + 5.6], line: 'Za rzeką jest las. Kto wchodzi głębiej niż ścieżka, wraca z pajęczyną we włosach, jeśli wraca.' },
    { id: 'dziecko', name: 'Dziecko', role: 'child', seed: 41, at: [vx - 2.8, vy + 6.4], line: 'Nie wolno nam na wzgórze. Ale tam jest dziura, widziałem.' },
    { id: 'straznik', name: 'Strażnik Traktu', role: 'warrior', seed: 53, at: [ROAD_W[3][0] + 1.5, ROAD_W[3][1] - 1.2], line: 'Most runął w zimie. Droga na zachód zamknięta, dopóki ktoś go nie odbuduje.' },
    { id: 'starzec', name: 'Starzec', role: 'elder', seed: 62, at: [ROAD_E[3][0] - 2.4, ROAD_E[3][1] + 2.4], line: 'Brodem da się przejść. Mostu nie ma, bo woda go lubi.' },
  ];
  // pola ciągłe do kolorowania gruntu bez kafli: las, droga, plac, przepaść
  const roadsAll = [PATH_UP, ROAD_E, ROAD_W];
  const fieldAt = (x, y) => {
    let dr = 1e9; for (const r of roadsAll) dr = Math.min(dr, polyDist(x, y, r)[0]);
    return { forest: 1 - smoothstep(FOREST_R - 9, FOREST_R + 1, dForest(x, y)), road: 1 - smoothstep(0.9, 2.1, dr), plaza: 1 - smoothstep(6.2, 7.6, Math.hypot(x - vx, y - vy)) };
  };
  const entrances = ENTRANCES.map((e) => ({ ...e, approach: [e.at[0] - 1.6, e.at[1] + 2.6] }));
  const start = [vx + 0.5, vy + 8.5];
  return { n: N, seed, fieldAt, shore, lvl, ramp, cellKind, cellRegion, blocked, objects, byTile, buildings, npcs, entrances, start, KIND, regions: REGIONS, roads: { up: PATH_UP, east: ROAD_E, west: ROAD_W }, river: RIVER };
}
export const REGIONS = [
  { id: 0, name: 'Pola nad rzeką' }, { id: 1, name: 'Kopiec' }, { id: 2, name: 'Cmentarne Wzgórze' }, { id: 3, name: 'Las Robali' }, { id: 4, name: 'Stary Trakt' },
];
