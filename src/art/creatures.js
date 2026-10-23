// Stworzenia: rodzina Kopaczy. genKopacz(ziarno, rodzaj) losuje wygląd, drawKopacz rysuje go w 4 kierunkach (SE, NE wprost, SW i NW to lustro).
// Wszystkie rodzaje mają wspólny plan (garb, długie ramiona z pazurami, ślepe oczy), ale różnią się sylwetką, wyposażeniem i światłem.
import { rng } from './rng.js';
import { kit } from './kit.js';
import { hsl, shade } from './color.js';
import { DIRS } from './characters.js';

export const KOPACZE = ['kopacz', 'pancerny', 'szperacz', 'pluja', 'zerca'];
// boss rodziny: duży, w koronie z kości (nie losuje się go bez nazwy rodzaju)
export const BOSSOWIE = ['krol'];
export { DIRS };
// zakresy sylwetki na rodzaj: skala, szerokość tułowia, wysokość tułowia, długość ramienia, głowa, liczba pazurów
const PLAN = {
  krol: { sc: [1.65, 1.85], bw: [17, 19], bh: [22, 25], arm: [12, 14], head: [7, 8], claws: [3, 4], sh: [1.1, 1.2], wa: [0.95, 1.05] },
  kopacz: { sc: [0.95, 1.1], bw: [11, 14], bh: [17, 21], arm: [13, 17], head: [7, 8.6], claws: [3, 4], sh: [1.2, 1.35], wa: [0.7, 0.85] },
  pancerny: { sc: [1.22, 1.42], bw: [15, 18], bh: [18, 22], arm: [9, 12], head: [6, 7.2], claws: [2, 3], sh: [1.0, 1.1], wa: [0.9, 1.0] },
  szperacz: { sc: [0.8, 0.92], bw: [8, 10], bh: [15, 18], arm: [15, 19], head: [7.4, 9], claws: [4, 5], sh: [0.8, 0.95], wa: [0.55, 0.7] },
  pluja: { sc: [0.95, 1.06], bw: [9, 11], bh: [20, 24], arm: [9, 11], head: [6, 7.2], claws: [2, 3], sh: [0.8, 0.95], wa: [1.05, 1.2] },
  zerca: { sc: [1, 1.12], bw: [9, 11], bh: [16, 20], arm: [13, 16], head: [7, 8.2], claws: [3, 4], sh: [1.1, 1.25], wa: [0.5, 0.65] },
};
// odmiany barwy skóry: każdy rodzaj ma kilka, więc stwory z jednego lochu nie są do siebie podobne kolorem
const MORPHS = {
  glina: [[18, 34], [0.3, 0.45], [0.3, 0.38]], lupek: [[205, 232], [0.12, 0.22], [0.28, 0.36]], mech: [[72, 108], [0.22, 0.36], [0.25, 0.33]],
  rdza: [[2, 16], [0.42, 0.56], [0.3, 0.38]], kosc: [[38, 50], [0.2, 0.3], [0.52, 0.64]], fiolet: [[262, 296], [0.16, 0.3], [0.3, 0.38]], siarka: [[46, 62], [0.4, 0.55], [0.34, 0.44]],
};
const KIND_MORPHS = { krol: ['kosc', 'glina', 'rdza'], kopacz: ['glina', 'glina', 'lupek', 'mech', 'rdza'], pancerny: ['kosc', 'lupek', 'rdza', 'glina', 'mech'], szperacz: ['kosc', 'fiolet', 'mech', 'siarka', 'lupek'], pluja: ['rdza', 'siarka', 'glina', 'fiolet', 'rdza'], zerca: ['mech', 'fiolet', 'lupek', 'rdza', 'siarka'] };
const BLIND_EYES = ['#e4ecf0', '#f0e8b0', '#c8e8c8', '#e8c8d8', '#d8c8f0'];

export function genKopacz(seed, kind) {
  const r = rng(seed * 7919 + 31);
  kind = kind || r.pick(KOPACZE);
  const p = PLAN[kind];
  const morph = r.pick(KIND_MORPHS[kind]), M = MORPHS[morph], hue = r.range(...M[0]), sat = r.range(...M[1]), mid = hsl(hue, sat, r.range(...M[2]));
  const sp = {
    seed, kind, morph, sh: r.range(...p.sh), wa: r.range(...p.wa), sc: r.range(...p.sc), bw: r.range(...p.bw), bh: r.range(...p.bh), arm: r.range(...p.arm), hr: r.range(...p.head), claws: r.int(...p.claws),
    clawLen: r.range(5, 8.5), hunch: r.range(2, 6), spines: r.int(3, 7), scars: r.int(0, 3), horns: kind === 'zerca' ? 0 : r.int(0, 2), brow: r.range(0, 1),
    pal: { mid, dark: shade(mid, -0.1), light: shade(mid, 0.1), belly: hsl(hue + r.range(-35, 35), Math.min(0.5, sat * 0.9), r.range(0.46, 0.58)), bone: hsl(r.range(34, 60), r.range(0.25, 0.42), r.range(0.74, 0.88)), acc: hsl(hue + r.range(110, 210), r.range(0.3, 0.5), r.range(0.4, 0.55)) },
    eyeCol: kind === 'pluja' ? '#ff8a30' : kind === 'zerca' ? '#c83a3a' : r.pick(BLIND_EYES), stripes: r.int(0, 3),
  };
  if (kind === 'pancerny' || kind === 'krol') sp.plates = r.int(5, 7);
  if (kind === 'krol') sp.crown = r.int(5, 7);
  if (kind === 'szperacz') sp.feelers = r.int(2, 4);
  if (kind === 'pluja') sp.sac = r.range(5.5, 8.5);
  if (kind === 'zerca') { sp.neck = r.range(5, 9); sp.ribs = r.int(3, 4); }
  if (kind === 'kopacz') sp.ribs = r.int(2, 3);
  return sp;
}

// zamknięta gładka krzywa przez punkty (kwadratowe łuki przez środki odcinków), wypełniona i obrysowana
function smooth(g, pts, fill, lw = 1.9) {
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]);
  g.beginPath(); g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = '#150c08'; g.lineJoin = 'round'; g.stroke(); }
}

export function drawKopacz(g, x, y, sp, o = {}) {
  const { poly, ln, circ, ell, blob, lg } = kit(g), back = o.view === 'back', walking = o.t != null, th = walking ? o.t * Math.PI * 2 : 0;
  const P = sp.pal, heavy = sp.kind === 'pancerny' || sp.kind === 'krol';
  const bob = walking ? -Math.abs(Math.cos(th)) * (heavy ? 2.4 : 1.6) : 0, step = walking ? Math.sin(th) * 3.2 : 0;
  const bw = sp.bw, bh = sp.bh, top = -9 - bh + bob, cy = -9 - bh / 2 + bob, neck = sp.neck || 0;
  g.save(); g.translate(x, y);
  if (o.ring) { g.save(); g.scale(1, 0.5); g.beginPath(); g.arc(0, 4, 22 * sp.sc, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = o.ring; g.stroke(); g.fillStyle = o.ring.replace('rgb', 'rgba').replace(')', ',.22)'); g.fill(); g.restore(); }
  if (o.mirror) g.scale(-1, 1);
  g.scale(sp.sc, sp.sc);
  blob(0, 3, bw * 1.7, 5, '#000', 0.28);
  // nogi: zgięte w kolanie, zwężone ku stopie, z pazurkami
  for (const sg of [-1, 1]) {
    const lx = sg * bw * 0.5, st = sg * step * 0.3, hip = [lx, -11 + bob * 0.3], knee = [lx + sg * 4.2 + st * 0.4, -6], foot = [lx + sg * 1.5 + st, -1.4];
    const col = sg < 0 ? P.dark : P.mid;
    ln([hip, knee, foot], bw * 0.62 + 2.4, '#150c08'); ln([hip, knee, foot], bw * 0.62, col);
    ln([[knee[0] - 1.2, knee[1] - 2.4], [knee[0] + 1.6, knee[1] - 1]], 1, P.light);
    ell(foot[0] + sg * 0.8, foot[1] + 0.2, bw * 0.34, 2.5, P.dark, 1.5);
    for (let i = -1; i <= 1; i++) ln([[foot[0] + sg * 0.8 + i * bw * 0.22, foot[1] + 1.4], [foot[0] + sg * 0.8 + i * bw * 0.28, foot[1] + 3.8]], 1.4, P.bone);
  }
  const head = () => {
    const hy = top + 3 + (sp.hunch * 0.4) - neck + (back ? -1 : 0), hr = sp.hr;
    if (neck) { poly([[-3, cy - bh * 0.3], [3, cy - bh * 0.3], [2.5, hy + hr * 0.6], [-2.5, hy + hr * 0.6]], P.mid, 1.6); }
    for (let i = 0; i < sp.horns; i++) { const sg = i ? 1 : -1; poly([[sg * hr * 0.55, hy - hr * 0.5], [sg * hr * 1.15, hy - hr * 1.35], [sg * hr * 0.2, hy - hr * 0.8]], P.bone, 1.4); }
    if (sp.feelers) for (let i = 0; i < sp.feelers; i++) { const sg = i % 2 ? 1 : -1, k = 1 + (i >> 1) * 0.6; ln([[sg * hr * 0.3, hy - hr * 0.8], [sg * hr * 1.1 * k, hy - hr * 1.7 * k], [sg * hr * 1.7 * k, hy - hr * 1.5 * k]], 1.6, P.dark); circ(sg * hr * 1.7 * k, hy - hr * 1.5 * k, 1.5, P.bone, 1); }
    if (sp.crown) for (let i = 0; i < sp.crown; i++) { const t = (i / (sp.crown - 1)) * 2 - 1, bx = t * hr * 0.95, h2 = (i % 2 ? 5 : 8) + hr * 0.3; poly([[bx - 2.2, hy - hr * 0.7 - Math.abs(t) * 1.5], [bx, hy - hr * 0.7 - h2 - Math.abs(t) * 1.5], [bx + 2.2, hy - hr * 0.7 - Math.abs(t) * 1.5]], P.bone, 1.3); if (i % 2 === 0) circ(bx, hy - hr * 0.7 - h2 - 1 - Math.abs(t) * 1.5, 1.6, '#e8e0cc', 1); }
    const skull = sp.kind === 'zerca';
    ell(0, hy, hr * 1.15, hr, lg(-hr, hy - hr, hr, hy + hr, skull ? P.bone : P.light, skull ? shade(P.bone, -0.18) : P.mid), 1.8);
    if (back) { for (let i = 0; i < 3; i++) ln([[-hr * 0.5 + i * hr * 0.5, hy - hr * 0.8], [-hr * 0.4 + i * hr * 0.4, hy - hr * 0.1]], 1.1, P.dark); return; }
    const ex = hr * 0.45, ey = hy - hr * 0.1;
    if (sp.kind === 'szperacz') for (const s of [-1, 1]) { circ(s * ex, ey, hr * 0.38, sp.eyeCol, 1.3); circ(s * ex + s * 0.6, ey + 0.4, hr * 0.14, '#222', 0); }
    else if (skull) for (const s of [-1, 1]) { ell(s * ex, ey, hr * 0.3, hr * 0.34, '#2a1414', 1.2); circ(s * ex, ey + 0.5, 1.1, sp.eyeCol, 0); }
    else if (sp.kind === 'pluja') for (const s of [-1, 1]) { circ(s * ex, ey, 1.7, sp.eyeCol, 0.8); }
    else if (heavy) for (const s of [-1, 1]) ln([[s * ex - 2, ey], [s * ex + 2, ey + 0.6 * s]], 1.6, '#1c1410');
    else for (const s of [-1, 1]) { circ(s * ex, ey, 1.9, sp.eyeCol, 0.9); } // ślepe, mleczne oczy
    for (let i = 0; i < sp.scars; i++) ln([[-hr * 0.9 + i * hr * 0.6, hy - hr * 0.7], [-hr * 0.5 + i * hr * 0.6, hy - hr * 0.1]], 1.1, 'rgba(30,10,6,.7)');
    // pysk
    const my = hy + hr * 0.52, open = sp.kind === 'pluja' ? 3.4 : sp.kind === 'zerca' ? 3 : 1.7;
    ell(0, my, hr * 0.62, open, '#1c0c08', 1.3);
    if (sp.kind === 'pluja') { const gr = g.createRadialGradient(0, my, 0, 0, my, hr * 0.7); gr.addColorStop(0, 'rgba(255,170,60,.95)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, my, hr * 0.62, open, 0, 0, 7); g.fill(); }
    for (let i = -2; i <= 2; i++) poly([[i * hr * 0.2 - 1, my - open * 0.6], [i * hr * 0.2 + 1, my - open * 0.6], [i * hr * 0.2, my + 0.6]], P.bone, 0.7);
  };
  const body = () => {
    const sw = bw * sp.sh, ww = bw * sp.wa, bot = cy + bh / 2;
    smooth(g, [[-sw * 0.55, top - 1.5], [0, top - 2.5], [sw * 0.55, top - 1.5], [sw, top + 3.5], [(sw + ww) / 2 + 1, cy + bh * 0.1], [ww, bot - 3], [ww * 0.55, bot + 0.5], [-ww * 0.55, bot + 0.5], [-ww, bot - 3], [-(sw + ww) / 2 - 1, cy + bh * 0.1], [-sw, top + 3.5]], lg(-sw, top, sw, bot, P.light, P.dark), 1.9);
    for (let i = 0; i < sp.stripes; i++) { const sy = cy - bh * 0.1 + i * bh * 0.18; ln([[-ww * 0.7, sy], [0, sy + 2], [ww * 0.7, sy]], 2, P.acc); }
    if (!back) {
      ell(0, cy + bh * 0.14, ww * 0.62, bh * 0.3, P.belly, 0);
      for (let i = 0; i < (sp.ribs || 0); i++) { const ry = cy - bh * 0.2 + i * (bh * 0.2); ln([[-ww * 0.6, ry], [0, ry + 2.4], [ww * 0.6, ry]], sp.kind === 'zerca' ? 2 : 1.2, sp.kind === 'zerca' ? P.bone : P.dark); }
    }
    if (heavy) {
      const n = sp.plates;
      if (back) for (let i = 0; i < n; i++) { const py = top + 3 + i * ((bh - 3) / n), pw = bw * (0.95 - Math.abs(i - n * 0.4) * 0.07); ell(0, py + 3, pw, 4.2, lg(0, py, 0, py + 8, P.bone, shade(P.bone, -0.2)), 1.5); }
      else for (const s of [-1, 1]) { ell(s * bw * 0.85, top + 4, bw * 0.42, 5, P.bone, 1.6); ln([[s * bw * 0.6, top + 3], [s * bw * 1.1, top + 5]], 1, P.dark); }
    }
    if (back) for (let i = 0; i < sp.spines; i++) { const sy = top + 2 + i * ((bh - 4) / sp.spines), w = 2.3 + (heavy ? 1 : 0); poly([[-w, sy + 3], [0, sy - 4.5 - (i % 2)], [w, sy + 3]], i % 2 ? P.bone : P.acc, 1.3); }
    if (sp.kind === 'pluja' && !back) {
      const sy = top + sp.hunch * 0.4 + sp.hr + 3, gr = g.createRadialGradient(0, sy, 0, 0, sy, sp.sac);
      gr.addColorStop(0, '#ffd070'); gr.addColorStop(0.55, '#ff7a28'); gr.addColorStop(1, '#a8300e');
      ell(0, sy + 2, sp.sac, sp.sac * 0.85, gr, 1.6);
    }
  };
  const arms = () => {
    for (const sg of [-1, 1]) {
      const sx = sg * bw * sp.sh * 0.92, sy = top + 4, sw = step * sg * 0.35, hx = sg * (bw * sp.sh + 4.5), hy = sy + sp.arm + sw;
      ln([[sx, sy], [sx + sg * 3, (sy + hy) / 2], [hx, hy]], 6.6, '#150c08'); ln([[sx, sy], [sx + sg * 3, (sy + hy) / 2], [hx, hy]], 4.6, sg < 0 ? P.light : P.mid);
      circ(hx, hy, 3, sg < 0 ? P.light : P.mid, 1.5);
      for (let i = 0; i < sp.claws; i++) { const a = (i / Math.max(1, sp.claws - 1) - 0.5) * 1.1 + sg * 0.15, tx = hx + Math.sin(a) * sp.clawLen, ty = hy + Math.cos(a) * sp.clawLen; ln([[hx, hy], [hx + Math.sin(a) * sp.clawLen * 0.6 + sg, hy + Math.cos(a) * sp.clawLen * 0.5], [tx, ty]], 3.1, '#150c08'); ln([[hx, hy], [hx + Math.sin(a) * sp.clawLen * 0.6 + sg, hy + Math.cos(a) * sp.clawLen * 0.5], [tx, ty]], 1.5, P.bone); }
    }
  };
  if (back) { head(); body(); arms(); } else { body(); head(); arms(); }
  g.restore();
}
