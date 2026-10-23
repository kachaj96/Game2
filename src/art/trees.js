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
const trunk = (g, x, y, w, h, lean, col, flare = true) => {
  const body = () => { g.beginPath(); g.moveTo(x - w * 1.5, y); g.bezierCurveTo(x - w * 0.9, y - h * 0.15, x - w * 0.7 + lean * 0.3, y - h * 0.6, x - w * 0.55 + lean, y - h); g.lineTo(x + w * 0.55 + lean, y - h); g.bezierCurveTo(x + w * 0.7 + lean * 0.3, y - h * 0.6, x + w * 0.9, y - h * 0.15, x + w * 1.5, y); g.closePath(); };
  // korzenie podporowe wychodzą spod pnia na grunt
  if (flare) for (const sd of [-1, 0.2, 1]) { g.beginPath(); g.moveTo(x + sd * w * 0.5, y - h * 0.12); g.quadraticCurveTo(x + sd * w * 1.5, y - 2, x + sd * w * 2.3, y + 3); g.quadraticCurveTo(x + sd * w * 1.2, y + 4, x + sd * w * 0.2, y + 1); g.closePath(); g.fillStyle = shade(col, sd < 0 ? 0.02 : -0.14); g.fill(); g.lineWidth = 1.1; g.strokeStyle = 'rgba(20,12,6,.5)'; g.stroke(); }
  const gr = g.createLinearGradient(x - w * 1.4, 0, x + w * 1.4, 0); gr.addColorStop(0, shade(col, 0.06)); gr.addColorStop(0.2, shade(col, 0.2)); gr.addColorStop(0.55, col); gr.addColorStop(0.88, shade(col, -0.22)); gr.addColorStop(1, shade(col, -0.1));
  body(); g.fillStyle = gr; g.fill();
  g.save(); body(); g.clip();
  const ao = g.createLinearGradient(0, y - h, 0, y); ao.addColorStop(0, 'rgba(8,16,8,.45)'); ao.addColorStop(0.3, 'rgba(8,16,8,0)'); ao.addColorStop(0.9, 'rgba(8,16,8,0)'); ao.addColorStop(1, 'rgba(8,16,8,.35)'); g.fillStyle = ao; g.fillRect(x - w * 2, y - h, w * 4, h + 4);   // cień korony u góry i przy ziemi
  g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const xx = x + (i - 3) * w * 0.34 + lean * 0.4, y0 = y - h * (0.1 + 0.07 * ((i * 5) % 3)), y1 = y - h * (0.55 + 0.1 * ((i * 3) % 4)); g.beginPath(); g.moveTo(xx, y0); g.quadraticCurveTo(xx + (i % 2 ? 1.5 : -1.5), (y0 + y1) / 2, xx + lean * 0.2, y1); g.lineWidth = i % 2 ? 1.1 : 1.8; g.strokeStyle = i % 3 === 0 ? 'rgba(255,230,180,.16)' : 'rgba(15,8,4,.3)'; g.stroke(); }   // żłobienia kory
  g.restore(); body(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(20,12,6,.55)'; g.stroke();
};
// bryłowe cieniowanie korony: wszystkie listki razem tworzą jedną bryłę oświetloną z lewej góry (jasna czapa, cień po prawej i na spodzie, odbite światło u dołu)
const crownShade = (g, list, P) => {
  if (!list.length) return; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  g.save(); g.beginPath(); for (const [bx, by, rx, ry] of list) { g.moveTo(bx + rx, by); g.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); x0 = Math.min(x0, bx - rx); x1 = Math.max(x1, bx + rx); y0 = Math.min(y0, by - ry); y1 = Math.max(y1, by + ry); } g.clip();
  const lg1 = g.createLinearGradient(x0, y0, x1, y1); lg1.addColorStop(0, 'rgba(255,255,190,.26)'); lg1.addColorStop(0.45, 'rgba(255,255,190,0)'); lg1.addColorStop(0.7, 'rgba(10,24,40,.1)'); lg1.addColorStop(1, 'rgba(10,20,44,.3)'); g.fillStyle = lg1; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const lg2 = g.createLinearGradient(0, y0, 0, y1); lg2.addColorStop(0, 'rgba(255,255,200,.1)'); lg2.addColorStop(0.7, 'rgba(0,0,0,0)'); lg2.addColorStop(0.93, 'rgba(10,20,10,.28)'); lg2.addColorStop(1, 'rgba(150,190,80,.2)'); g.fillStyle = lg2; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore();
  // listowie: drobne jasne i ciemne plamki układają się w fakturę, jasne głównie z lewej góry
  const rr = rng(Math.floor(x0 * 7 + y0 * 3 + 5)); g.save(); g.beginPath(); for (const [bx, by, rx, ry] of list) { g.moveTo(bx + rx, by); g.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); } g.clip();
  for (let i = 0; i < 60; i++) { const px = rr.range(x0, x1), py = rr.range(y0, y1), t = ((px - x0) / (x1 - x0) + (py - y0) / (y1 - y0)) / 2, lit = rr() > t * 1.25; g.fillStyle = lit ? 'rgba(255,255,170,.26)' : 'rgba(8,24,16,.18)'; g.beginPath(); g.ellipse(px, py, rr.range(2, 4.4), rr.range(1.2, 2.4), rr.range(-0.6, 0.6), 0, 7); g.fill(); }
  g.restore();
};

export function drawTree(g, x, y, sp) {
  const r = rng(sp.seed * 131 + 7), P = PAL[sp.biome].map((c) => hsl(c[0] + r.range(-5, 5), c[1], c[2]));
  g.save();
  shadow(g, x, y, sp.species === 'pine' ? 54 : sp.species === 'dead' ? 34 : 74);
  if (sp.species === 'oak' || sp.species === 'swamp') {
    const th = sp.trunkH, cy = y - th - sp.crownH * 0.45, sw = sp.species === 'swamp';
    trunk(g, x, y, sp.trunkW, th, sp.lean, sw ? shade(sp.bark, -0.06) : sp.bark);
    for (let i = 0; i < 6; i++) { const xx = x + (r() - 0.5) * sp.trunkW * 1.2, yy = y - r.range(8, th - 6); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + r.range(-1, 1), yy - r.range(8, 20)); g.lineWidth = 1.2; g.strokeStyle = 'rgba(15,8,4,.35)'; g.stroke(); }
    for (let i = 0; i < 3; i++) { const sd = i - 1; g.beginPath(); g.moveTo(x + sp.lean * 0.6, y - th * 0.8); g.quadraticCurveTo(x + sd * sp.crownW * 0.35, y - th * 1.05, x + sd * sp.crownW * 0.62, cy + sp.crownH * 0.2); g.lineWidth = sp.trunkW * 0.42; g.strokeStyle = shade(sp.bark, -0.04); g.lineCap = 'round'; g.stroke(); }
    const list = []; for (let i = 0; i < sp.blobs; i++) { const a = (i / sp.blobs) * Math.PI * 2 + r() * 0.6, d = r.range(0.45, 1); list.push([x + sp.lean + Math.cos(a) * sp.crownW * d * 0.6, cy + Math.sin(a) * sp.crownH * d * 0.6, r.range(0.5, 0.75) * sp.crownW * 0.62, r.range(0.5, 0.72) * sp.crownH * 0.78]); }
    list.push([x + sp.lean, cy - sp.crownH * 0.1, sp.crownW * 0.5, sp.crownH * 0.55]); list.sort((a, b) => a[1] - b[1]);
    list.forEach(([bx, by, rx, ry], i) => blob(g, bx, by, rx, ry, i < list.length * 0.35 ? [P[1], P[2], shade(P[2], -0.08)] : P));
    const clumpsList = []; for (let i = 0; i < sp.clumps; i++) { const a = r() * 6.28, d = Math.sqrt(r()), bx = x + sp.lean + Math.cos(a) * sp.crownW * 0.85 * d, by = cy + Math.sin(a) * sp.crownH * 0.75 * d - 4, up = -Math.sin(a) * d; if (up < -0.2) continue; clumpsList.push([bx, by, 11, 8]); blob(g, bx, by, r.range(8, 15), r.range(6, 11), [shade(P[0], 0.1), P[0], P[1]], 0.12); }
    crownShade(g, [...list, ...clumpsList], P);
    if (sw) for (let i = 0; i < sp.vines; i++) { const vx = x + sp.lean + r.range(-sp.crownW * 0.8, sp.crownW * 0.8), vy = cy + sp.crownH * 0.35, len = r.range(18, 44); g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo(vx + r.range(-5, 5), vy + len * 0.5, vx + r.range(-3, 3), vy + len); g.lineWidth = 1.6; g.strokeStyle = shade(P[2], -0.04); g.stroke(); }
  } else if (sp.species === 'pine') {
    trunk(g, x, y, 7, sp.trunkH, sp.lean * 0.3, sp.bark);
    const tiers = sp.tiers, top = y - sp.tall;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1), by = y - sp.trunkH * 0.6 - (sp.tall - sp.trunkH * 0.6) * t * 0.82, wd = sp.tierW * (1 - t * 0.78), hh = (sp.tall / tiers) * 1.75;
      g.save(); g.fillStyle = 'rgba(6,18,12,.34)'; g.beginPath(); g.ellipse(x + wd * 0.1, by + 4, wd * 0.95, 7, 0, 0, 7); g.fill(); g.restore();   // cień piętra na niższym
      const gr = g.createLinearGradient(x - wd, 0, x + wd, 0); gr.addColorStop(0, shade(P[0], 0.06)); gr.addColorStop(0.35, P[0]); gr.addColorStop(0.62, P[1]); gr.addColorStop(1, shade(P[2], -0.1));
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
    crownShade(g, list, BP);
  } else {
    const th = sp.trunkH; trunk(g, x, y, sp.trunkW, th, sp.lean, sp.bark);
    const limb = (bx, by, ang, len, w, d) => { if (d > 3 || len < 8) return; const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo((bx + ex) / 2 + r.range(-6, 6), (by + ey) / 2 + r.range(-6, 4), ex, ey); g.lineWidth = w; g.lineCap = 'round'; g.strokeStyle = shade(sp.bark, d * -0.02); g.stroke(); limb(ex, ey, ang + r.range(0.3, 0.8), len * 0.66, w * 0.62, d + 1); limb(ex, ey, ang - r.range(0.3, 0.8), len * 0.66, w * 0.62, d + 1); };
    for (let i = 0; i < sp.branches; i++) limb(x + sp.lean * 0.8, y - th * r.range(0.7, 1), -Math.PI / 2 + r.range(-1.1, 1.1), r.range(26, 48), sp.trunkW * 0.5, 0);
  }
  g.restore();
}
