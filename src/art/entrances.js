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
  const sp = { seed, kind, ruin: r.range(0.3, 1), glow: r.range(0.5, 1), scale: kind === 'krypta' ? r.range(0.92, 1.02) : r.range(1.0, 1.1) };
  if (kind === 'krypta') Object.assign(sp, { stone: hsl(r.range(28, 46), r.range(0.06, 0.16), r.range(0.42, 0.52)), w: r.range(64, 78), h: r.range(46, 58), torches: r.int(0, 2), stairs: r.int(2, 4), slabs: r.int(2, 4), moss: r.chance(0.6), door: r.pick(['ajar', 'broken', 'sealed']) });
  else Object.assign(sp, { bark: hsl(r.range(22, 36), r.range(0.22, 0.34), r.range(0.2, 0.28)), trunkW: r.range(34, 44), height: r.range(120, 150), roots: r.int(5, 7), webs: r.int(2, 4), eggs: r.int(3, 6), shrooms: r.int(3, 6), eyes: r.chance(0.6), leaf: hsl(r.range(100, 140), r.range(0.28, 0.4), r.range(0.18, 0.26)) });
  return sp;
}
const glowAt = (g, x, y, rad, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

export function drawEntrance(g, x, y, sp) {
  const k = kit(g), { poly, ln, blob, ell, circ, lg } = k, r = rng(sp.seed * 31 + 3);
  g.save(); g.translate(x, y); g.scale(sp.scale, sp.scale);
  if (sp.kind === 'krypta') {
    // brama w skalnej ścianie: urwisko z warstwami, ostrołukowe wrota w kamiennej ramie, pochodnie, schody i obozowisko
    const Lw = 330, Hc = 250, ex = 0.894, ey = 0.447;
    const L = (u, v) => [ex * u, ey * u - v], Rr = (u, v) => [ex * (Lw / 2) + ex * u, ey * (Lw / 2) - ey * u - v];
    blob(10, 4, Lw * 0.55, 20, '#000', 0.34);
    const cliff = shade(sp.stone, -0.06), jag = (n, a0, a1) => Array.from({ length: n }, (_, i) => a0 + (a1 - a0) * i / (n - 1) + (r() - 0.5) * 16);
    // prawa ściana urwiska (w cieniu)
    const rt = jag(6, 40, 150).map((h, i) => Rr(i * 36, Hc * 0.8 + h * 0.5 - 60));
    poly([Rr(0, 0), ...rt, Rr(190, 0)], lg(0, -Hc, 0, 0, shade(cliff, -0.2), shade(cliff, -0.34)), 2);
    for (let i = 1; i < 6; i++) ln([Rr(0, i * 38), Rr(190, i * 38 + (r() - 0.5) * 8)], 1.2, 'rgba(0,0,0,.28)');
    // lewa ściana (w świetle) z nieregularną koroną
    const top = jag(10, 190, 250).map((h, i) => L(-Lw / 2 + i * (Lw / 9), h));
    poly([L(-Lw / 2, 0), ...top, L(Lw / 2, 0)], lg(-Lw / 2, -Hc, Lw / 2, 0, shade(cliff, 0.12), shade(cliff, -0.1)), 2.2);
    for (let i = 1; i < 7; i++) { const v = i * 32; ln([L(-Lw / 2, v), L(-Lw / 4, v + (r() - 0.5) * 10), L(Lw / 4, v + (r() - 0.5) * 10), L(Lw / 2, v)], 1.3, 'rgba(0,0,0,.22)'); }
    for (let i = 0; i < 9; i++) { const u = r.range(-Lw / 2, Lw / 2), v = r.range(10, 200); ln([L(u, v), L(u + r.range(-14, 14), v - r.range(16, 40))], 1, 'rgba(0,0,0,.3)'); }
    if (sp.moss) for (let i = 0; i < 9; i++) { const p = L(r.range(-Lw / 2, Lw / 2), r.range(2, 150)); blob(p[0], p[1], r.range(8, 20), r.range(3, 7), '#4a6a30', 0.45); }
    // wnęka z ostrołukowymi wrotami
    const gu = -20, gw = 46, gh = 150, arch = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; arch.push(L(gu + gw * (1 - 2 * t) * -1 - 0, gh * 0.55 + Math.pow(t < 0.5 ? t * 2 : (1 - t) * 2, 0.6) * gh * 0.45)); }
    const frame = [L(gu - gw - 12, 0), L(gu - gw - 12, gh * 0.62), L(gu, gh + 22), L(gu + gw + 12, gh * 0.62), L(gu + gw + 12, 0)];
    poly(frame, shade(sp.stone, 0.1), 2.4);
    const door = [L(gu - gw, 0), L(gu - gw, gh * 0.6), L(gu, gh), L(gu + gw, gh * 0.6), L(gu + gw, 0)];
    poly(door, '#07050a', 2); glowAt(g, L(gu, gh * 0.4)[0], L(gu, gh * 0.4)[1], 70, '230,130,50', 0.2 * sp.glow);
    ln([L(gu - gw - 6, 0), L(gu - gw - 6, gh * 0.62), L(gu, gh + 12), L(gu + gw + 6, gh * 0.62), L(gu + gw + 6, 0)], 2, 'rgba(255,240,200,.22)');
    // wrota: uchylone, wyłamane albo zapieczętowane, okute żelazem
    if (sp.door === 'ajar') { poly([L(gu + 4, 0), L(gu + gw - 4, 0), L(gu + gw - 4, gh * 0.58), L(gu + 4, gh * 0.84)], '#4a3418', 1.8); for (let i = 1; i < 4; i++) ln([L(gu + 4, i * gh * 0.2), L(gu + gw - 4, i * gh * 0.17)], 2.4, '#1c1812'); }
    else if (sp.door === 'sealed') { for (let i = 0; i < 5; i++) ln([L(gu - gw + 4, 12 + i * 26), L(gu + gw - 4, 4 + i * 26)], 5, '#4a3820'); }
    else { ln([L(gu - gw + 8, 4), L(gu + 10, gh * 0.7)], 5, '#3a2814'); ln([L(gu + gw - 6, 6), L(gu - 12, gh * 0.5)], 4, '#4a3820'); }
    // czaszka nad wejściem
    const sk = L(gu, gh + 34); ell(sk[0], sk[1], 9, 8, '#d8cdb0', 1.6); ell(sk[0] - 3, sk[1], 2.2, 2.6, '#150c08', 0); ell(sk[0] + 3, sk[1], 2.2, 2.6, '#150c08', 0);
    // schody i podest
    for (let i = 0; i < sp.stairs; i++) { const w2 = gw * 2 + 40 + i * 18, v0 = -i * 5; poly([L(gu - w2 / 2, v0), L(gu + w2 / 2, v0), L(gu + w2 / 2, v0 - 5), L(gu - w2 / 2, v0 - 5)], shade(sp.stone, 0.06 - i * 0.04), 1.6); }
    // pochodnie na żelaznych słupach
    for (const sd of [-1, 1]) { const t = L(gu + sd * (gw + 38), 0), tt = [t[0], t[1] - 78]; ln([t, tt], 3.4, '#2a2018'); ell(tt[0], tt[1] - 2, 6, 3, '#3a3028', 1.4); glowAt(g, tt[0], tt[1] - 12, 50, '255,150,60', 0.55 * sp.glow); g.fillStyle = '#ffb848'; g.beginPath(); g.ellipse(tt[0], tt[1] - 10, 4, 9 + (r() - 0.5) * 3, 0, 0, 7); g.fill(); g.fillStyle = '#fff0b0'; g.beginPath(); g.ellipse(tt[0], tt[1] - 8, 1.8, 4.6, 0, 0, 7); g.fill(); }
    // gruz, skrzynie i palisada obozowiska
    for (let i = 0; i < 9; i++) { const p = L(gu + r.range(-150, 160), -r.range(6, 30)); ell(p[0], p[1], r.range(3, 8) * sp.ruin, r.range(2, 4), shade(sp.stone, r.range(-0.12, 0.06)), 1.2); }
    for (let i = 0; i < 4; i++) { const p = L(gu + 120 + i * 14, -12 - (i % 2) * 8); isoBox(g, p[0], p[1], 22, 22, 22, { left: '#8a6a3a', right: '#6a4e2a', top: '#a88850' }); }
    for (let i = 0; i < 4; i++) { const p = L(gu - 110 - i * 12, -16 + (i % 2) * 6); poly([[p[0] - 3, p[1]], [p[0], p[1] - 40 - i * 4], [p[0] + 3, p[1]]], '#5a4228', 1.4); }
    for (let i = 0; i < sp.slabs; i++) grave(g, L(-Lw / 2 - 20 - i * 24, -10)[0], L(-Lw / 2 - 20 - i * 24, -10)[1], 0.9);
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
