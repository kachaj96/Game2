// Mapa cieni świata: dla punktu gruntu liczy, czy promień do słońca przechodzi przez teren (ściany tarasów), drzewa, budynki albo wejścia.
// Czysta logika, bez rysowania. Światło pada z lewej góry (na ekranie), więc cienie biegną w stronę +x i trochę +y siatki (w prawo i w dół, ku widzowi).
// Wysokości w poziomach (1 poziom = HZ px). Cień jest więc zawsze rzutowany na właściwą platformę, a ściana tarasu rzuca cień na niższy.
import { N } from './kraina.js';
import { heightAt } from './nav.js';
import { hash2 } from './noise.js';

export const SUN = { dx: 0.97, dy: 0.24, k: 0.8 };   // kierunek cienia w siatce (jednostkowy) i długość cienia na poziom wysokości
const LEN = Math.hypot(SUN.dx, SUN.dy), DX = SUN.dx / LEN, DY = SUN.dy / LEN;

// opis przeszkód: korona (walec lub stożek) + pień, rozmiary w kaflach i poziomach
const TREES = {
  oak: { trunk: [0.22, 3.4], crown: [3.0, 7.4, 1.55, 1.2], ao: 1.7 },
  birch: { trunk: [0.18, 3.6], crown: [3.4, 7.2, 1.2, 0.9], ao: 1.3 },
  swamp: { trunk: [0.3, 3.8], crown: [3.4, 8.0, 1.9, 1.4], ao: 2.1 },
  pine: { trunk: [0.2, 1.6], crown: [1.2, 8.2, 1.25, 0.08], ao: 1.2 },
  dead: { trunk: [0.24, 6.2], ao: 0.6 },
};
const SMALLS = { rock: [0.55, 1.1], bush: [0.5, 0.75], barrel: [0.35, 1.0], crate: [0.35, 1.0], lamp: [0.12, 3.4], cart: [0.8, 1.3], mushroom: [0.3, 0.6] };

export function buildOccluders(world) {
  const bins = new Map(), ao = new Map();
  const add = (map, o, rad) => { const x0 = Math.floor(o.x - rad), x1 = Math.floor(o.x + rad), y0 = Math.floor(o.y - rad), y1 = Math.floor(o.y + rad); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (x < 0 || y < 0 || x >= N || y >= N) continue; const k = y * N + x; (map.get(k) || map.set(k, []).get(k)).push(o); } };
  const cyl = (x, y, z0, z1, r0, r1) => ({ t: 'c', x, y, z0, z1, r0, r1 });
  for (const o of world.objects) {
    const z = heightAt(world, o.x, o.y), T = TREES[o.k], sc = o.sc || 1;
    if (T) {
      const s = 1; add(bins, cyl(o.x, o.y, z, z + T.trunk[1] * s, T.trunk[0], T.trunk[0]), T.trunk[0] + 0.1);
      if (T.crown) { const [a, b, r0, r1] = T.crown; add(bins, cyl(o.x, o.y, z + a, z + b, r0, r1), r0 + 0.1); }
      add(ao, { x: o.x, y: o.y, r: T.ao, k: o.k }, T.ao + 0.1);
    } else if (SMALLS[o.k]) { const [r, h] = SMALLS[o.k]; add(bins, cyl(o.x, o.y, z, z + h * sc, r * sc, r * sc), r * sc + 0.1); }
  }
  for (const b of world.buildings) {
    const z = heightAt(world, b.sx - b.w / 2, b.sy - b.d / 2), h = ((b.s.floors || 2) * (b.s.fh || 30) + 40) * b.k / 36 * 0.9;
    const o = { t: 'b', x0: b.sx - b.w, x1: b.sx, y0: b.sy - b.d, y1: b.sy, z0: z, z1: z + h }; add(bins, { ...o, x: (o.x0 + o.x1) / 2, y: (o.y0 + o.y1) / 2 }, Math.max(b.w, b.d) / 2 + 0.2);
  }
  for (const e of world.entrances) {
    const z = heightAt(world, e.at[0], e.at[1]);
    if (e.kind === 'krypta') for (const [hx, hy, h] of [[1.4, 1.02, 1.95], [1.05, 0.76, 3.65], [0.7, 0.5, 5.2]]) { const o = { t: 'b', x0: e.at[0] - hx, x1: e.at[0] + hx, y0: e.at[1] - hy, y1: e.at[1] + hy, z0: z, z1: z + h }; add(bins, { ...o, x: e.at[0], y: e.at[1] }, 2); }
    else { add(bins, cyl(e.at[0], e.at[1], z, z + 3.8, 0.55, 0.55), 0.8); add(bins, cyl(e.at[0], e.at[1], z + 3.4, z + 8.2, 1.9, 1.4), 2); add(ao, { x: e.at[0], y: e.at[1], r: 2.1, k: 'swamp' }, 2.2); }
  }
  return { bins, ao };
}

const hit = (o, px, py, zr) => {
  if (o.t === 'b') return px >= o.x0 && px <= o.x1 && py >= o.y0 && py <= o.y1 && zr >= o.z0 && zr <= o.z1;
  if (zr < o.z0 || zr > o.z1) return false;
  const r = o.r0 + (o.r1 - o.r0) * (zr - o.z0) / Math.max(1e-6, o.z1 - o.z0), dx = px - o.x, dy = py - o.y;
  return dx * dx + dy * dy <= r * r;
};

// 0 = oświetlone, 1 = w cieniu rzuconym. Promień od punktu idzie w stronę słońca (przeciwnie do kierunku cienia) i wznosi się o 1/k poziomu na kafel.
export function sunShadow(world, occ, x, y, z) {
  const up = 1 / SUN.k;
  for (let t = 0.22; t < 9; t += 0.28) {
    const px = x - DX * t, py = y - DY * t, zr = z + t * up;
    if (px < 0 || py < 0 || px >= N || py >= N) return 0;
    if (zr > 9) return 0;
    if (heightAt(world, px, py) > zr + 0.04) return 1;
    const lst = occ.bins.get(Math.floor(py) * N + Math.floor(px)); if (lst) for (const o of lst) if (hit(o, px, py, zr)) return 1;
  }
  return 0;
}

// półcień pod koronami: im bliżej środka korony, tym ciemniej, z postrzępionym brzegiem (światło przebija się przez liście)
export function canopyShade(world, occ, x, y, seed = 1) {
  const lst = occ.ao.get(Math.floor(y) * N + Math.floor(x)); if (!lst) return 0;
  let s = 0;
  for (const o of lst) { const d = Math.hypot(x - o.x, y - o.y) / o.r; if (d >= 1) continue; const lit = hash2(seed, Math.floor(x * 5), Math.floor(y * 5)); s = Math.max(s, (1 - d * d) * (0.55 + 0.45 * lit)); }
  return s;
}
