// Poruszanie się po świecie: wysokość w punkcie, krawędzie i klify, kolizje, ścieżki A* i chód. Czysta logika, bez rysowania.
// Teren to platformy (poziomy całkowite) i pochylnie. Przejście między sąsiednimi kaflami jest możliwe tylko, gdy wysokości na wspólnej krawędzi się zgadzają,
// więc ściana skalna jest nie do przejścia, a pochylnia (schody) działa jak przejście.
import { N } from './kraina.js';
import { clamp } from './noise.js';

export const R_HERO = 0.3, SPEED = 3.5;
// wysokość kafla (tx,ty) w jego punkcie lokalnym (fx,fy) z 0..1: kafel płaski ma stały poziom, pochylnia rośnie wzdłuż swojego kierunku
export function tileZ(w, tx, ty, fx, fy) {
  const k = ty * N + tx, L = w.lvl[k], r = w.ramp[k];
  return r === 0 ? L : L + (r === 1 ? fx : r === 2 ? 1 - fx : r === 3 ? fy : 1 - fy);
}
export function heightAt(w, x, y) {
  const cx = clamp(x, 0, N - 1e-6), cy = clamp(y, 0, N - 1e-6), tx = Math.floor(cx), ty = Math.floor(cy);
  return tileZ(w, tx, ty, cx - tx, cy - ty);
}
export const tileBlocked = (w, tx, ty) => tx < 0 || ty < 0 || tx >= N || ty >= N || w.blocked[ty * N + tx] !== 0;
export const inWater = (w, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < N && ty < N && w.cellKind[ty * N + tx] === w.KIND.shallow; };
const EDGE = [[1, 0.5], [0, 0.5], [0.5, 1], [0.5, 0]];   // 0:+x 1:-x 2:+y 3:-y
const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// czy z kafla a można wejść na sąsiedni kafel b (stykające się bokami)
export function canStep(w, ax, ay, bx, by) {
  if (tileBlocked(w, ax, ay) || tileBlocked(w, bx, by)) return false;
  const d = DIR.findIndex(([dx, dy]) => ax + dx === bx && ay + dy === by); if (d < 0) return false;
  const za = tileZ(w, ax, ay, EDGE[d][0], EDGE[d][1]), o = d ^ 1, zb = tileZ(w, bx, by, EDGE[o][0], EDGE[o][1]);
  return Math.abs(za - zb) < 0.2;
}
// połączenie kafla z kaflem w narożniku (po przekątnej przez jednego z dwóch sąsiadów)
const connected = (w, ax, ay, bx, by) => {
  if (ax === bx && ay === by) return true;
  if (Math.abs(ax - bx) + Math.abs(ay - by) === 1) return canStep(w, ax, ay, bx, by);
  if (Math.abs(ax - bx) === 1 && Math.abs(ay - by) === 1) return (canStep(w, ax, ay, bx, ay) && canStep(w, bx, ay, bx, by)) || (canStep(w, ax, ay, ax, by) && canStep(w, ax, by, bx, by));
  return false;
};
// czy okrąg o promieniu r w punkcie (x,y) mieści się: środek na wolnym kaflu, a każdy kafel pod okręgiem jest z nim połączony przejściem
export function freeAt(w, x, y, r = R_HERO) {
  const cx = Math.floor(x), cy = Math.floor(y); if (tileBlocked(w, cx, cy)) return false;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) { const kx = Math.floor(x + ox), ky = Math.floor(y + oy); if ((kx !== cx || ky !== cy) && !connected(w, cx, cy, kx, ky)) return false; }
  return true;
}
// ruch z poślizgiem po ścianach: najpierw cały wektor, potem osobno osie
export function moveWithCollision(w, x, y, dx, dy, r = R_HERO) {
  if (freeAt(w, x + dx, y + dy, r)) return [x + dx, y + dy];
  if (freeAt(w, x + dx, y, r)) return [x + dx, y];
  if (freeAt(w, x, y + dy, r)) return [x, y + dy];
  return [x, y];
}
const nearestFree = (w, x, y, rad = 4) => {
  let best = null, bd = 1e9; const tx = Math.floor(x), ty = Math.floor(y);
  for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) { if (tileBlocked(w, tx + i, ty + j)) continue; const d = Math.hypot(tx + i + 0.5 - x, ty + j + 0.5 - y); if (d < bd) { bd = d; best = [tx + i + 0.5, ty + j + 0.5]; } }
  return best;
};
class Heap {
  constructor() { this.a = []; }
  push(k, v) { const a = this.a; a.push([k, v]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}
const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// ścieżka po kaflach, ruch tylko przez dozwolone przejścia (bez klifów); wynik wygładzony do odcinków prostych
export function findPath(w, from, to, maxNodes = 90000) {
  const sx = Math.floor(from[0]), sy = Math.floor(from[1]);
  let goal = to; if (tileBlocked(w, Math.floor(to[0]), Math.floor(to[1]))) { goal = nearestFree(w, to[0], to[1]); if (!goal) return null; }
  const gx = Math.floor(goal[0]), gy = Math.floor(goal[1]);
  if (tileBlocked(w, sx, sy)) return null;
  const g = new Float32Array(N * N).fill(1e9), prev = new Int32Array(N * N).fill(-1), done = new Uint8Array(N * N), heap = new Heap(), idx = (x, y) => y * N + x;
  const oct = (dx, dy) => { const ax = Math.abs(dx), ay = Math.abs(dy); return Math.max(ax, ay) + 0.4142 * Math.min(ax, ay); };
  g[idx(sx, sy)] = 0; heap.push(oct(gx - sx, gy - sy), idx(sx, sy));
  let n = 0;
  while (heap.size && n++ < maxNodes) {
    const [, cur] = heap.pop(); if (done[cur]) continue; done[cur] = 1;
    const cx = cur % N, cy = (cur / N) | 0; if (cx === gx && cy === gy) break;
    for (const [dx, dy] of D8) {
      const nx = cx + dx, ny = cy + dy; if (tileBlocked(w, nx, ny)) continue;
      if (dx && dy) { if (!((canStep(w, cx, cy, nx, cy) && canStep(w, nx, cy, nx, ny)) && (canStep(w, cx, cy, cx, ny) && canStep(w, cx, ny, nx, ny)))) continue; }
      else if (!canStep(w, cx, cy, nx, ny)) continue;
      const ni = idx(nx, ny); if (done[ni]) continue;
      const step = (dx && dy ? 1.4142 : 1) * (1 + (w.ramp[ni] ? 0.35 : 0) + (w.cellKind[ni] === w.KIND.shallow ? 0.6 : 0)), ng = g[cur] + step;
      if (ng < g[ni]) { g[ni] = ng; prev[ni] = cur; heap.push(ng + oct(gx - nx, gy - ny), ni); }
    }
  }
  const gi = idx(gx, gy); if (prev[gi] < 0 && !(gx === sx && gy === sy)) return null;
  const pts = []; for (let c = gi; c >= 0; c = prev[c]) pts.push([c % N + 0.5, ((c / N) | 0) + 0.5]);
  pts.reverse(); if (pts.length) pts[0] = [from[0], from[1]];
  if (pts.length > 1 && Math.floor(goal[0]) === gx) pts[pts.length - 1] = [clamp(goal[0], gx + 0.1, gx + 0.9), clamp(goal[1], gy + 0.1, gy + 0.9)];
  return smoothPath(w, pts);
}
// odcinek jest wolny, gdy okrąg bohatera mieści się na całej jego długości
export function lineFree(w, a, b, r = R_HERO) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 0.15));
  for (let i = 0; i <= n; i++) { const t = i / n; if (!freeAt(w, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r)) return false; }
  return true;
}
export function smoothPath(w, pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !lineFree(w, pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
  return out;
}
export const pathLength = (p) => { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; };

// chód: stan {x,y,path,i,t,face}; krok dt sekund. Pod górę wolniej, brodem wolniej.
export function newWalker(x, y) { return { x, y, path: null, i: 0, t: 0, moving: false, dx: 0, dy: 1, arrived: false }; }
export function setPath(wk, path) { wk.path = path && path.length > 1 ? path : null; wk.i = 1; wk.moving = !!wk.path; wk.arrived = false; }
export function stepWalker(w, wk, dt) {
  if (!wk.moving || !wk.path) { wk.moving = false; return wk; }
  let left = SPEED * dt;
  while (left > 1e-6 && wk.path && wk.i < wk.path.length) {
    const tx = wk.path[wk.i][0], ty = wk.path[wk.i][1], dx = tx - wk.x, dy = ty - wk.y, d = Math.hypot(dx, dy);
    const slope = d > 1e-6 ? (heightAt(w, wk.x + dx / d * 0.3, wk.y + dy / d * 0.3) - heightAt(w, wk.x, wk.y)) / 0.3 : 0;
    const f = clamp(1 - 0.35 * slope, 0.65, 1.12) * (inWater(w, wk.x, wk.y) ? 0.7 : 1), adv = Math.min(left * f, d);
    if (d > 1e-6) { const [nx, ny] = moveWithCollision(w, wk.x, wk.y, dx / d * adv, dy / d * adv); wk.dx = dx / d; wk.dy = dy / d; wk.t = (wk.t + adv * 0.55) % 1; if (Math.hypot(nx - wk.x, ny - wk.y) < adv * 0.2) { wk.path = null; wk.moving = false; break; } wk.x = nx; wk.y = ny; }
    left -= d > 1e-6 ? adv / f : left;
    if (adv >= d - 1e-6) wk.i++;
  }
  if (wk.path && wk.i >= wk.path.length) { wk.path = null; wk.moving = false; wk.arrived = true; }
  return wk;
}
