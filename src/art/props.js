// Drobne rekwizyty przy budynkach i na ulicy. Punkt (x,y) to środek podstawy. Wszystko leży w osiach izometrii, nie wprost na ekran.
import { kit, OUT, plane, planeEllipse, isoBox, isoCylinder } from './kit.js';
import { rng } from './rng.js';
import { shade } from './color.js';

export function barrel(g, x, y, sc = 1, seed = 1) {
  const { ln, ell, lg, blob } = kit(g), r = rng(seed);
  const w = 7 * sc, h = 15 * sc, col = r.pick(['#a8703a', '#8a5a2a', '#b88048']);
  blob(x + 3, y + 1, w + 3, 3, '#000', 0.2);
  g.beginPath(); g.moveTo(x - w * 0.85, y - h); g.bezierCurveTo(x - w * 1.25, y - h * 0.6, x - w * 1.25, y - h * 0.3, x - w * 0.85, y);
  g.lineTo(x + w * 0.85, y); g.bezierCurveTo(x + w * 1.25, y - h * 0.3, x + w * 1.25, y - h * 0.6, x + w * 0.85, y - h); g.closePath();
  g.fillStyle = lg(x - w, 0, x + w, 0, shade(col, 0.08), shade(col, -0.12)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
  for (const t of [0.28, 0.72]) { ln([[x - w * 1.15, y - h * t - 1.5], [x, y - h * t + 1.5], [x + w * 1.15, y - h * t - 1.5]], 1.6, '#4a4a52'); }
  ell(x, y - h, w * 0.85, 3, shade(col, -0.06), 1.6);
  ell(x, y - h, w * 0.5, 1.6, shade(col, -0.16), 0);
}
export function crate(g, x, y, sc = 1, seed = 1) {
  const { ln, blob } = kit(g), r = rng(seed), col = r.pick(['#b8844a', '#a67238', '#c49458']);
  const s = 12 * sc;
  blob(x + 4, y + 1, s * 0.9, 4, '#000', 0.2);
  const P = isoBox(g, x, y, s, s, 11 * sc, { left: shade(col, -0.1), right: shade(col, 0.02), top: shade(col, 0.12) });
  const hh = 11 * sc;
  ln([P(-s / 2, s / 2, hh * 0.5), P(s / 2, s / 2, hh * 0.5)], 1, 'rgba(58,36,20,.7)'); ln([P(s / 2, s / 2, hh * 0.5), P(s / 2, -s / 2, hh * 0.5)], 1, 'rgba(58,36,20,.7)');
  ln([P(0, s / 2, 0), P(0, s / 2, hh)], 1.2, 'rgba(58,36,20,.7)');
}
// stos kłód ułożonych wzdłuż osi x: końce są elipsami w płaszczyźnie ściany, nie kółkami wprost na ekran
export function logs(g, x, y, sc = 1) {
  const { blob } = kit(g);
  blob(x + 3, y + 1, 18 * sc, 5, '#000', 0.2);
  const rows = [[-1.5, -0.5, 0.5, 1.5], [-1, 0, 1], [-0.5, 0.5]], R = 4.2 * sc;
  rows.forEach((row, ri) => row.forEach((k) => {
    const ex0 = x + k * 8.4 * sc * -0.447 + 0, ey0 = y - R - ri * 7.2 * sc + k * 8.4 * sc * 0.894 * 0.5;
    isoCylinder(g, ex0, ey0, R, 15 * sc, '#a8703a', '#c08a50', '#e0b078');
  }));
}
export function pot(g, x, y, sc = 1, seed = 1) {
  const { poly, circ, blob } = kit(g), r = rng(seed);
  blob(x + 2, y + 1, 7 * sc, 2.5, '#000', 0.2);
  poly([[x - 5 * sc, y - 8 * sc], [x + 5 * sc, y - 8 * sc], [x + 3.5 * sc, y], [x - 3.5 * sc, y]], '#c8683a', 1.5);
  poly([[x - 6 * sc, y - 10 * sc], [x + 6 * sc, y - 10 * sc], [x + 5 * sc, y - 7 * sc], [x - 5 * sc, y - 7 * sc]], '#d87a4a', 1.4);
  circ(x, y - 14 * sc, 5 * sc, '#4f9a3a', 1.4);
  for (let i = 0; i < 4; i++) circ(x + (r() - 0.5) * 9 * sc, y - 14 * sc + (r() - 0.7) * 6 * sc, 1.8 * sc, r.pick(['#e8483a', '#f0c83a', '#f07aa8', '#fff']), 0.8);
}
// ława wzdłuż osi x: siedzisko, oparcie i nogi jako bryły izometryczne
export function bench(g, x, y, sc = 1) {
  const { blob } = kit(g);
  blob(x + 3, y + 1, 20 * sc, 5, '#000', 0.2);
  const wood = '#a8703a', cols = { left: shade(wood, -0.1), right: shade(wood, 0.02), top: shade(wood, 0.12) };
  for (const dx of [-9, 9]) isoBox(g, x + dx * 0.894 * sc, y + dx * 0.447 * sc, 2.6 * sc, 6 * sc, 6 * sc, { left: '#6a3f1c', right: '#7a4a24', top: '#8a5a2c' });
  isoBox(g, x, y - 6 * sc, 24 * sc, 7 * sc, 2.6 * sc, cols);
  isoBox(g, x - 3.4 * sc, y - 6 * sc - 1.7 * sc, 24 * sc, 2 * sc, 7 * sc, { left: shade(wood, -0.06), right: shade(wood, 0.06), top: shade(wood, 0.16) });
}
// bela siana leży bokiem wzdłuż osi x
export function haybale(g, x, y, sc = 1) {
  const { blob, ln } = kit(g);
  blob(x + 3, y + 1, 15 * sc, 4.5, '#000', 0.2);
  isoCylinder(g, x + 4 * sc, y - 8.5 * sc, 8.5 * sc, 14 * sc, '#dcb84e', '#efd479', '#e2c25a');
  const Lp = plane('R', x + 4 * sc, y - 8.5 * sc);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; ln([Lp(Math.cos(a) * 2.5, Math.sin(a) * 2.5), Lp(Math.cos(a) * 7, Math.sin(a) * 7)], 0.9, 'rgba(120,80,20,.55)'); }
}
export function sack(g, x, y, sc = 1) {
  const { blob, ln } = kit(g);
  blob(x + 2, y + 1, 8 * sc, 2.5, '#000', 0.2);
  g.beginPath(); g.moveTo(x - 6 * sc, y); g.bezierCurveTo(x - 9 * sc, y - 8 * sc, x - 4 * sc, y - 11 * sc, x - 2 * sc, y - 12 * sc); g.lineTo(x + 2 * sc, y - 12 * sc); g.bezierCurveTo(x + 4 * sc, y - 11 * sc, x + 9 * sc, y - 8 * sc, x + 6 * sc, y); g.closePath();
  g.fillStyle = '#d8c08a'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
  ln([[x - 3 * sc, y - 11 * sc], [x + 3 * sc, y - 11 * sc]], 1.6, '#8a5a2a');
}
export function lampPost(g, x, y, sc = 1) {
  const { poly, blob } = kit(g);
  blob(x + 3, y + 1, 7 * sc, 2.5, '#000', 0.2);
  poly([[x - 1.6 * sc, y], [x + 1.6 * sc, y], [x + 1.2 * sc, y - 34 * sc], [x - 1.2 * sc, y - 34 * sc]], '#3a3a42', 1.2);
  blob(x, y - 38 * sc, 14 * sc, 14 * sc, '#ffd84a', 0.22);
  const Lp = plane('L', x, y - 37 * sc);
  poly([Lp(-4.5, -4), Lp(4.5, -4), Lp(4.5, 4), Lp(-4.5, 4)], '#ffe27a', 1.4);
  poly([Lp(-6.5, 4), Lp(6.5, 4), Lp(0, 10)], '#3a3a42', 1.4);
}
// wóz stoi wzdłuż osi x: skrzynia jako bryła, koło jako elipsa w płaszczyźnie boku
export function cart(g, x, y, sc = 1) {
  const { poly, ln, blob } = kit(g);
  blob(x + 4, y + 1, 26 * sc, 6, '#000', 0.2);
  const wood = '#a8703a';
  const Lw = plane('L', x - 4 * sc, y - 5 * sc);
  poly(planeEllipse(Lw, 0, 0, 7.4 * sc, 7.4 * sc), '#8a5a2a', 1.8);
  poly(planeEllipse(Lw, 0, 0, 2.2 * sc, 2.2 * sc), '#4a2c14', 1);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.3; ln([Lw(0, 0), Lw(Math.cos(a) * 7 * sc, Math.sin(a) * 7 * sc)], 1, '#4a2c14'); }
  isoBox(g, x, y - 8 * sc, 26 * sc, 14 * sc, 7 * sc, { left: shade(wood, -0.1), right: shade(wood, 0.02), top: shade(wood, 0.1) });
  ln([[x + 13 * sc * 0.894, y - 8 * sc + 13 * sc * 0.447], [x + 30 * sc * 0.894, y + 4 * sc]], 2.4, '#6a3f1c');
}
export const PROPS = { barrel, crate, logs, pot, bench, haybale, sack, lampPost, cart };
