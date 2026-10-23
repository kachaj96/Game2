// Mapa z obrazu jako dane (JSON): obraz, dopasowanie siatki, obiekty z podstawą i sylwetką, obszar chodzenia, woda, wyjścia, postacie i ręczne poprawki kafli.
// Ten sam format czyta gra (wioska-mapa.html) i zapisuje edytor kolizji (edytor-kolizji.html).
import { Projection, buildMask, inPoly } from './scene.js';

export const MAP_VERSION = 1;
// rzut afiniczny z czterech punktów placu: gridPts to narożniki placu w kaflach, imgPts ich położenie na obrazie
export function makeProjection(d) {
  const [T, R, , L] = d.imgPts, [g0, g1, , g3] = d.gridPts, w = g1[0] - g0[0], h = g3[1] - g0[1];
  const u = [(R[0] - T[0]) / w, (R[1] - T[1]) / w], v = [(L[0] - T[0]) / h, (L[1] - T[1]) / h];
  const P = (a, b) => [T[0] + (a - g0[0]) * u[0] + (b - g0[1]) * v[0], T[1] + (a - g0[0]) * u[1] + (b - g0[1]) * v[1]];
  return new Projection([g0, g1, [g1[0], g3[1]], g3], [P(g0[0], g0[1]), P(g1[0], g0[1]), P(g1[0], g3[1]), P(g0[0], g3[1])]);
}
// maska kolizji z kształtów, a potem ręczne poprawki kafli (tiles.block / tiles.free to indeksy y * cols + x)
export function buildMap(d) {
  const proj = makeProjection(d), shapes = [...d.blocks.map((o) => o.foot), ...(d.water || [])];
  const mask = buildMask(d.cols, d.rows, proj, shapes, d.walk && d.walk.length > 2 ? d.walk : null);
  for (const k of d.tiles?.block || []) mask[k] = 1; for (const k of d.tiles?.free || []) mask[k] = 0;
  const occ = d.blocks.filter((o) => o.sil && o.sil.length > 2).map((o) => ({ ...o, bx: [Math.min(...o.sil.map((p) => p[0])), Math.max(...o.sil.map((p) => p[0]))] }));
  return { ...d, proj, mask, occ };
}
// najniższy punkt wielokąta (największe y) na pionie x albo null, gdy x poza wielokątem: linia frontu podstawy
export function lowerY(poly, x) {
  let best = null;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((xi <= x && x <= xj) || (xj <= x && x <= xi)) { const y = xi === xj ? Math.max(yi, yj) : yi + (yj - yi) * (x - xi) / (xj - xi); if (best === null || y > best) best = y; } }
  return best;
}
// czy postać ze stopami w (fx,fy) stoi za obiektem: stopy leżą nad linią frontu jego podstawy w tym samym x
export function isBehind(o, fx, fy, margin = 4) { const y = lowerY(o.foot, fx); return y !== null && fy < y - margin; }
export { inPoly };
