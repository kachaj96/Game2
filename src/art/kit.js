// Małe narzędzia rysunkowe: równy ciemny kontur, wypełnienia z gradientem.
export const OUT = '#3a2414';
export function kit(g) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const lg = (x0, y0, x1, y1, c0, c1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, c0); q.addColorStop(1, c1); return q; };
  const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
  const poly = (pts, fill, lw = 1.8, stroke = OUT) => {
    path(pts); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  };
  const ln = (pts, w, col) => { path(pts); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const blob = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; };
  const circ = (x, y, rad, fill, lw = 1.6, stroke = OUT) => { g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  const ell = (x, y, rx, ry, fill, lw = 1.6, stroke = OUT) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  return { lerp, lg, path, poly, ln, blob, circ, ell };
}

// ---- rysowanie w płaszczyznach izometrycznych ----
// Wszystko, co wisi na ścianie albo leży w świecie, musi być rysowane w płaszczyźnie swojej ściany, a nie wprost na ekran.
// Płaszczyzna 'L' to ściana patrząca w lewo-dół (rozpięta wzdłuż osi x), 'R' patrząca w prawo-dół (rozpięta wzdłuż osi y).
export const AX = { L: [0.894, 0.447], R: [0.894, -0.447] };
// zwraca funkcję (u,v) => punkt ekranu, gdzie u biegnie wzdłuż ściany, v w górę, a (bx,by) to początek
export const plane = (kind, bx, by) => { const a = AX[kind]; return (u, v) => [bx + a[0] * u, by + a[1] * u - v]; };
// okrąg lub elipsa w płaszczyźnie: wychodzi poprawnie ściśnięty i pochylony
export function planeEllipse(Lp, cu, cv, ru, rv, n = 20) {
  const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(Lp(cu + Math.cos(a) * ru, cv + Math.sin(a) * rv)); } return pts;
}
// kierunek "w głąb" (od widza) dla ściany danego rodzaju
export const RECEDE = { L: [0.894, -0.447], R: [-0.894, -0.447] };

// Prostopadłościan izometryczny. (cx,cy) to środek podstawy na ekranie, lx i ly to długości wzdłuż osi x i y w pikselach, h wysokość.
export function isoBox(g, cx, cy, lx, ly, h, cols) {
  const { poly } = kit(g), ex = [0.894, 0.447], ey = [-0.894, 0.447];
  const P = (x, y, z = 0) => [cx + x * ex[0] + y * ey[0], cy + x * ex[1] + y * ey[1] - z];
  const a = lx / 2, b = ly / 2;
  poly([P(-a, b), P(a, b), P(a, b, h), P(-a, b, h)], cols.left, 1.6);
  poly([P(a, b), P(a, -b), P(a, -b, h), P(a, b, h)], cols.right, 1.6);
  poly([P(-a, -b, h), P(a, -b, h), P(a, b, h), P(-a, b, h)], cols.top, 1.6);
  return P;
}
// Walec leżący wzdłuż osi x, widoczny od strony +x. E to środek podstawy bliższej widzowi, r promień, len długość w głąb.
export function isoCylinder(g, ex0, ey0, r, len, bodyCol, endCol, ringCol) {
  const { poly, ell } = kit(g), a = AX.R, v = [0, -1], d = [-0.894, -0.447];
  const pt = (t) => [ex0 + r * (Math.cos(t) * a[0] + Math.sin(t) * v[0]), ey0 + r * (Math.cos(t) * a[1] + Math.sin(t) * v[1])];
  const nd = [0.447, -0.894]; let best = [-1e9, 0], worst = [1e9, 0];
  for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2, p = pt(t), s = (p[0] - ex0) * nd[0] + (p[1] - ey0) * nd[1]; if (s > best[0]) best = [s, t]; if (s < worst[0]) worst = [s, t]; }
  const A = pt(best[1]), B = pt(worst[1]);
  poly([A, [A[0] + d[0] * len, A[1] + d[1] * len], [B[0] + d[0] * len, B[1] + d[1] * len], B], bodyCol, 1.7);
  poly(planeEllipse(plane('R', ex0, ey0), 0, 0, r / 0.894 * 0.894, r), endCol, 1.7);
  if (ringCol) poly(planeEllipse(plane('R', ex0, ey0), 0, 0, r * 0.52, r * 0.52), ringCol, 0);
}
