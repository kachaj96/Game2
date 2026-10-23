// Poruszanie się po świecie: wysokość w punkcie, kolizje, ścieżki A* i chód. Czysta logika, bez rysowania.
import { N, WATER } from './kraina.js';
import { clamp } from './noise.js';

export const R_HERO = 0.3, SPEED = 3.5;
const W1 = N + 1;
export function heightAt(w, x, y) {
  const cx = clamp(x, 0, N - 1e-6), cy = clamp(y, 0, N - 1e-6), ix = Math.floor(cx), iy = Math.floor(cy), fx = cx - ix, fy = cy - iy, H = w.heights;
  const a = H[iy * W1 + ix], b = H[iy * W1 + ix + 1], c = H[(iy + 1) * W1 + ix], d = H[(iy + 1) * W1 + ix + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export const tileBlocked = (w, tx, ty) => tx < 0 || ty < 0 || tx >= N || ty >= N || w.blocked[ty * N + tx] !== 0;
export const inWater = (w, x, y) => heightAt(w, x, y) < WATER;
// czy okrąg o promieniu r w punkcie (x,y) nie wchodzi na zablokowane kafle (sprawdzamy narożniki kwadratu)
export const freeAt = (w, x, y, r = R_HERO) => !(tileBlocked(w, Math.floor(x - r), Math.floor(y - r)) || tileBlocked(w, Math.floor(x + r), Math.floor(y - r)) || tileBlocked(w, Math.floor(x - r), Math.floor(y + r)) || tileBlocked(w, Math.floor(x + r), Math.floor(y + r)));
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
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// ścieżka po kaflach, koszt rośnie z podjazdem; wynik wygładzony do odcinków prostych
export function findPath(w, from, to, maxNodes = 90000) {
  const sx = Math.floor(from[0]), sy = Math.floor(from[1]);
  let goal = to; if (tileBlocked(w, Math.floor(to[0]), Math.floor(to[1]))) { goal = nearestFree(w, to[0], to[1]); if (!goal) return null; }
  const gx = Math.floor(goal[0]), gy = Math.floor(goal[1]);
  if (tileBlocked(w, sx, sy)) return null;
  const g = new Float32Array(N * N).fill(1e9), prev = new Int32Array(N * N).fill(-1), done = new Uint8Array(N * N), heap = new Heap(), idx = (x, y) => y * N + x;
  const hz = (x, y) => heightAt(w, x + 0.5, y + 0.5), oct = (dx, dy) => { const ax = Math.abs(dx), ay = Math.abs(dy); return Math.max(ax, ay) + 0.4142 * Math.min(ax, ay); };
  g[idx(sx, sy)] = 0; heap.push(oct(gx - sx, gy - sy), idx(sx, sy));
  let n = 0;
  while (heap.size && n++ < maxNodes) {
    const [, cur] = heap.pop(); if (done[cur]) continue; done[cur] = 1;
    const cx = cur % N, cy = (cur / N) | 0; if (cx === gx && cy === gy) break;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (tileBlocked(w, nx, ny)) continue;
      if (dx && dy && (tileBlocked(w, cx + dx, cy) || tileBlocked(w, cx, cy + dy))) continue;
      const ni = idx(nx, ny); if (done[ni]) continue;
      const dh = hz(nx, ny) - hz(cx, cy), step = (dx && dy ? 1.4142 : 1) * (1 + Math.max(0, dh) * 0.7 + (hz(nx, ny) < WATER ? 0.6 : 0)), ng = g[cur] + step;
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
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 0.2));
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
