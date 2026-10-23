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
// ława wzdłuż osi x: siedzisko z deski, oparcie z dwóch listew, nogi i podpórki jako bryły izometryczne
export function bench(g, x, y, sc = 1) {
  const { blob } = kit(g);
  blob(x + 3, y + 1, 20 * sc, 5, '#000', 0.2);
  const wood = '#a8703a', cols = (d) => ({ left: shade(wood, -0.1 + d), right: shade(wood, 0.02 + d), top: shade(wood, 0.12 + d) });
  for (const dx of [-9, 9]) isoBox(g, x + dx * 0.894 * sc, y + dx * 0.447 * sc, 2.6 * sc, 7 * sc, 7 * sc, { left: '#6a3f1c', right: '#7a4a24', top: '#8a5a2c' });
  isoBox(g, x, y - 7 * sc, 25 * sc, 7.5 * sc, 2.4 * sc, cols(0));
  // oparcie przy tylnej krawędzi siedziska (w głąb: kierunek -y osi izometrii)
  const bx = x + 3.4 * 0.894 * sc, by = y - 3.4 * 0.447 * sc - 7 * sc;
  for (const dx of [-10.5, 10.5]) isoBox(g, bx + dx * 0.894 * sc, by + dx * 0.447 * sc, 2 * sc, 2 * sc, 11 * sc, { left: '#6a3f1c', right: '#7a4a24', top: '#8a5a2c' });
  for (const z of [4, 7.6]) { const P = isoBox(g, bx, by - z * sc, 25 * sc, 1.4 * sc, 2.6 * sc, cols(0.02)); }
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
// wóz stoi wzdłuż osi x: skrzynia z deskami burt, koło ze szprychami i obręczą, ładunek zależny od ziarna
export function cart(g, x, y, sc = 1, seed = 1) {
  const { poly, ln, blob, circ } = kit(g), r = rng(seed);
  blob(x + 4, y + 1, 28 * sc, 6, '#000', 0.2);
  const wood = '#a8703a', Lw = plane('L', x - 4 * sc, y - 5.5 * sc);
  poly(planeEllipse(Lw, 0, 0, 8 * sc, 8 * sc), '#6a3f1c', 1.8);
  poly(planeEllipse(Lw, 0, 0, 6 * sc, 6 * sc), '#8a5a2a', 1);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; ln([Lw(0, 0), Lw(Math.cos(a) * 6 * sc, Math.sin(a) * 6 * sc)], 1.1, '#4a2c14'); }
  poly(planeEllipse(Lw, 0, 0, 2 * sc, 2 * sc), '#4a2c14', 1);
  const P = isoBox(g, x, y - 9 * sc, 28 * sc, 15 * sc, 7 * sc, { left: shade(wood, -0.1), right: shade(wood, 0.02), top: shade(wood, 0.1) });
  ln([P(-14 * sc, 7.5 * sc, 3.5 * sc), P(14 * sc, 7.5 * sc, 3.5 * sc)], 1, 'rgba(58,36,20,.7)');
  const load = r.pick(['sacks', 'barrels', 'crates', 'hay']), top = 7 * sc;
  if (load === 'sacks') { for (const [dx, dy] of [[-7, 0], [2, 1], [10, -1]]) { const q = P(dx * sc, dy * sc, top); sack(g, q[0], q[1], sc * 0.9); } }
  if (load === 'barrels') { for (const dx of [-6, 6]) { const q = P(dx * sc, 0, top); barrel(g, q[0], q[1], sc * 0.8, seed); } }
  if (load === 'crates') { for (const dx of [-6, 7]) { const q = P(dx * sc, 0, top); crate(g, q[0], q[1], sc * 0.75, seed + dx); } }
  if (load === 'hay') { const q = P(0, 0, top); haybale(g, q[0] - 3 * sc, q[1] + 3 * sc, sc * 0.9); }
  ln([P(14 * sc, 0, 3 * sc), [x + 32 * sc * 0.894, y + 6 * sc]], 2.6, OUT); ln([P(14 * sc, 0, 3 * sc), [x + 32 * sc * 0.894, y + 6 * sc]], 1.5, '#6a3f1c');
}
// grób po poległym: kamienna płyta z krzyżem na kopcu ziemi. Blokuje ruch i linię widzenia, więc ma być czytelny z daleka
export function grave(g, x, y, sc = 1) {
  const { blob, ln, poly } = kit(g);
  blob(x + 3, y + 1, 15 * sc, 5, '#000', 0.28); blob(x, y - 2, 13 * sc, 4.5, '#5a4a38', 1); blob(x - 2, y - 3.5, 8 * sc, 2.4, '#7a6a52', 0.8);
  isoBox(g, x, y - 3 * sc, 9 * sc, 4 * sc, 16 * sc, { left: '#6e6e76', right: '#8e8e98', top: '#a8a8b2' });
  ln([[x, y - 21 * sc], [x, y - 12 * sc]], 1.6, '#3a3a42'); ln([[x - 3 * sc, y - 17.5 * sc], [x + 3 * sc, y - 17.5 * sc]], 1.6, '#3a3a42');
}
// chmura popiołu: kilka półprzezroczystych kłębów, zasłania widok
export function ashCloud(g, x, y, sc = 1, seed = 1) {
  const { blob } = kit(g), r = rng(seed);
  blob(x, y - 4, 24 * sc, 9 * sc, '#2a2a30', 0.18);
  for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = r() * 11 * sc; blob(x + Math.cos(a) * d * 1.3, y - 12 * sc + Math.sin(a) * d * 0.7 - i * 2, (9 + r() * 6) * sc, (6 + r() * 4) * sc, r() < 0.5 ? '#8a8a92' : '#6a6a72', 0.5); }
  for (let i = 0; i < 4; i++) blob(x + (r() - 0.5) * 26 * sc, y - 16 * sc - r() * 10 * sc, (5 + r() * 4) * sc, (4 + r() * 3) * sc, '#b8b8c0', 0.35);
}
// ślady na ziemi: leżą płasko w osiach izometrii (spłaszczone elipsy), żeby arena wyglądała na używaną
export function bloodSplat(g, x, y, sc = 1, seed = 1) {
  const { blob, ln } = kit(g), r = rng(seed * 31 + 7);
  blob(x, y, r.range(12, 20) * sc, r.range(5, 9) * sc, '#3a0c0c', 0.55);
  for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = r.range(8, 22) * sc; blob(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5, r.range(1.2, 3.6) * sc, r.range(0.7, 1.8) * sc, '#4a1010', 0.6); }
  for (let i = 0; i < 3; i++) { const a = r() * 6.28, d = r.range(10, 18) * sc; ln([[x, y], [x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5]], r.range(0.8, 1.6), 'rgba(70,12,12,.5)'); }
  blob(x - 2 * sc, y - 1, 7 * sc, 2.6 * sc, '#6a1818', 0.35);
}
export function bones(g, x, y, sc = 1, seed = 1) {
  const { ln, ell, poly, blob } = kit(g), r = rng(seed * 17 + 3), bone = '#cbbfa4', dk = '#7a705c';
  blob(x + 1, y + 1, 12 * sc, 3.6 * sc, '#000', 0.25);
  for (let i = 0; i < 3; i++) { const a = r.range(-0.5, 0.5) + i * 1.1, l = r.range(7, 11) * sc, cx = x + r.range(-4, 4) * sc, cy = y + r.range(-1, 1) * sc, dx = Math.cos(a) * l, dy = Math.sin(a) * l * 0.5; ln([[cx - dx, cy - dy], [cx + dx, cy + dy]], 3.4 * sc, OUT); ln([[cx - dx, cy - dy], [cx + dx, cy + dy]], 2 * sc, bone); ell(cx + dx, cy + dy, 2 * sc, 1.4 * sc, bone, 1); ell(cx - dx, cy - dy, 2 * sc, 1.4 * sc, bone, 1); }
  const sx = x + r.range(-5, 5) * sc, sy = y - 1;
  ell(sx, sy - 2 * sc, 5 * sc, 4.2 * sc, bone, 1.6); poly([[sx - 2.6 * sc, sy + 1 * sc], [sx + 2.6 * sc, sy + 1 * sc], [sx + 1.8 * sc, sy + 3.6 * sc], [sx - 1.8 * sc, sy + 3.6 * sc]], dk, 1.2);
  ell(sx - 1.8 * sc, sy - 2.2 * sc, 1.3 * sc, 1.5 * sc, '#1a1210', 0); ell(sx + 1.8 * sc, sy - 2.2 * sc, 1.3 * sc, 1.5 * sc, '#1a1210', 0);
}
export function crack(g, x, y, sc = 1, seed = 1) {
  const { ln } = kit(g), r = rng(seed * 23 + 5);
  let px = x - 10 * sc, py = y;
  const pts = [[px, py]]; for (let i = 0; i < 6; i++) { px += r.range(3, 6) * sc; py += r.range(-2.2, 2.2) * sc * 0.6; pts.push([px, py]); if (r() < 0.4) ln([[px, py], [px + r.range(-4, 4) * sc, py + r.range(2, 5) * sc * 0.5]], 0.9, 'rgba(0,0,0,.55)'); }
  ln(pts, 1.6, 'rgba(0,0,0,.6)'); ln(pts.map(([a, b]) => [a + 0.6, b + 0.8]), 0.7, 'rgba(255,255,255,.12)');
}
// ślady lochów: kopce ziemi (Kopacze), pajęczyny i kokony (Gniazdo)
export function mound(g, x, y, sc = 1, seed = 1) {
  const { blob, ln } = kit(g), r = rng(seed * 41 + 9);
  blob(x + 2, y + 1, 13 * sc, 4.6 * sc, '#000', 0.3);
  for (let i = 0; i < 3; i++) blob(x + r.range(-6, 6) * sc, y - i * 2.2 * sc, (11 - i * 3) * sc, (4.4 - i * 0.9) * sc, i % 2 ? '#6a5236' : '#54402a', 1);
  blob(x - 3 * sc, y - 4 * sc, 5 * sc, 1.6 * sc, '#8a7050', 0.55);
  for (let i = 0; i < 5; i++) blob(x + r.range(-14, 14) * sc, y + r.range(-2, 4) * sc, r.range(0.8, 1.8) * sc, r.range(0.5, 1) * sc, '#3a2a1a', 0.8);
  ln([[x + 8 * sc, y + 1], [x + 15 * sc, y + 3]], 1.2, 'rgba(0,0,0,.4)');
}
export function web(g, x, y, sc = 1, seed = 1) {
  const { ln } = kit(g), r = rng(seed * 43 + 11), n = r.int(5, 7), R = r.range(13, 20) * sc, a0 = r.range(0, 6.28), col = 'rgba(226,226,240,.5)';
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * 6.28; ln([[x, y], [x + Math.cos(a) * R, y + Math.sin(a) * R * 0.5]], 0.9, col); }
  for (const k of [0.35, 0.65, 1]) { const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * 6.28, rr = R * k * (i % 2 ? 0.88 : 1); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.5]); } ln(pts, 0.8, col); }
}
export function eggs(g, x, y, sc = 1, seed = 1) {
  const { blob, ell } = kit(g), r = rng(seed * 47 + 13);
  blob(x, y + 1, 12 * sc, 4 * sc, '#000', 0.3);
  for (let i = 0; i < r.int(4, 7); i++) { const ex = x + r.range(-9, 9) * sc, ey = y + r.range(-3, 2) * sc, s = r.range(2.6, 4.2) * sc; ell(ex, ey - s, s, s * 1.2, '#cfcbbf', 1.4); blob(ex - s * 0.3, ey - s * 1.4, s * 0.35, s * 0.4, '#fff', 0.5); blob(ex, ey - s * 0.4, s * 0.8, s * 0.5, 'rgba(60,50,80,.3)', 1); }
  for (let i = 0; i < 6; i++) blob(x + r.range(-13, 13) * sc, y + r.range(-4, 3) * sc, r.range(3, 6) * sc, 0.7 * sc, 'rgba(220,220,235,.35)', 1);
}
export const DECALS = { bloodSplat, bones, crack, mound, web, eggs };
export const PROPS = { mound, web, eggs, bloodSplat, bones, crack, ashCloud, grave, barrel, crate, logs, pot, bench, haybale, sack, lampPost, cart };
