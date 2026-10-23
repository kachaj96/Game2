// Drzewa do świata: duże, malarskie, z miękkimi gradientami zamiast grubego konturu. genTree(ziarno, gatunek, biom) losuje wygląd, drawTree rysuje.
// Punkt (x,y) to środek podstawy pnia. Oświetlenie z lewej góry, cień na ziemi jest miękki.
import { rng } from './rng.js';
import { hsl, shade } from './color.js';
import { leafClump } from './kit.js';

export const SPECIES = ['oak', 'pine', 'birch', 'dead', 'swamp'];
const PAL = {
  summer: [[88, 0.55, 0.6], [100, 0.5, 0.42], [116, 0.46, 0.26]],
  autumn: [[44, 0.8, 0.6], [26, 0.78, 0.46], [12, 0.7, 0.3]],
  dark: [[128, 0.34, 0.38], [134, 0.36, 0.26], [142, 0.36, 0.16]],
};
export function genTree(seed, species, biome = 'summer') {
  const r = rng(seed * 8191 + 29); species = species || r.pick(SPECIES);
  const sp = { seed, species, biome: PAL[biome] ? biome : 'summer', h: 0, lean: r.range(-6, 6), trunkW: r.range(15, 24), trunkH: r.range(58, 84), bark: hsl(r.range(22, 34), r.range(0.25, 0.4), r.range(0.24, 0.32)) };
  if (species === 'oak') Object.assign(sp, { crownW: r.range(64, 84), crownH: r.range(46, 62), blobs: r.int(7, 10), clumps: r.int(14, 22) });
  if (species === 'pine') Object.assign(sp, { tiers: r.int(5, 7), tierW: r.range(46, 62), tall: r.range(190, 240), trunkH: r.range(26, 40) });
  if (species === 'birch') Object.assign(sp, { crownW: r.range(48, 64), crownH: r.range(40, 56), blobs: r.int(5, 7), trunkH: r.range(86, 112), trunkW: r.range(9, 13), bark: '#e6e0d2', marks: r.int(5, 9) });
  if (species === 'dead') Object.assign(sp, { branches: r.int(4, 6), trunkH: r.range(80, 120), trunkW: r.range(10, 16), bark: hsl(r.range(24, 34), r.range(0.12, 0.2), r.range(0.28, 0.36)) });
  if (species === 'swamp') Object.assign(sp, { crownW: r.range(70, 96), crownH: r.range(44, 58), blobs: r.int(8, 11), clumps: r.int(16, 24), vines: r.int(6, 10), trunkW: r.range(20, 30), trunkH: r.range(62, 90) });
  return sp;
}
const blob = (g, cx, cy, rx, ry, [c0, c1, c2], rim = 0.3) => {
  const gr = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, Math.min(rx, ry) * 0.1, cx, cy, Math.max(rx, ry) * 1.05);
  gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2);
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill();
  if (rim) { g.lineWidth = 1.3; g.strokeStyle = `rgba(14,24,8,${rim})`; g.stroke(); }
};
const shadow = (g, x, y, rx) => { const gr = g.createRadialGradient(x + rx * 0.15, y + 2, 2, x + rx * 0.15, y + 2, rx); gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(0, 0); g.fillStyle = gr; g.beginPath(); g.ellipse(x + rx * 0.15, y + 2, rx, rx * 0.34, 0, 0, Math.PI * 2); g.fill(); g.restore(); };
const trunk = (g, x, y, w, h, lean, col) => {
  const gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, shade(col, 0.1)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, -0.12));
  g.beginPath(); g.moveTo(x - w * 1.5, y); g.bezierCurveTo(x - w * 0.9, y - h * 0.15, x - w * 0.7 + lean * 0.3, y - h * 0.6, x - w * 0.55 + lean, y - h);
  g.lineTo(x + w * 0.55 + lean, y - h); g.bezierCurveTo(x + w * 0.7 + lean * 0.3, y - h * 0.6, x + w * 0.9, y - h * 0.15, x + w * 1.5, y); g.closePath();
  g.fillStyle = gr; g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(20,12,6,.5)'; g.stroke();
};

export function drawTree(g, x, y, sp) {
  const r = rng(sp.seed * 131 + 7), P = PAL[sp.biome].map((c) => hsl(c[0] + r.range(-5, 5), c[1], c[2]));
  g.save();
  shadow(g, x, y, sp.species === 'pine' ? 54 : sp.species === 'dead' ? 34 : 74);
  // kępy liści i korzenie przy pniu: drzewo wyrasta z ziemi
  { const rr = rng(sp.seed * 17 + 3), n = sp.species === 'dead' ? 1 : 2; for (let i = 0; i < n; i++) { const sd = i ? 1 : -1; leafClump(g, x + sd * (sp.trunkW * 0.5 + 8 + rr() * 6), y + 2 + rr() * 3, 0.55 + rr() * 0.3, rr, rr() < 0.4); } }
  if (sp.species === 'oak' || sp.species === 'swamp') {
    const th = sp.trunkH, cy = y - th - sp.crownH * 0.45, sw = sp.species === 'swamp';
    trunk(g, x, y, sp.trunkW, th, sp.lean, sw ? shade(sp.bark, -0.06) : sp.bark);
    for (let i = 0; i < 6; i++) { const xx = x + (r() - 0.5) * sp.trunkW * 1.2, yy = y - r.range(8, th - 6); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + r.range(-1, 1), yy - r.range(8, 20)); g.lineWidth = 1.2; g.strokeStyle = 'rgba(15,8,4,.35)'; g.stroke(); }
    for (let i = 0; i < 3; i++) { const sd = i - 1; g.beginPath(); g.moveTo(x + sp.lean * 0.6, y - th * 0.8); g.quadraticCurveTo(x + sd * sp.crownW * 0.35, y - th * 1.05, x + sd * sp.crownW * 0.62, cy + sp.crownH * 0.2); g.lineWidth = sp.trunkW * 0.42; g.strokeStyle = shade(sp.bark, -0.04); g.lineCap = 'round'; g.stroke(); }
    const list = []; for (let i = 0; i < sp.blobs; i++) { const a = (i / sp.blobs) * Math.PI * 2 + r() * 0.6, d = r.range(0.45, 1); list.push([x + sp.lean + Math.cos(a) * sp.crownW * d * 0.6, cy + Math.sin(a) * sp.crownH * d * 0.6, r.range(0.5, 0.75) * sp.crownW * 0.62, r.range(0.5, 0.72) * sp.crownH * 0.78]); }
    list.push([x + sp.lean, cy - sp.crownH * 0.1, sp.crownW * 0.5, sp.crownH * 0.55]); list.sort((a, b) => a[1] - b[1]);
    list.forEach(([bx, by, rx, ry], i) => blob(g, bx, by, rx, ry, i < list.length * 0.35 ? [P[1], P[2], shade(P[2], -0.08)] : P));
    for (let i = 0; i < sp.clumps; i++) { const a = r() * 6.28, d = Math.sqrt(r()), bx = x + sp.lean + Math.cos(a) * sp.crownW * 0.85 * d, by = cy + Math.sin(a) * sp.crownH * 0.75 * d - 4, up = -Math.sin(a) * d; if (up < -0.2) continue; blob(g, bx, by, r.range(8, 15), r.range(6, 11), [shade(P[0], 0.1), P[0], P[1]], 0.12); }
    if (sw) for (let i = 0; i < sp.vines; i++) { const vx = x + sp.lean + r.range(-sp.crownW * 0.8, sp.crownW * 0.8), vy = cy + sp.crownH * 0.35, len = r.range(18, 44); g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo(vx + r.range(-5, 5), vy + len * 0.5, vx + r.range(-3, 3), vy + len); g.lineWidth = 1.6; g.strokeStyle = shade(P[2], -0.04); g.stroke(); }
  } else if (sp.species === 'pine') {
    trunk(g, x, y, 7, sp.trunkH, sp.lean * 0.3, sp.bark);
    const tiers = sp.tiers, top = y - sp.tall;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1), by = y - sp.trunkH * 0.6 - (sp.tall - sp.trunkH * 0.6) * t * 0.82, wd = sp.tierW * (1 - t * 0.78), hh = (sp.tall / tiers) * 1.75;
      const gr = g.createLinearGradient(x - wd, 0, x + wd, 0); gr.addColorStop(0, shade(P[0], -0.04)); gr.addColorStop(0.5, P[1]); gr.addColorStop(1, P[2]);
      g.beginPath(); g.moveTo(x + sp.lean * t * 0.5, by - hh); g.quadraticCurveTo(x + wd * 0.55, by - hh * 0.35, x + wd, by);
      for (let q = 0; q < 4; q++) g.quadraticCurveTo(x + wd * (0.8 - q * 0.5), by + 6 + (q % 2) * 2, x + wd * (0.5 - q * 0.5), by - 1);
      g.quadraticCurveTo(x - wd * 0.55, by - hh * 0.35, x + sp.lean * t * 0.5, by - hh); g.closePath(); g.fillStyle = gr; g.fill(); g.lineWidth = 1.3; g.strokeStyle = 'rgba(8,24,10,.4)'; g.stroke();
      g.beginPath(); g.moveTo(x + sp.lean * t * 0.5, by - hh * 0.95); g.quadraticCurveTo(x - wd * 0.35, by - hh * 0.4, x - wd * 0.8, by - 2); g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,230,.14)'; g.stroke();
    }
  } else if (sp.species === 'birch') {
    const th = sp.trunkH, cy = y - th - sp.crownH * 0.4;
    trunk(g, x, y, sp.trunkW, th, sp.lean, sp.bark);
    for (let i = 0; i < sp.marks; i++) { const yy = y - r.range(6, th - 8), xx = x + sp.lean * (1 - (y - yy) / th) * 0 + r.range(-sp.trunkW * 0.5, sp.trunkW * 0.5); g.fillStyle = 'rgba(30,26,22,.75)'; g.fillRect(xx - 2.4, yy, r.range(3, 6), 1.8); }
    const list = []; for (let i = 0; i < sp.blobs; i++) { const a = (i / sp.blobs) * 6.28 + r() * 0.5, d = r.range(0.4, 1); list.push([x + sp.lean + Math.cos(a) * sp.crownW * d * 0.55, cy + Math.sin(a) * sp.crownH * d * 0.55, r.range(18, 28), r.range(14, 22)]); }
    list.sort((a, b) => a[1] - b[1]); const BP = sp.biome === 'summer' ? [hsl(78, 0.6, 0.68), hsl(88, 0.55, 0.52), hsl(100, 0.5, 0.36)] : P;
    for (const [bx, by, rx, ry] of list) blob(g, bx, by, rx, ry, BP, 0.22);
  } else {
    const th = sp.trunkH; trunk(g, x, y, sp.trunkW, th, sp.lean, sp.bark);
    const limb = (bx, by, ang, len, w, d) => { if (d > 3 || len < 8) return; const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo((bx + ex) / 2 + r.range(-6, 6), (by + ey) / 2 + r.range(-6, 4), ex, ey); g.lineWidth = w; g.lineCap = 'round'; g.strokeStyle = shade(sp.bark, d * -0.02); g.stroke(); limb(ex, ey, ang + r.range(0.3, 0.8), len * 0.66, w * 0.62, d + 1); limb(ex, ey, ang - r.range(0.3, 0.8), len * 0.66, w * 0.62, d + 1); };
    for (let i = 0; i < sp.branches; i++) limb(x + sp.lean * 0.8, y - th * r.range(0.7, 1), -Math.PI / 2 + r.range(-1.1, 1.1), r.range(26, 48), sp.trunkW * 0.5, 0);
  }
  g.restore();
}
