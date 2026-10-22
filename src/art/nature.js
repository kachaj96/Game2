// Przyroda: gatunki drzew, krzewy, skały, kwiaty, grzyby, trzcina, staw i teren. Każda funkcja bierze ziarno, więc dwa drzewa nigdy nie są kopią.
import { rng } from './rng.js';
import { kit, OUT } from './kit.js';
import { hsl, shade, mix } from './color.js';

export const BIOMES = {
  summer: { hue: [88, 122], sat: 0.55 },
  lush: { hue: [100, 140], sat: 0.5 },
  autumn: { hue: [8, 46], sat: 0.72 },
  spring: { hue: [72, 96], sat: 0.6, blossom: true },
  dark: { hue: [128, 168], sat: 0.45 },
};
function foliage(r, biome) {
  const b = BIOMES[biome] || BIOMES.summer, h = r.range(b.hue[0], b.hue[1]);
  return [hsl(h, b.sat, 0.27), hsl(h, b.sat + 0.05, 0.4), hsl(h + (biome === 'autumn' ? 10 : 8), b.sat + 0.1, 0.6)];
}
function trunkPoly(g, x, y, h, w, lean, r, col = '#7a4a24') {
  const { poly, ln, lg } = kit(g);
  const L = [], R = [], n = 6, bend = r.range(-3, 3);
  for (let i = 0; i <= n; i++) { const t = i / n, cx = x + lean * t * t + bend * Math.sin(t * 3), hw = w * (1.25 - 0.55 * t) * (i === 0 ? 1.15 : 1); L.push([cx - hw, y - h * t]); R.push([cx + hw, y - h * t]); }
  poly([...L, ...R.reverse()], lg(x - w, 0, x + w, 0, shade(col, 0.1), shade(col, -0.14)), 2);
  ln([[x - w * 0.35, y - 2], [x - w * 0.2 + lean * 0.4, y - h * 0.8]], 1.1, 'rgba(255,210,150,.3)');
  for (let i = 0; i < 3; i++) { const t = r.range(0.15, 0.7); ln([[x + lean * t * t - w * 0.2, y - h * t], [x + lean * t * t + w * 0.4, y - h * t - 3]], 0.9, 'rgba(40,20,8,.45)'); }
  // korzenie
  poly([[x - w * 1.3, y], [x - w * 0.7, y - 5], [x - w * 0.4, y]], shade(col, -0.04), 1.4);
  poly([[x + w * 1.3, y], [x + w * 0.7, y - 5], [x + w * 0.4, y]], shade(col, -0.12), 1.4);
}
function lumps(g, list, pal, r, blossom) {
  for (const [x, y, rr] of list) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.lineWidth = 3.8; g.strokeStyle = OUT; g.stroke(); }
  for (const [x, y, rr] of list) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fillStyle = pal[0]; g.fill(); }
  for (const [x, y, rr] of list) { g.beginPath(); g.arc(x - rr * 0.14, y - rr * 0.18, rr * 0.8, 0, 7); g.fillStyle = pal[1]; g.fill(); }
  for (const [x, y, rr] of list) { g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.38, rr * 0.42, 0, 7); g.fillStyle = pal[2]; g.fill(); }
  for (let i = 0; i < list.length * 2; i++) { const [x, y, rr] = list[i % list.length]; const a = r() * 7, d = r() * rr * 0.8; g.fillStyle = shade(pal[0], -0.05); g.globalAlpha = 0.5; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + 2, 1.4, 0, 7); g.fill(); g.globalAlpha = 1; }
  if (blossom) for (let i = 0; i < list.length * 3; i++) { const [x, y, rr] = list[i % list.length]; const a = r() * 7, d = r() * rr * 0.85; g.fillStyle = r() < 0.6 ? '#ffd4e4' : '#fff'; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.7, 0, 7); g.fill(); }
}
export function oak(g, x, y, seed, opt = {}) {
  const r = rng(seed * 13 + 5), { blob } = kit(g), sc = opt.sc || r.range(0.85, 1.3), biome = opt.biome || 'summer', pal = foliage(r, biome);
  const th = r.range(18, 32) * sc, tw = r.range(4.5, 8) * sc, lean = r.range(-7, 7) * sc;
  blob(x + 8 * sc, y + 3, 26 * sc, 8 * sc, '#000', 0.2);
  trunkPoly(g, x, y, th, tw, lean, r);
  const cx = x + lean, cy = y - th - r.range(6, 14) * sc, n = r.int(5, 9), rx = r.range(15, 24) * sc, ry = r.range(11, 17) * sc, list = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r() * 0.6; list.push([cx + Math.cos(a) * rx * r.range(0.55, 1), cy + Math.sin(a) * ry * r.range(0.45, 1) - 2, r.range(9, 15) * sc]); }
  list.push([cx, cy - 4 * sc, r.range(12, 16) * sc]);
  list.sort((a, b) => a[1] - b[1]);
  lumps(g, list, pal, r, BIOMES[biome] && BIOMES[biome].blossom);
}
export function pine(g, x, y, seed, opt = {}) {
  const r = rng(seed * 17 + 3), { poly, blob, ln, lg } = kit(g), sc = opt.sc || r.range(0.85, 1.3), tiers = r.int(3, 5), snow = opt.snow || false;
  const h = hsl(r.range(125, 165), 0.42, 0.26), pal = [shade(h, -0.04), shade(h, 0.1), shade(h, 0.24)];
  blob(x + 6 * sc, y + 3, 20 * sc, 6 * sc, '#000', 0.2);
  poly([[x - 3 * sc, y], [x + 3 * sc, y], [x + 2 * sc, y - 12 * sc], [x - 2 * sc, y - 12 * sc]], '#6a4020', 1.8);
  const tierH = (34 * sc) / tiers * 1.5;
  for (let i = 0; i < tiers; i++) {
    const by = y - 8 * sc - i * (tierH * 0.62), w = (24 - i * (16 / tiers)) * sc, top = by - tierH;
    const pts = [[x, top]]; const nb = 5; for (let q = 0; q <= nb; q++) { const t = q / nb; pts.push([x + w * (1 - 2 * t) * -1 * -1 + 0, by]); }
    const bottom = []; for (let q = 0; q <= nb; q++) { const t = q / nb, bx = x - w + 2 * w * t; bottom.push([bx, by + (q % 2 ? 3 : -1)]); }
    poly([[x, top], [x + w, by - 1], ...bottom.reverse(), [x - w, by - 1]], pal[0], 2);
    poly([[x, top + 1], [x - w * 0.9, by - 1.5], [x - w * 0.3, by + 1], [x + w * 0.05, by - 3]], pal[1], 0);
    ln([[x - 1, top + 5], [x - w * 0.6, by - 3]], 1.4, pal[2]);
    if (snow || opt.snowTop) poly([[x, top], [x + w * 0.45, top + tierH * 0.45], [x + w * 0.15, top + tierH * 0.5], [x - w * 0.1, top + tierH * 0.4], [x - w * 0.45, top + tierH * 0.46]], '#f4f8ff', 1.2);
  }
}
export function birch(g, x, y, seed, opt = {}) {
  const r = rng(seed * 19 + 1), { poly, ln, blob } = kit(g), sc = opt.sc || r.range(0.9, 1.25), pal = foliage(r, opt.biome === 'autumn' ? 'autumn' : 'spring');
  const th = r.range(30, 42) * sc, w = 3.2 * sc, lean = r.range(-4, 4);
  blob(x + 6 * sc, y + 3, 16 * sc, 5 * sc, '#000', 0.2);
  poly([[x - w * 1.2, y], [x + w * 1.2, y], [x + w * 0.8 + lean, y - th], [x - w * 0.8 + lean, y - th]], '#f0ebdc', 2);
  for (let i = 0; i < 7; i++) { const t = r.range(0.08, 0.9); ln([[x - w * 0.8 + lean * t * t, y - th * t], [x + w * 0.2 + lean * t * t, y - th * t - 0.5]], 1.6, '#2a2a2e'); }
  const cx = x + lean, cy = y - th - 4, list = [];
  for (let i = 0; i < r.int(5, 7); i++) list.push([cx + r.range(-13, 13) * sc, cy + r.range(-12, 8) * sc, r.range(7, 11) * sc]);
  list.sort((a, b) => a[1] - b[1]); lumps(g, list, pal, r, false);
}
export function deadTree(g, x, y, seed, opt = {}) {
  const r = rng(seed * 23 + 9), { ln, blob } = kit(g), sc = opt.sc || r.range(0.9, 1.2);
  blob(x + 6, y + 3, 16 * sc, 5 * sc, '#000', 0.2);
  const col = '#5a4030';
  const branch = (bx, by, ang, len, w, d) => { if (d > 3 || len < 5) return; const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len; ln([[bx, by], [ex, ey]], w + 2, OUT); ln([[bx, by], [ex, ey]], w, col); ln([[bx - w * 0.2, by], [ex - w * 0.2, ey]], Math.max(0.6, w * 0.3), 'rgba(255,220,170,.25)'); const n = d === 0 ? 3 : 2; for (let i = 0; i < n; i++) branch(ex, ey, ang + r.range(-0.9, 0.9), len * r.range(0.62, 0.78), w * 0.68, d + 1); };
  ln([[x - 6 * sc, y], [x - 3 * sc, y - 6 * sc]], 3, col);
  branch(x, y, -Math.PI / 2 + r.range(-0.15, 0.15), 22 * sc, 5.5 * sc, 0);
}
export function bush(g, x, y, seed, opt = {}) {
  const r = rng(seed * 29 + 11), { blob, circ } = kit(g), sc = opt.sc || r.range(0.8, 1.3), biome = opt.biome || 'summer', pal = foliage(r, biome);
  blob(x + 4 * sc, y + 2, 18 * sc, 5 * sc, '#000', 0.2);
  const list = []; const n = r.int(3, 5); for (let i = 0; i < n; i++) list.push([x + (i - (n - 1) / 2) * 7 * sc + r.range(-2, 2), y - r.range(5, 10) * sc, r.range(7, 10) * sc]);
  lumps(g, list, pal, r, false);
  const kind = opt.kind || r.pick(['plain', 'berry', 'flower', 'plain']);
  if (kind !== 'plain') for (let i = 0; i < 9; i++) { const [lx, ly, lr] = list[i % list.length]; const a = r() * 7, d = r() * lr * 0.8; circ(lx + Math.cos(a) * d, ly + Math.sin(a) * d - 1, 1.9, kind === 'berry' ? '#d8282a' : r.pick(['#fff', '#ffb8d8', '#ffe066']), 0.8); }
}
export function rock(g, x, y, seed, opt = {}) {
  const r = rng(seed * 31 + 2), { poly, blob, ln } = kit(g), sc = opt.sc || r.range(0.8, 1.4), n = r.int(1, 3);
  const tone = opt.tone || r.pick(['#a8a49c', '#9a9ea4', '#b0a898', '#8e9288']);
  for (let q = 0; q < n; q++) {
    const ox = x + (q - (n - 1) / 2) * 18 * sc + r.range(-3, 3), oy = y + r.range(-2, 2), w = r.range(12, 19) * sc, hh = r.range(10, 17) * sc;
    blob(ox + 3, oy + 1, w + 3, 4, '#000', 0.2);
    const pts = []; const m = r.int(6, 8); for (let i = 0; i < m; i++) { const a = Math.PI + (i / (m - 1)) * Math.PI; pts.push([ox + Math.cos(a) * w, oy + Math.sin(a) * hh * 1.0 * (0.7 + r() * 0.5)]); }
    poly([[ox - w, oy], ...pts.slice(1, -1), [ox + w, oy]], tone, 2);
    poly([[ox - w * 0.9, oy - 1], pts[1], pts[2], [ox - w * 0.1, oy - hh * 0.2], [ox - w * 0.45, oy - 1]], shade(tone, 0.12), 0);
    poly([[ox + w * 0.1, oy - hh * 0.3], pts[pts.length - 3] || pts[2], pts[pts.length - 2], [ox + w, oy - 1], [ox + w * 0.3, oy]], shade(tone, -0.12), 0);
    ln([[ox - w * 0.3, oy - hh * 0.5], [ox + w * 0.1, oy - hh * 0.2]], 0.9, 'rgba(40,30,20,.5)');
    if (opt.moss !== false && r() < 0.5) blob(ox - w * 0.3, oy - hh * 0.7, w * 0.5, 2.4, '#5aa03a', 0.8);
  }
}
export function flowers(g, x, y, seed, opt = {}) {
  const r = rng(seed * 37 + 5), { ln, circ } = kit(g), n = opt.n || r.int(6, 12), cols = opt.cols || r.pick([['#ffffff', '#ffe066'], ['#e8483a', '#ff9a3a'], ['#a86ae0', '#d8a8ff', '#fff'], ['#f07aa8', '#ffb8d8'], ['#4a8af0', '#fff', '#a8d0ff']]);
  for (let i = 0; i < n; i++) { const px = x + r.range(-16, 16), py = y + r.range(-5, 5); ln([[px, py], [px + r.range(-1, 1), py - r.range(7, 12)]], 1.5, '#3f8a34'); const top = py - 11; for (let a = 0; a < 5; a++) circ(px + Math.cos(a * 1.256) * 2.8, top + Math.sin(a * 1.256) * 2.8 - 0.5, 2.1, r.pick(cols), 0.8); circ(px, top - 0.5, 1.5, '#ffd84a', 0); }
}
export function mushrooms(g, x, y, seed) {
  const r = rng(seed * 41 + 7), { poly, circ, blob, ell } = kit(g), n = r.int(2, 4), red = r.chance(0.5);
  for (let i = 0; i < n; i++) { const px = x + r.range(-8, 8), py = y + r.range(-2, 3), s = r.range(1.0, 1.7); poly([[px - 1.6 * s, py], [px + 1.6 * s, py], [px + 1.2 * s, py - 6 * s], [px - 1.2 * s, py - 6 * s]], '#f4ecd8', 1.3); g.beginPath(); g.ellipse(px, py - 6 * s, 5.5 * s, 4 * s, 0, Math.PI, 0); g.closePath(); g.fillStyle = red ? '#d8383a' : '#b88048'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke(); if (red) { circ(px - 1.6 * s, py - 8 * s, 0.9 * s, '#fff', 0); circ(px + 2 * s, py - 7.4 * s, 0.8 * s, '#fff', 0); } }
}
export function stump(g, x, y, seed) {
  const r = rng(seed * 43 + 3), { poly, ell, blob, ln } = kit(g), w = r.range(9, 13);
  blob(x + 3, y + 1, w + 3, 4, '#000', 0.2);
  poly([[x - w, y - 8], [x - w * 0.9, y], [x + w * 0.9, y], [x + w, y - 8]], '#7a4a24', 1.8);
  ell(x, y - 8, w, 3.6, '#d8a468', 1.8); ell(x, y - 8, w * 0.6, 2.2, '#c08850', 0); ell(x, y - 8, w * 0.25, 1, '#a06a38', 0);
  ln([[x - w * 0.6, y - 6], [x - w * 0.5, y - 0.5]], 1, 'rgba(255,210,150,.3)');
}
export function reeds(g, x, y, seed) {
  const r = rng(seed * 47 + 1), { ln, ell } = kit(g);
  for (let i = 0; i < r.int(5, 9); i++) { const px = x + r.range(-8, 8), hh = r.range(14, 26), lean = r.range(-4, 4); ln([[px, y], [px + lean, y - hh]], 1.6, '#4f8a3a'); if (r() < 0.6) { g.save(); g.translate(px + lean, y - hh + 3); g.rotate(lean * 0.05); ell(0, 0, 1.8, 5, '#7a4a24', 1.2); g.restore(); } }
}
export function pond(g, cx, cy, rx, ry, seed) {
  const r = rng(seed * 53 + 9), { poly, blob, ln, lg, path } = kit(g);
  const pts = []; const n = 22; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.22; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  const shore = pts.map(([x, y]) => [cx + (x - cx) * 1.1, cy + (y - cy) * 1.14]);
  poly(shore, '#e0cf94', 2, '#9a8450');
  poly(pts, lg(0, cy - ry, 0, cy + ry, '#6cc4e0', '#2a84b0'), 2.2, '#1f5a80');
  blob(cx - rx * 0.25, cy - ry * 0.2, rx * 0.5, ry * 0.3, '#bfeaf8', 0.35);
  for (let i = 0; i < 6; i++) { const px = cx + r.range(-rx * 0.6, rx * 0.6), py = cy + r.range(-ry * 0.55, ry * 0.55); ln([[px - 6, py], [px - 2, py - 1.2], [px + 2, py], [px + 6, py - 1]], 1, 'rgba(255,255,255,.55)'); }
  for (let i = 0; i < 3; i++) { const px = cx + r.range(-rx * 0.5, rx * 0.5), py = cy + r.range(-ry * 0.4, ry * 0.4); blob(px, py, 6, 3, '#4f9a3a', 0.95); blob(px - 1, py - 1, 3, 1.4, '#7acc52', 0.9); if (r() < 0.6) blob(px + 1, py - 1.5, 1.8, 1.4, '#ffd4e4', 1); }
}
export const TREES = { oak, pine, birch, deadTree };

// Teren: rozmyte plamy, kępki trawy, kwiatki i kamyki. Bez widocznych kafli, siatkę dokłada tryb walki.
export function ground(g, W, H, seed, opt = {}) {
  const r = rng(seed * 59 + 1), { lg, blob } = kit(g), b = opt.biome || 'summer';
  const hue = { summer: 98, lush: 118, autumn: 62, spring: 88, dark: 36 }[b], dark = b === 'dark';
  g.fillStyle = lg(0, 0, 0, H, hsl(hue, dark ? 0.3 : 0.55, dark ? 0.3 : 0.56), hsl(hue, dark ? 0.28 : 0.52, dark ? 0.2 : 0.46)); g.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 9000; i++) blob(r() * W, r() * H, r.range(30, 90), r.range(12, 34), r() < 0.5 ? hsl(hue + 8, 0.6, dark ? 0.42 : 0.66) : hsl(hue - 6, 0.5, dark ? 0.2 : 0.38), 0.2);
}
export function tufts(g, W, H, seed, n, avoid, opt = {}) {
  const r = rng(seed * 61 + 7), { ln } = kit(g), b = opt.biome || 'summer', hue = { summer: 98, lush: 118, autumn: 62, spring: 88, dark: 60 }[b];
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H; if (avoid && avoid(x, y)) continue; const c = r() < 0.5 ? hsl(hue, 0.5, 0.34) : hsl(hue + 8, 0.6, 0.7), s = r.range(0.8, 1.3); for (const dx of [-3, 0, 3]) ln([[x + dx * s, y], [x + dx * s * 1.6 + (r() - 0.5) * 3, y - 7 * s * r.range(0.7, 1.3)]], 1.4, c); }
}

// Droga z kocich łbów: pas w siatce izometrycznej. pts to punkty ekranowe wielokąta.
export function road(g, pts, seed) {
  const r = rng(seed * 67 + 3), { poly, blob, lg } = kit(g);
  const ys = pts.map((p) => p[1]);
  poly(pts, lg(0, Math.min(...ys), 0, Math.max(...ys), '#ecd596', '#cdae6a'), 2.4, '#9a7a3e');
  const xs = pts.map((p) => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
  for (let i = 0; i < (x1 - x0) * (y1 - y0) / 260; i++) blob(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r.range(3, 6), r.range(1.8, 3), r() < 0.5 ? '#e0c37e' : '#b8955a', 0.5);
  g.restore();
}
