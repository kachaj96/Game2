// Małe narzędzia rysunkowe: równy ciemny kontur, wypełnienia z gradientem.
import { shade } from './color.js';
export const OUT = '#150c08';
// opt: { out: kolor konturu, w: mnożnik grubości konturu } (postacie używają cieńszego, cieplejszego konturu niż reszta świata)
export function kit(g, opt = {}) {
  const O = opt.out || OUT, K = opt.w || 1;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const lg = (x0, y0, x1, y1, c0, c1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, c0); q.addColorStop(1, c1); return q; };
  const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
  const poly = (pts, fill, lw = 1.8, stroke = O) => {
    lw *= K;
    path(pts); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); if (lw >= 1.2) { g.save(); g.translate(0.5, -0.4); g.lineWidth = lw * 0.5; g.strokeStyle = 'rgba(0,0,0,.4)'; g.stroke(); g.restore(); } }
  };
  const ln = (pts, w, col) => { path(pts); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const blob = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; };
  const circ = (x, y, rad, fill, lw = 1.6, stroke = O) => { lw *= K; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  const ell = (x, y, rx, ry, fill, lw = 1.6, stroke = O) => { lw *= K; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  return { lerp, lg, path, poly, ln, blob, circ, ell };
}

// Kępa liści z kwiatami przy podstawie budowli, drzewa albo skały: kilka nachodzących na siebie listków w trzech odcieniach, cień pod spodem.
// rnd to funkcja 0..1 (np. rng(ziarno)), sc skala.
export function leafClump(g, x, y, sc, rnd, flowers = true) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.globalAlpha = 0.3; g.fillStyle = '#0a1204'; g.beginPath(); g.ellipse(3, 2, 15, 5, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  const cols = ['#2f6a2c', '#4a9a3a', '#86c24e'];
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 5 - layer; i++) {
    const lx = (i - (4 - layer) / 2) * (7 - layer) + (rnd() - 0.5) * 3, ly = -layer * 3.4 - rnd() * 2, rx = 6.2 - layer * 0.8, ry = 4.4 - layer * 0.5, a = (rnd() - 0.5) * 0.9;
    g.beginPath(); g.ellipse(lx, ly, rx, ry, a, 0, 7); g.fillStyle = cols[layer]; g.fill(); g.lineWidth = 0.9; g.strokeStyle = 'rgba(15,40,12,.55)'; g.stroke();
    g.beginPath(); g.ellipse(lx - 1.2, ly - 1.2, rx * 0.5, ry * 0.4, a, 0, 7); g.fillStyle = 'rgba(255,255,200,.16)'; g.fill();
  }
  if (flowers) { const fc = ['#ffd84a', '#f58ab0', '#ffffff', '#b79af0', '#ff8a3a'][Math.floor(rnd() * 5)]; for (let i = 0; i < 4; i++) { const fx = (rnd() - 0.5) * 18, fy = -6 - rnd() * 6; g.fillStyle = fc; g.beginPath(); g.arc(fx, fy, 1.9, 0, 7); g.fill(); g.fillStyle = '#f0a820'; g.beginPath(); g.arc(fx, fy, 0.7, 0, 7); g.fill(); } }
  g.restore();
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
const lgv = (g, y0, y1, c0, c1) => { const q = g.createLinearGradient(0, y0, 0, y1); q.addColorStop(0, c0); q.addColorStop(1, c1); return q; };
export function isoBox(g, cx, cy, lx, ly, h, cols) {
  const { poly } = kit(g), ex = [0.894, 0.447], ey = [-0.894, 0.447];
  const P = (x, y, z = 0) => [cx + x * ex[0] + y * ey[0], cy + x * ex[1] + y * ey[1] - z];
  const a = lx / 2, b = ly / 2;
  poly([P(-a, b), P(a, b), P(a, b, h), P(-a, b, h)], cols.left, 1.6);
  poly([P(a, b), P(a, -b), P(a, -b, h), P(a, b, h)], cols.right, 1.6);
  poly([P(-a, -b, h), P(a, -b, h), P(a, b, h), P(-a, b, h)], cols.top, 1.6);
  // bryła, a nie kartka: ciemniejsze podstawy ścian (zacienienie przy gruncie), jasne krawędzie od strony światła i pionowy narożnik
  if (h > 6) {
    const ao = Math.min(h * 0.45, 16);
    poly([P(-a, b), P(a, b), P(a, b, ao), P(-a, b, ao)], lgv(g, P(0, b, ao)[1], P(0, b, 0)[1], 'rgba(12,8,28,0)', 'rgba(12,8,28,.3)'), 0);
    poly([P(a, b), P(a, -b), P(a, -b, ao), P(a, b, ao)], lgv(g, P(a, 0, ao)[1], P(a, 0, 0)[1], 'rgba(12,8,28,0)', 'rgba(12,8,28,.38)'), 0);
  }
  const hl = kit(g).ln; hl([P(-a, b, h), P(a, b, h)], 1.3, 'rgba(255,255,240,.5)'); hl([P(a, b, h), P(a, -b, h)], 1.1, 'rgba(255,255,240,.22)'); hl([P(a, b, 0), P(a, b, h)], 1.1, 'rgba(255,255,240,.3)');
  return P;
}
// Walec leżący wzdłuż osi x, widoczny od strony +x. E to środek podstawy bliższej widzowi, r promień, len długość w głąb.
export function isoCylinder(g, ex0, ey0, r, len, bodyCol, endCol, ringCol) {
  const { poly, ell } = kit(g), a = AX.R, v = [0, -1], d = [-0.894, -0.447];
  const pt = (t) => [ex0 + r * (Math.cos(t) * a[0] + Math.sin(t) * v[0]), ey0 + r * (Math.cos(t) * a[1] + Math.sin(t) * v[1])];
  const nd = [0.447, -0.894]; let best = [-1e9, 0], worst = [1e9, 0];
  for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2, p = pt(t), s = (p[0] - ex0) * nd[0] + (p[1] - ey0) * nd[1]; if (s > best[0]) best = [s, t]; if (s < worst[0]) worst = [s, t]; }
  const A = pt(best[1]), B = pt(worst[1]);
  { const gg = g.createLinearGradient(A[0], A[1], B[0], B[1]); gg.addColorStop(0, shade(bodyCol, 0.18)); gg.addColorStop(0.5, bodyCol); gg.addColorStop(1, shade(bodyCol, -0.26)); poly([A, [A[0] + d[0] * len, A[1] + d[1] * len], [B[0] + d[0] * len, B[1] + d[1] * len], B], gg, 1.7); }
  poly(planeEllipse(plane('R', ex0, ey0), 0, 0, r / 0.894 * 0.894, r), endCol, 1.7);
  if (ringCol) poly(planeEllipse(plane('R', ex0, ey0), 0, 0, r * 0.52, r * 0.52), ringCol, 0);
}

// Walec stojący pionowo (słup, pień, beczka): eliptyczne podstawa i góra w rzucie 2:1, korpus z gradientem od światła (lewa) przez rdzeń do cienia i odbitego światła
// (prawa krawędź), pierścienie jako łuki elips. rb i rt to promienie dołu i góry, h wysokość w px, o: {ring: [t...], ringCol, top: kolor wierzchu, bulge}.
export function vCyl(g, x, y, rb, rt, h, col, o = {}) {
  const bulge = o.bulge || 0, rAt = (t) => rb + (rt - rb) * t + bulge * Math.sin(Math.PI * t), N = 14;
  const body = () => { g.beginPath(); g.moveTo(x - rb, y); for (let i = 1; i <= 10; i++) { const a = Math.PI - i / 10 * Math.PI; g.lineTo(x + rb * Math.cos(a), y + rb * 0.5 * Math.sin(a)); } for (let i = 0; i <= N; i++) { const t = i / N; g.lineTo(x + rAt(t), y - h * t); } for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI; g.lineTo(x + rt * Math.cos(a), y - h + rt * 0.5 * Math.sin(a)); } for (let i = N; i >= 0; i--) { const t = i / N; g.lineTo(x - rAt(t), y - h * t); } g.closePath(); };
  const rm = Math.max(rb, rt, rAt(0.5));
  const gr = g.createLinearGradient(x - rm, 0, x + rm, 0); gr.addColorStop(0, shade(col, 0.04)); gr.addColorStop(0.22, shade(col, 0.17)); gr.addColorStop(0.55, shade(col, -0.02)); gr.addColorStop(0.88, shade(col, -0.22)); gr.addColorStop(1, shade(col, -0.1));
  body(); g.fillStyle = gr; g.fill();
  // zacienienie przy gruncie i pod górną krawędzią
  g.save(); body(); g.clip(); const ao = g.createLinearGradient(0, y - h, 0, y + rb * 0.5); ao.addColorStop(0, 'rgba(10,6,24,.0)'); ao.addColorStop(0.72, 'rgba(10,6,24,0)'); ao.addColorStop(1, 'rgba(10,6,24,.34)'); g.fillStyle = ao; g.fillRect(x - rm - 2, y - h - 4, rm * 2 + 4, h + rb + 8); g.restore();
  for (const t of o.ring || []) { const rr = rAt(t) + 0.5, yy = y - h * t; g.beginPath(); g.ellipse(x, yy, rr, rr * 0.5, 0, 0.04, Math.PI - 0.04); g.lineWidth = o.ringW || 2; g.strokeStyle = o.ringCol || '#3a3a44'; g.stroke(); g.beginPath(); g.ellipse(x, yy - 0.9, rr, rr * 0.5, 0, 0.5, Math.PI - 0.9); g.lineWidth = 0.8; g.strokeStyle = 'rgba(255,255,240,.38)'; g.stroke(); }
  body(); g.lineWidth = o.lw || 1.4; g.strokeStyle = OUT; g.lineJoin = 'round'; g.stroke();
  // wierzch
  g.beginPath(); g.ellipse(x, y - h, rt, rt * 0.5, 0, 0, Math.PI * 2); const tg = g.createRadialGradient(x - rt * 0.3, y - h - rt * 0.15, 1, x, y - h, rt); tg.addColorStop(0, shade(o.top || col, 0.22)); tg.addColorStop(1, shade(o.top || col, 0.02)); g.fillStyle = tg; g.fill(); g.lineWidth = o.lw || 1.4; g.strokeStyle = OUT; g.stroke();
  g.beginPath(); g.ellipse(x, y - h, rt * 0.86, rt * 0.43, 0, Math.PI * 1.05, Math.PI * 1.7); g.lineWidth = 0.9; g.strokeStyle = 'rgba(255,255,240,.45)'; g.stroke();
}
