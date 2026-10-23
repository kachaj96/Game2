// Drobne rekwizyty przy budynkach i na ulicy. Punkt (x,y) to środek podstawy. Wszystko leży w osiach izometrii, nie wprost na ekran.
import { kit, OUT, plane, planeEllipse, isoBox, isoCylinder, vCyl } from './kit.js';
import { rng } from './rng.js';
import { shade } from './color.js';

export function barrel(g, x, y, sc = 1, seed = 1) {
  const { blob, ln } = kit(g), r = rng(seed), col = r.pick(['#a8703a', '#8a5a2a', '#b88048']);
  const w = 7 * sc, h = 17 * sc;
  blob(x + 4, y + 1, w * 1.7, w * 0.62, '#0a0614', 0.34);
  // klepki: korpus z wybrzuszeniem, obręcze jako łuki elips, deski wierzchu z szczeliną
  vCyl(g, x, y, w * 0.86, w * 0.86, h, col, { bulge: w * 0.34, ring: [0.12, 0.34, 0.66, 0.88], ringCol: '#3c3c46', ringW: 2.2 * sc, top: shade(col, -0.04), lw: 1.5 });
  for (let i = -2; i <= 2; i++) { const kx = x + i * w * 0.34; ln([[kx, y - h * 0.03 + Math.abs(i) * 0.4], [kx + i * 0.5, y - h * 0.97]], 0.7, 'rgba(50,28,10,.35)'); }
  ln([[x - w * 0.7, y - h - 0.6], [x + w * 0.7, y - h + 0.6]], 0.8, 'rgba(40,22,8,.45)');
}
export function crate(g, x, y, sc = 1, seed = 1) {
  const { ln, blob, circ } = kit(g), r = rng(seed), col = r.pick(['#b8844a', '#a67238', '#c49458']);
  const s = 13 * sc, hh = 12 * sc;
  blob(x + 5, y + 1, s * 1.1, s * 0.45, '#0a0614', 0.34);
  const P = isoBox(g, x, y, s, s, hh, { left: shade(col, -0.08), right: shade(col, -0.01), top: shade(col, 0.14) });
  const dark = 'rgba(58,32,12,.75)', wood = shade(col, -0.2);
  // listwy ramy na każdej ścianie (w płaszczyźnie ściany) i skośna zastrzałka, deski wierzchu, gwoździe
  for (const [A, B] of [[[-s / 2, s / 2], [s / 2, s / 2]], [[s / 2, s / 2], [s / 2, -s / 2]]]) {
    for (const z of [hh * 0.16, hh * 0.84]) ln([P(A[0], A[1], z), P(B[0], B[1], z)], 2.2 * sc, wood);
    ln([P(A[0], A[1], hh * 0.16), P(B[0], B[1], hh * 0.84)], 1.6 * sc, wood); ln([P(A[0], A[1], hh * 0.5), P(B[0], B[1], hh * 0.5)], 0.7, dark);
  }
  ln([P(-s / 2, s / 2, 0), P(-s / 2, s / 2, hh)], 2 * sc, wood); ln([P(s / 2, s / 2, 0), P(s / 2, s / 2, hh)], 2 * sc, wood);
  for (const q of [-0.33, 0, 0.33]) ln([P(q * s, -s / 2, hh), P(q * s, s / 2, hh)], 0.8, dark);
  for (const [px, py, z] of [[-s * 0.45, s / 2, hh * 0.16], [s * 0.45, s / 2, hh * 0.16], [s / 2, s * 0.45, hh * 0.84], [s / 2, -s * 0.45, hh * 0.84]]) { const q = P(px, py, z); circ(q[0], q[1], 0.9, '#2a2a30', 0); }
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
  const { blob, ln, poly, circ } = kit(g);
  // plama światła na ziemi (w płaszczyźnie gruntu) i cień pod słupem
  const pool = g.createRadialGradient(x, y + 2, 2, x, y + 2, 34 * sc); pool.addColorStop(0, 'rgba(255,214,110,.34)'); pool.addColorStop(1, 'rgba(255,214,110,0)'); g.save(); g.fillStyle = pool; g.beginPath(); g.ellipse(x, y + 2, 34 * sc, 17 * sc, 0, 0, 7); g.fill(); g.restore();
  blob(x + 3, y + 1, 9 * sc, 3.2 * sc, '#0a0614', 0.34);
  // cokół z kamienia, zwężający się żeliwny słup z kołnierzami, ramię i latarnia jako bryła ze szkłem
  const bp = isoBox(g, x, y, 11 * sc, 11 * sc, 5 * sc, { left: '#9a9486', right: '#76705f', top: '#b6b09f' }); void bp;
  vCyl(g, x, y - 5 * sc, 2.6 * sc, 1.7 * sc, 30 * sc, '#3c3c46', { ring: [0.04, 0.5, 0.97], ringCol: '#2a2a32', ringW: 2.4 * sc, lw: 1.2 });
  ln([[x + 1 * sc, y - 33 * sc], [x + 1.5 * sc, y - 37 * sc]], 2 * sc, '#2a2a32');
  const ly = y - 36 * sc;
  g.save(); const gl = g.createRadialGradient(x, ly - 5 * sc, 1, x, ly - 5 * sc, 20 * sc); gl.addColorStop(0, 'rgba(255,226,130,.55)'); gl.addColorStop(1, 'rgba(255,226,130,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, ly - 5 * sc, 20 * sc, 0, 7); g.fill(); g.restore();
  const lp = isoBox(g, x, ly, 7 * sc, 7 * sc, 10 * sc, { left: '#ffd36a', right: '#e09a2a', top: '#ffe9a8' }); void lp;
  // ramy latarni na krawędziach i daszek-piramida z gałką
  for (const [dx, dy] of [[-3.5, 3.5], [3.5, 3.5], [3.5, -3.5]]) { const q = [x + (dx - dy) * 0.894 * sc, ly + (dx + dy) * 0.447 * sc]; ln([[q[0], q[1]], [q[0], q[1] - 10 * sc]], 1.3 * sc, '#2a2a32'); }
  const ty = ly - 10 * sc; poly([[x - 5.4 * sc, ty + 1], [x + 5.4 * sc, ty + 1], [x, ty - 6.5 * sc]], '#3c3c46', 1.2); poly([[x, ty + 1.8 * sc], [x + 5.4 * sc, ty + 1], [x, ty - 6.5 * sc]], '#26262e', 0);
  circ(x, ty - 7.5 * sc, 1.5 * sc, '#6a6a78', 1);
}
// studnia: kamienny wieniec z warstwami (walec), woda w środku, dwa słupy z belką, daszek dwuspadowy z gontem, wiadro na linie
export function well(g, x, y, sc = 1, seed = 1) {
  const { blob, ln, poly, circ } = kit(g), r = rng(seed), stone = r.pick(['#b4ac98', '#a6a090', '#bcb29a']);
  const P = (X, Y, Z) => [x + (X - Y) * 0.894 * sc, y + (X + Y) * 0.447 * sc - Z * sc];
  blob(x + 6 * sc, y + 2 * sc, 30 * sc, 11 * sc, '#0a0614', 0.34);
  vCyl(g, x, y, 14 * sc, 14 * sc, 12 * sc, stone, { ring: [0.34, 0.67], ringCol: 'rgba(50,44,36,.8)', ringW: 1.1, top: shade(stone, 0.08), lw: 1.6 });
  // woda w środku wieńca
  g.beginPath(); g.ellipse(x, y - 12 * sc, 10.5 * sc, 5.2 * sc, 0, 0, Math.PI * 2); const wg = g.createRadialGradient(x - 3 * sc, y - 13 * sc, 1, x, y - 12 * sc, 11 * sc); wg.addColorStop(0, '#6ab8d8'); wg.addColorStop(1, '#1c4a6a'); g.fillStyle = wg; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(10,20,30,.7)'; g.stroke();
  // słupy po bokach (wzdłuż osi x), belka i daszek
  for (const sx of [-12, 12]) { const b = P(sx, 0, 12), t = P(sx, 0, 40); vCyl(g, b[0], b[1], 1.9 * sc, 1.9 * sc, 28 * sc, '#7a4a26', { lw: 1.1, top: '#8a5a2c' }); void t; }
  const H = 52, a = 17, b = 11;
  ln([P(-12, 0, 34), P(12, 0, 34)], 3 * sc, '#4a2c14');
  poly([P(a, b, H - 11), P(a, -b, H - 11), P(a, 0, H)], '#7a4a26', 1.5);
  poly([P(-a, b, H - 11), P(a, b, H - 11), P(a, 0, H), P(-a, 0, H)], shade('#b06a3a', 0.04), 1.6);
  for (let i = 1; i < 5; i++) { const t = i / 5; ln([P(-a, b - b * t, H - 11 + 11 * t), P(a, b - b * t, H - 11 + 11 * t)], 0.9, 'rgba(60,24,8,.45)'); }
  ln([P(-a, 0, H), P(a, 0, H)], 3, shade('#b06a3a', 0.12));
  // lina i wiadro
  ln([P(0, 0, 34), P(0, 0, 21)], 1, '#5a4228'); const bk = P(0, 0, 21); vCyl(g, bk[0], bk[1], 3 * sc, 2.4 * sc, 4.5 * sc, '#8a5a2a', { ring: [0.5], ringCol: '#3a3a44', ringW: 1, lw: 1 }); circ(P(0, 0, 36)[0], P(0, 0, 36)[1], 1.2, '#3a3a44', 0);
}
// segment płotu wzdłuż osi x (dir 'x') albo y (dir 'y'): dwa słupki z daszkiem i dwie poprzeczki, deski jako bryły
export function fence(g, x, y, sc = 1, seed = 1, dir = 'x') {
  const { blob } = kit(g), wood = '#a8703a', cols = (d) => ({ left: shade(wood, -0.1 + d), right: shade(wood, 0.02 + d), top: shade(wood, 0.14 + d) });
  const L = 36 * sc, e = dir === 'x' ? [0.894, 0.447] : [-0.894, 0.447];
  blob(x + 3, y + 1, 22 * sc, 5 * sc, '#0a0614', 0.3);
  const at = (t) => [x + e[0] * t * L / 2, y + e[1] * t * L / 2];
  // poprzeczki najpierw (za słupkami nie widać różnicy, ale tak bryła nakłada się poprawnie)
  for (const z of [6, 13]) { const c = at(0); isoBox(g, c[0], c[1] - z * sc, dir === 'x' ? L : 2.4 * sc, dir === 'x' ? 2.4 * sc : L, 2.6 * sc, cols(0.02)); }
  for (const t of [-1, 1]) { const c = at(t); isoBox(g, c[0], c[1], 4 * sc, 4 * sc, 19 * sc, cols(0)); isoBox(g, c[0], c[1] - 19 * sc, 5.4 * sc, 5.4 * sc, 2 * sc, cols(0.1)); }
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
export const PROPS = { well, fence, mound, web, eggs, bloodSplat, bones, crack, ashCloud, grave, barrel, crate, logs, pot, bench, haybale, sack, lampPost, cart };
