// Drobne rekwizyty przy budynkach i na ulicy. Punkt (x,y) to środek podstawy.
import { kit, OUT } from './kit.js';
import { rng } from './rng.js';
import { shade } from './color.js';

export function barrel(g, x, y, sc = 1, seed = 1) {
  const { poly, ln, ell, lg, blob } = kit(g), r = rng(seed);
  const w = 7 * sc, h = 15 * sc, col = r.pick(['#a8703a', '#8a5a2a', '#b88048']);
  blob(x + 3, y + 1, w + 3, 3, '#000', 0.2);
  g.beginPath(); g.moveTo(x - w * 0.85, y - h); g.bezierCurveTo(x - w * 1.25, y - h * 0.6, x - w * 1.25, y - h * 0.3, x - w * 0.85, y);
  g.lineTo(x + w * 0.85, y); g.bezierCurveTo(x + w * 1.25, y - h * 0.3, x + w * 1.25, y - h * 0.6, x + w * 0.85, y - h); g.closePath();
  g.fillStyle = lg(x - w, 0, x + w, 0, shade(col, 0.08), shade(col, -0.12)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
  for (const t of [0.28, 0.72]) ln([[x - w * 1.15, y - h * t], [x + w * 1.15, y - h * t]], 1.6, '#4a4a52');
  ell(x, y - h, w * 0.85, 3, shade(col, -0.06), 1.6);
  ell(x, y - h, w * 0.5, 1.6, shade(col, -0.16), 0);
}
export function crate(g, x, y, sc = 1, seed = 1) {
  const { poly, ln, blob } = kit(g), r = rng(seed), col = r.pick(['#b8844a', '#a67238', '#c49458']);
  const a = 8 * sc, hh = 4 * sc, h = 11 * sc;
  blob(x + 4, y + 1, a + 4, 4, '#000', 0.2);
  poly([[x - a, y - hh], [x, y], [x, y - h], [x - a, y - h - hh]], shade(col, -0.1), 1.6);
  poly([[x, y], [x + a, y - hh], [x + a, y - h - hh], [x, y - h]], shade(col, 0.02), 1.6);
  poly([[x - a, y - h - hh], [x, y - h], [x + a, y - h - hh], [x, y - h - hh * 2]], shade(col, 0.12), 1.6);
  ln([[x - a, y - h * 0.5 - hh], [x, y - h * 0.5]], 1, 'rgba(58,36,20,.7)'); ln([[x, y - h * 0.5], [x + a, y - h * 0.5 - hh]], 1, 'rgba(58,36,20,.7)');
  ln([[x - a * 0.5, y - hh * 1.5], [x - a * 0.5, y - h - hh * 1.5]], 1.2, 'rgba(58,36,20,.7)');
}
export function logs(g, x, y, sc = 1) {
  const { circ, blob } = kit(g);
  blob(x + 3, y + 1, 16 * sc, 4, '#000', 0.2);
  const rows = [[-8, -4, 0, 4, 8], [-6, -2, 2, 6], [-4, 0, 4], [-2, 2]];
  rows.forEach((row, ri) => row.forEach((dx) => { const cx = x + dx * sc, cy = y - 4 * sc - ri * 6.5 * sc; circ(cx, cy, 4 * sc, '#c08a50', 1.5); circ(cx, cy, 2.2 * sc, '#e0b078', 0); circ(cx, cy, 0.8 * sc, '#a06a38', 0); }));
}
export function pot(g, x, y, sc = 1, seed = 1) {
  const { poly, circ, ln, blob } = kit(g), r = rng(seed);
  blob(x + 2, y + 1, 7 * sc, 2.5, '#000', 0.2);
  poly([[x - 5 * sc, y - 8 * sc], [x + 5 * sc, y - 8 * sc], [x + 3.5 * sc, y], [x - 3.5 * sc, y]], '#c8683a', 1.5);
  poly([[x - 6 * sc, y - 10 * sc], [x + 6 * sc, y - 10 * sc], [x + 5 * sc, y - 7 * sc], [x - 5 * sc, y - 7 * sc]], '#d87a4a', 1.4);
  circ(x, y - 14 * sc, 5 * sc, '#4f9a3a', 1.4);
  for (let i = 0; i < 4; i++) circ(x + (r() - 0.5) * 9 * sc, y - 14 * sc + (r() - 0.7) * 6 * sc, 1.8 * sc, r.pick(['#e8483a', '#f0c83a', '#f07aa8', '#fff']), 0.8);
}
export function bench(g, x, y, sc = 1) {
  const { poly, ln, blob } = kit(g);
  blob(x + 3, y + 1, 14 * sc, 3, '#000', 0.2);
  for (const dx of [-9, 8]) { poly([[x + dx * sc - 1.5, y - 5 * sc], [x + dx * sc + 1.5, y - 5 * sc], [x + dx * sc + 1.5, y], [x + dx * sc - 1.5, y]], '#6a3f1c', 1.2); }
  poly([[x - 12 * sc, y - 8 * sc], [x + 12 * sc, y - 8 * sc], [x + 12 * sc, y - 5 * sc], [x - 12 * sc, y - 5 * sc]], '#a8703a', 1.5);
  poly([[x - 12 * sc, y - 14 * sc], [x + 12 * sc, y - 14 * sc], [x + 12 * sc, y - 11 * sc], [x - 12 * sc, y - 11 * sc]], '#b8804a', 1.5);
}
export function haybale(g, x, y, sc = 1) {
  const { ell, ln, blob } = kit(g);
  blob(x + 3, y + 1, 13 * sc, 4, '#000', 0.2);
  ell(x, y - 8 * sc, 11 * sc, 8 * sc, '#e2c25a', 1.7);
  ell(x + 2 * sc, y - 8 * sc, 7 * sc, 5 * sc, '#efd479', 0);
  for (let i = 0; i < 5; i++) ln([[x - 8 * sc + i * 3.5 * sc, y - 12 * sc], [x - 7 * sc + i * 3.5 * sc, y - 4 * sc]], 0.9, 'rgba(120,80,20,.5)');
}
export function sack(g, x, y, sc = 1) {
  const { poly, blob, ln } = kit(g);
  blob(x + 2, y + 1, 8 * sc, 2.5, '#000', 0.2);
  g.beginPath(); g.moveTo(x - 6 * sc, y); g.bezierCurveTo(x - 9 * sc, y - 8 * sc, x - 4 * sc, y - 11 * sc, x - 2 * sc, y - 12 * sc); g.lineTo(x + 2 * sc, y - 12 * sc); g.bezierCurveTo(x + 4 * sc, y - 11 * sc, x + 9 * sc, y - 8 * sc, x + 6 * sc, y); g.closePath();
  g.fillStyle = '#d8c08a'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
  ln([[x - 3 * sc, y - 11 * sc], [x + 3 * sc, y - 11 * sc]], 1.6, '#8a5a2a');
}
export function lampPost(g, x, y, sc = 1) {
  const { poly, ln, blob, circ } = kit(g);
  blob(x + 3, y + 1, 7 * sc, 2.5, '#000', 0.2);
  poly([[x - 1.6 * sc, y], [x + 1.6 * sc, y], [x + 1.2 * sc, y - 34 * sc], [x - 1.2 * sc, y - 34 * sc]], '#3a3a42', 1.2);
  blob(x, y - 38 * sc, 14 * sc, 14 * sc, '#ffd84a', 0.22);
  poly([[x - 4 * sc, y - 33 * sc], [x + 4 * sc, y - 33 * sc], [x + 4.5 * sc, y - 41 * sc], [x - 4.5 * sc, y - 41 * sc]], '#ffe27a', 1.4);
  poly([[x - 6 * sc, y - 41 * sc], [x + 6 * sc, y - 41 * sc], [x, y - 47 * sc]], '#3a3a42', 1.4);
}
export function cart(g, x, y, sc = 1) {
  const { poly, ln, circ, blob } = kit(g);
  blob(x + 4, y + 1, 22 * sc, 5, '#000', 0.2);
  poly([[x - 18 * sc, y - 8 * sc], [x + 14 * sc, y - 8 * sc], [x + 16 * sc, y - 18 * sc], [x - 16 * sc, y - 18 * sc]], '#a8703a', 1.8);
  for (let i = 0; i < 4; i++) ln([[x - 12 * sc + i * 8 * sc, y - 18 * sc], [x - 12 * sc + i * 8 * sc, y - 8 * sc]], 1, 'rgba(58,36,20,.6)');
  circ(x - 4 * sc, y - 5 * sc, 7 * sc, '#8a5a2a', 1.8); circ(x - 4 * sc, y - 5 * sc, 2 * sc, '#4a2c14', 1);
  ln([[x + 14 * sc, y - 12 * sc], [x + 30 * sc, y - 4 * sc]], 2.4, '#6a3f1c');
}
export const PROPS = { barrel, crate, logs, pot, bench, haybale, sack, lampPost, cart };
