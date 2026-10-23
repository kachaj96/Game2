// Scena z gotowego obrazu: siatka kafli nałożona na obraz przez przekształcenie perspektywiczne (cztery punkty), maska kolizji z kształtów,
// ścieżki A* i chód po tej siatce. Czysta logika, bez rysowania. Współrzędne obrazu w pikselach pliku, współrzędne siatki w kaflach.

// homografia: 4 pary punktów (siatka -> obraz), rozwiązanie układu 8 x 8
export function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  const n = 8; for (let i = 0; i < n; i++) A[i].push(b[i]);
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; } }
  const h = A.map((row, i) => row[n] / row[i]); return [...h, 1];
}
const apply = (h, x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
export class Projection {
  // plaza: четыре punkty siatki (np. narożniki placu) i ich położenie na obrazie
  constructor(gridPts, imgPts) { this.h = homography(gridPts, imgPts); this.hi = homography(imgPts, gridPts); }
  toImage(gx, gy) { return apply(this.h, gx, gy); }
  toGrid(ix, iy) { return apply(this.hi, ix, iy); }
  // lokalny rozmiar kafla w pikselach obrazu w punkcie siatki (szerokość i wysokość rombu)
  tileSize(gx, gy) { const a = this.toImage(gx, gy), r = this.toImage(gx + 1, gy), d = this.toImage(gx + 1, gy + 1), l = this.toImage(gx, gy + 1); return [Math.abs(r[0] - l[0]), Math.abs(d[1] - a[1])]; }
}
const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
export { inPoly };

// maska kolizji: kafel jest zajęty, gdy choć 2 z 5 próbek (środek i cztery punkty pośrednie) leżą w kształcie
export function buildMask(cols, rows, proj, shapes, walkArea = null) {
  const m = new Uint8Array(cols * rows), S = [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let hit = 0, out = 0;
    for (const [fx, fy] of S) { const p = proj.toImage(x + fx, y + fy); if (shapes.some((s) => inPoly(p, s))) hit++; if (walkArea && !inPoly(p, walkArea)) out++; }
    if (hit >= 2 || out >= 3) m[y * cols + x] = 1;
  }
  return m;
}
export const tileBlocked = (sc, x, y) => x < 0 || y < 0 || x >= sc.cols || y >= sc.rows || sc.mask[y * sc.cols + x] !== 0;
export function freeAt(sc, x, y, r = 0.28) {
  for (const [ox, oy] of [[0, 0], [-r, -r], [r, -r], [-r, r], [r, r]]) if (tileBlocked(sc, Math.floor(x + ox), Math.floor(y + oy))) return false;
  return true;
}
export function lineFree(sc, a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2); for (let i = 1; i <= n; i++) if (!freeAt(sc, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)) return false; return true; }
export function findPath(sc, from, to) {
  const { cols, rows } = sc, k = (x, y) => y * cols + x; let tx = Math.floor(to[0]), ty = Math.floor(to[1]);
  if (tileBlocked(sc, tx, ty)) { let best = null, bd = 1e9; for (let y = ty - 4; y <= ty + 4; y++) for (let x = tx - 4; x <= tx + 4; x++) if (!tileBlocked(sc, x, y)) { const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; } } if (!best) return null; [tx, ty] = best; to = [tx + 0.5, ty + 0.5]; }
  const sx = Math.floor(from[0]), sy = Math.floor(from[1]), g = new Float32Array(cols * rows).fill(1e9), prev = new Int32Array(cols * rows).fill(-1), done = new Uint8Array(cols * rows), open = [[0, sx, sy]];
  g[k(sx, sy)] = 0; const h = (x, y) => Math.hypot(x - tx, y - ty);
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]); const [, x, y] = open.shift(), kk = k(x, y); if (done[kk]) continue; done[kk] = 1; if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy; if (tileBlocked(sc, nx, ny) || (dx && dy && (tileBlocked(sc, x + dx, y) || tileBlocked(sc, x, y + dy)))) continue;
      const ng = g[kk] + (dx && dy ? 1.414 : 1), nk = k(nx, ny); if (ng < g[nk]) { g[nk] = ng; prev[nk] = kk; open.push([ng + h(nx, ny), nx, ny]); }
    }
  }
  if (!done[k(tx, ty)]) return null;
  const pts = [to]; for (let c = k(tx, ty); c !== k(sx, sy); c = prev[c]) { const p = prev[c]; if (p < 0) return null; pts.unshift([(p % cols) + 0.5, Math.floor(p / cols) + 0.5]); }
  pts[0] = [from[0], from[1]]; pts.splice(0, 0);
  // wygładzenie: pomijamy punkty, jeśli odcinek prosty jest wolny
  const out = [pts[0]]; let i = 0; while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !lineFree(sc, pts[i], pts[j])) j--; out.push(pts[j]); i = j; } return out;
}
export const pathLength = (p) => { let l = 0; for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; };
export function newWalker(x, y) { return { x, y, path: null, i: 0, t: 0, moving: false, dx: 0, dy: 1, arrived: false }; }
export function setPath(w, path) { w.path = path && path.length > 1 ? path : null; w.i = 1; w.moving = !!w.path; w.arrived = false; }
export function stepWalker(sc, w, dt, speed = 3.5) {
  if (!w.moving || !w.path) { w.moving = false; return w; } let left = speed * dt;
  while (left > 1e-6 && w.path && w.i < w.path.length) {
    const [tx, ty] = w.path[w.i], dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy), adv = Math.min(left, d);
    if (d > 1e-6) { const nx = w.x + dx / d * adv, ny = w.y + dy / d * adv; if (!freeAt(sc, nx, ny)) { const end = w.path[w.path.length - 1]; w.arrived = Math.hypot(end[0] - w.x, end[1] - w.y) < 1.3; w.path = null; w.moving = false; break; } w.x = nx; w.y = ny; w.dx = dx / d; w.dy = dy / d; w.t = (w.t + adv * 0.55) % 1; }
    left -= adv; if (adv >= d - 1e-6) w.i++;
  }
  if (w.path && w.i >= w.path.length) { w.path = null; w.moving = false; w.arrived = true; } return w;
}
