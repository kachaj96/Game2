// Wejścia do lochów w świecie. Każde pasuje do wrogów, którzy mieszkają w środku: krypta dla Kopaczy, jama pod korzeniami dla owadów i pajęczaków.
// genEntrance(ziarno, rodzaj) losuje wygląd, drawEntrance rysuje go. Punkt (x,y) to środek podstawy; wszystko leży w osiach izometrii.
import { rng } from './rng.js';
import { kit, OUT, isoBox } from './kit.js';
import { hsl, shade } from './color.js';
import { grave } from './props.js';
import { genTree, drawTree } from './trees.js';

export const ENTRANCE_KINDS = ['krypta', 'jama'];
export function genEntrance(seed, kind) {
  const r = rng(seed * 6007 + 11); kind = kind || r.pick(ENTRANCE_KINDS);
  const sp = { seed, kind, ruin: r.range(0.3, 1), glow: r.range(0.5, 1), scale: kind === 'krypta' ? r.range(1.0, 1.1) : r.range(1.0, 1.1) };
  if (kind === 'krypta') Object.assign(sp, { stone: hsl(r.range(28, 46), r.range(0.06, 0.16), r.range(0.42, 0.52)), w: r.range(64, 78), h: r.range(46, 58), torches: r.int(0, 2), stairs: r.int(2, 4), slabs: r.int(2, 4), moss: r.chance(0.6), door: r.pick(['ajar', 'broken', 'sealed']) });
  else Object.assign(sp, { bark: hsl(r.range(22, 36), r.range(0.22, 0.34), r.range(0.2, 0.28)), trunkW: r.range(34, 44), height: r.range(120, 150), roots: r.int(5, 7), webs: r.int(2, 4), eggs: r.int(3, 6), shrooms: r.int(3, 6), eyes: r.chance(0.6), leaf: hsl(r.range(100, 140), r.range(0.28, 0.4), r.range(0.18, 0.26)) });
  return sp;
}
const glowAt = (g, x, y, rad, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

export function drawEntrance(g, x, y, sp) {
  const k = kit(g), { poly, ln, blob, ell, circ, lg } = k, r = rng(sp.seed * 31 + 3);
  g.save(); g.translate(x, y); g.scale(sp.scale, sp.scale);
  if (sp.kind === 'krypta') {
    // stopniowana krypta z kamienia, pełna bryła: trzy piętra, brama z ostrołukiem na ścianie frontowej, rzeźbione czaszki, schody, pochodnie i obozowisko
    const stone = sp.stone, cols = (k) => ({ left: shade(stone, 0.06 - k * 0.03), right: shade(stone, -0.14 - k * 0.03), top: shade(stone, 0.16 - k * 0.04) });
    blob(10, 5, 150, 30, '#000', 0.34);
    const tiers = [[210, 150, 70], [160, 112, 62], [108, 76, 54]]; let z = 0; const Ps = [];
    tiers.forEach(([lx, ly, h], i) => { const P = isoBox(g, 0, -z, lx, ly, h, cols(i)); Ps.push(P); const a = lx / 2, b2 = ly / 2;
      for (let q = 1; q < 3; q++) ln([P(-a, b2, h * q / 3), P(a, b2, h * q / 3)], 1, 'rgba(0,0,0,.25)');
      for (let q = -2; q <= 2; q++) { ln([P(a, b2 - (q + 2) * ly / 5, 0), P(a, b2 - (q + 2) * ly / 5, h)], 0.9, 'rgba(0,0,0,.16)'); }
      for (let q = -3; q <= 3; q++) ln([P(q * lx / 7, b2, 0), P(q * lx / 7 + (q % 2 ? 4 : -4), b2, h)], 0.8, 'rgba(0,0,0,.14)');
      // gzyms na krawędzi piętra
      poly([P(-a - 4, b2 + 4, h), P(a + 4, b2 + 4, h), P(a + 4, b2 + 4, h - 5), P(-a - 4, b2 + 4, h - 5)], shade(stone, 0.12), 1.4);
      z += h; });
    const P0 = Ps[0], a0 = 105, b0 = 75, dw = 30, dh = 52;
    // brama w ścianie frontowej (lewej) pierwszego piętra
    const arch = []; for (let i = 0; i <= 12; i++) { const t = Math.PI * i / 12; arch.push(P0(-Math.cos(t) * dw * (1 - 0.25 * Math.sin(t)), b0, dh * 0.7 + Math.sin(t) * dh * 0.45)); }
    poly([P0(-dw - 7, b0, 0), P0(-dw - 7, b0, dh * 0.7), ...arch.map((_, i) => P0(-Math.cos(Math.PI * i / 12) * (dw + 7), b0, dh * 0.7 + Math.sin(Math.PI * i / 12) * (dh * 0.45 + 7))), P0(dw + 7, b0, dh * 0.7), P0(dw + 7, b0, 0)], shade(stone, 0.2), 2.2);
    poly([P0(-dw, b0, 0), ...arch, P0(dw, b0, 0)], '#07050a', 2); glowAt(g, P0(0, b0, dh * 0.4)[0], P0(0, b0, dh * 0.4)[1], 46, '230,130,50', 0.24 * sp.glow);
    if (sp.door === 'ajar') poly([P0(2, b0, 0), P0(dw - 3, b0, 0), P0(dw - 3, b0, dh * 0.62), P0(2, b0, dh * 0.78)], '#4a3418', 1.6);
    else if (sp.door === 'sealed') for (let i = 0; i < 4; i++) ln([P0(-dw + 3, b0, 5 + i * 12), P0(dw - 3, b0, 2 + i * 12)], 3.4, '#4a3820');
    else ln([P0(-dw + 4, b0, 3), P0(8, b0, dh * 0.7)], 3.4, '#3a2814');
    // rzeźbiona czaszka nad bramą i na prawej ścianie
    { const sk = P0(0, b0, dh + 12); ell(sk[0], sk[1], 9, 8, '#d8cdb0', 1.6); ell(sk[0] - 3, sk[1], 2.2, 2.6, '#150c08', 0); ell(sk[0] + 3, sk[1], 2.2, 2.6, '#150c08', 0); }
    { const sk = P0(a0, 0, 36); ell(sk[0], sk[1], 11, 10, shade(stone, 0.18), 1.6); ell(sk[0] - 3.5, sk[1], 2.6, 3, '#150c08', 0); ell(sk[0] + 3.5, sk[1], 2.6, 3, '#150c08', 0); }
    // schody przed bramą
    for (let i = 0; i < sp.stairs; i++) isoBox(g, P0(0, b0 + 10 + i * 7, 0)[0] - 0, P0(0, b0 + 10 + i * 7, 0)[1], dw * 2 + 30 - i * 4, 9, 4 + (sp.stairs - i) * 0 + 0, cols(i + 1));
    // pochodnie na żelaznych słupach przy bramie
    for (const sd of [-1, 1]) { const t = P0(sd * (dw + 24), b0 + 8, 0), tt = [t[0], t[1] - 70]; ln([t, tt], 3.4, '#2a2018'); ell(tt[0], tt[1] - 2, 6, 3, '#3a3028', 1.4); glowAt(g, tt[0], tt[1] - 12, 50, '255,150,60', 0.55 * sp.glow); g.fillStyle = '#ffb848'; g.beginPath(); g.ellipse(tt[0], tt[1] - 10, 4, 9 + (r() - 0.5) * 3, 0, 0, 7); g.fill(); g.fillStyle = '#fff0b0'; g.beginPath(); g.ellipse(tt[0], tt[1] - 8, 1.8, 4.6, 0, 0, 7); g.fill(); }
    // mech i pnącza na piętrach, zawalony narożnik
    if (sp.moss) for (let i = 0; i < 12; i++) { const P = Ps[i % 3], q = P(r.range(-50, 50), 20, r.range(2, 40)); blob(q[0], q[1], r.range(8, 18), r.range(3, 6), '#4a6a30', 0.5); }
    for (let i = 0; i < 3; i++) { const P = Ps[2], t = P(r.range(-30, 30), 38, 54); g.beginPath(); g.moveTo(t[0], t[1]); g.quadraticCurveTo(t[0] + r.range(-6, 6), t[1] + 16, t[0] + r.range(-3, 3), t[1] + r.range(24, 40)); g.lineWidth = 1.6; g.strokeStyle = '#3a5a28'; g.stroke(); }
    // gruz, skrzynie i palisada obozowiska, nagrobki
    for (let i = 0; i < 10; i++) { const p = P0(r.range(-150, 150), b0 + r.range(14, 40), 0); ell(p[0], p[1], r.range(3, 8) * sp.ruin, r.range(2, 4), shade(stone, r.range(-0.12, 0.06)), 1.2); }
    for (let i = 0; i < 4; i++) { const p = P0(a0 + 40 + i * 10, b0 + 30 - (i % 2) * 14, 0); isoBox(g, p[0], p[1], 22, 22, 22, { left: '#8a6a3a', right: '#6a4e2a', top: '#a88850' }); }
    for (let i = 0; i < 4; i++) { const p = P0(-a0 - 34 - i * 9, b0 + 26 + (i % 2) * 6, 0); poly([[p[0] - 3, p[1]], [p[0], p[1] - 38 - i * 4], [p[0] + 3, p[1]]], '#5a4228', 1.4); }
    for (let i = 0; i < sp.slabs; i++) { const p = P0(-a0 - 70 - i * 22, b0 + 10, 0); grave(g, p[0], p[1], 0.9); }
  } else {
    // olbrzymie drzewo (to samo malarskie drzewo co w lesie, tylko większe) z jamą między korzeniami, pajęczynami i kokonami
    const tw = sp.trunkW * 1.5, th = sp.height * 1.15;
    drawTree(g, 0, 0, { ...genTree(sp.seed, 'swamp', 'dark'), trunkW: tw * 0.7, trunkH: th, crownW: 150, crownH: 96, blobs: 12, clumps: 22, vines: 12, lean: 4 });
    for (let i = 0; i < sp.roots; i++) { const sd = i % 2 ? 1 : -1, t = Math.floor(i / 2), len = tw * (1.0 + t * 0.4) * r.range(0.8, 1.2), yy = r.range(-4, 5) - t * 2; g.beginPath(); g.moveTo(sd * tw * 0.3, -18); g.bezierCurveTo(sd * tw * 0.7, -6 - t, sd * len * 0.9, yy - 8, sd * len * 1.25, yy + 3); g.bezierCurveTo(sd * len * 0.9, yy + 3, sd * tw * 0.8, 4, sd * tw * 0.15, 3); g.closePath(); g.fillStyle = shade(sp.bark, sd < 0 ? 0.05 : -0.05); g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(20,10,6,.55)'; g.stroke(); }
    ell(0, -16, tw * 0.5, 26, '#080406', 2.4); glowAt(g, 0, -15, 40, '120,200,140', 0.22 * sp.glow);
    for (let i = 0; i < sp.webs; i++) { const yy = -36 + i * 8; ln([[-tw * 0.46, yy + 12], [-tw * 0.12, yy], [tw * 0.14, yy + 6], [tw * 0.46, yy + 13]], 1, 'rgba(235,235,250,.8)'); }
    ln([[-tw * 0.48, -2], [tw * 0.1, -40], [tw * 0.48, -3]], 1, 'rgba(235,235,250,.75)'); ln([[0, -42], [0, -1]], 0.9, 'rgba(235,235,250,.65)');
    if (sp.eyes) { circ(-6, -17, 2, '#ffe060', 0); circ(6, -17, 2, '#ffe060', 0); glowAt(g, 0, -17, 20, '255,220,90', 0.4); }
    for (let i = 0; i < sp.eggs + 3; i++) { const ex2 = r.range(-tw * 1.5, tw * 1.5), ey2 = r.range(-2, 12), s2 = r.range(3, 5); ell(ex2, ey2 - s2, s2, s2 * 1.3, '#d4d0c4', 1.3); }
    for (let i = 0; i < sp.shrooms + 3; i++) { const mx = r.range(-tw * 1.4, tw * 1.4), my = r.range(-2, 10), s2 = r.range(2.5, 5); ln([[mx, my], [mx, my - s2 * 1.4]], 1.8, '#e0d8c0'); ell(mx, my - s2 * 1.5, s2 * 1.4, s2 * 0.9, '#a05a3a', 1.2); }
  }
  g.restore();
}
