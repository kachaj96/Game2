// Wejścia do lochów w świecie. Każde pasuje do wrogów, którzy mieszkają w środku: krypta dla Kopaczy, jama pod korzeniami dla owadów i pajęczaków.
// genEntrance(ziarno, rodzaj) losuje wygląd, drawEntrance rysuje go. Punkt (x,y) to środek podstawy; wszystko leży w osiach izometrii.
import { rng } from './rng.js';
import { kit, OUT, isoBox } from './kit.js';
import { hsl, shade } from './color.js';
import { grave } from './props.js';

export const ENTRANCE_KINDS = ['krypta', 'jama'];
export function genEntrance(seed, kind) {
  const r = rng(seed * 6007 + 11); kind = kind || r.pick(ENTRANCE_KINDS);
  const sp = { seed, kind, ruin: r.range(0.3, 1), glow: r.range(0.5, 1), scale: kind === 'krypta' ? r.range(1.4, 1.55) : r.range(1.3, 1.4) };
  if (kind === 'krypta') Object.assign(sp, { stone: hsl(r.range(28, 46), r.range(0.06, 0.16), r.range(0.42, 0.52)), w: r.range(64, 78), h: r.range(46, 58), torches: r.int(0, 2), stairs: r.int(2, 4), slabs: r.int(2, 4), moss: r.chance(0.6), door: r.pick(['ajar', 'broken', 'sealed']) });
  else Object.assign(sp, { bark: hsl(r.range(22, 36), r.range(0.22, 0.34), r.range(0.2, 0.28)), trunkW: r.range(34, 44), height: r.range(120, 150), roots: r.int(5, 7), webs: r.int(2, 4), eggs: r.int(3, 6), shrooms: r.int(3, 6), eyes: r.chance(0.6), leaf: hsl(r.range(100, 140), r.range(0.28, 0.4), r.range(0.18, 0.26)) });
  return sp;
}
const glowAt = (g, x, y, rad, rgb, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };

export function drawEntrance(g, x, y, sp) {
  const k = kit(g), { poly, ln, blob, ell, circ, lg } = k, r = rng(sp.seed * 31 + 3);
  g.save(); g.translate(x, y); g.scale(sp.scale, sp.scale);
  if (sp.kind === 'krypta') {
    blob(4, 2, sp.w * 0.75, 11, '#000', 0.3);
    // kopiec ziemi za fasadą, jakby krypta wbijała się w zbocze
    blob(0, -sp.h * 0.45, sp.w * 0.62, sp.h * 0.62, shade(hsl(32, 0.3, 0.3), -0.05), 0.55); blob(-8, -sp.h * 0.62, sp.w * 0.4, sp.h * 0.3, hsl(40, 0.3, 0.34), 0.7);
    for (let i = 0; i < sp.stairs; i++) isoBox(g, 0, -i * 3 + 2, 30 + (sp.stairs - i) * 7, 16 + (sp.stairs - i) * 3, 3.2, { left: shade(sp.stone, -0.06), right: shade(sp.stone, -0.14), top: shade(sp.stone, 0.06) });
    const lx = sp.w * 0.78, ly = 22, P = isoBox(g, 0, -sp.stairs * 3 + 1, lx, ly, sp.h, { left: shade(sp.stone, -0.02), right: shade(sp.stone, -0.16), top: shade(sp.stone, 0.1) });
    // blachy kamienne na lewej ścianie (u wzdłuż osi x, v w górę)
    const a = lx / 2, b = ly / 2;
    for (let i = 1; i < 5; i++) ln([P(-a, b, sp.h * i / 5), P(a, b, sp.h * i / 5)], 1, 'rgba(0,0,0,.22)');
    for (let i = -2; i <= 2; i++) ln([P(i * lx / 6, b, 0), P(i * lx / 6 + (i % 2 ? 4 : -4), b, sp.h)], 0.9, 'rgba(0,0,0,.16)');
    // łukowate wejście w lewej ścianie
    const dw = lx * 0.2, dh = sp.h * 0.5, arch = [];
    for (let i = 0; i <= 14; i++) { const t = Math.PI * i / 14; arch.push(P(-Math.cos(t) * dw, b, dh + Math.sin(t) * dw * 1.05)); }
    poly([P(-dw, b, 0), ...arch, P(dw, b, 0)], '#0a0606', 2.2);
    glowAt(g, P(0, b, dh * 0.5)[0], P(0, b, dh * 0.5)[1], 30, '224,120,50', 0.22 * sp.glow);
    ln([P(-dw, b, 0), ...arch, P(dw, b, 0)], 3.4, shade(sp.stone, 0.12));
    // drzwi: uchylone skrzydło, wyłamane albo zapieczętowane
    if (sp.door === 'ajar') poly([P(dw * 0.2, b, 0), P(dw, b, 0), P(dw, b, dh * 0.95), P(dw * 0.2, b, dh * 0.8)], '#3a2814', 1.8);
    else if (sp.door === 'sealed') { for (let i = 0; i < 4; i++) ln([P(-dw, b, dh * 0.2 + i * dh * 0.22), P(dw, b, dh * 0.1 + i * dh * 0.22)], 3, '#4a3820'); }
    else ln([P(-dw * 0.8, b, 2), P(dw * 0.2, b, dh * 0.7)], 3, '#3a2814');
    // zawalony nadproże i gruz
    poly([P(-a * 0.9, b, sp.h), P(-a * 0.25, b, sp.h + 4 * sp.ruin), P(-a * 0.2, b, sp.h - 5), P(-a * 0.9, b, sp.h - 6)], shade(sp.stone, 0.05), 1.6);
    for (let i = 0; i < 6; i++) { const rx = r.range(-a, a * 1.2), rz = r.range(0, 7); ell(P(rx, b + 6, 0)[0], P(rx, b + 6, rz)[1] + 2, r.range(3, 6) * sp.ruin, r.range(2, 3.4), shade(sp.stone, r.range(-0.1, 0.08)), 1.2); }
    if (sp.moss) for (let i = 0; i < 5; i++) blob(P(r.range(-a, a), b, r.range(2, sp.h * 0.5))[0], P(0, b, r.range(2, sp.h * 0.5))[1], r.range(3, 7), r.range(1.6, 3), '#3a5a2a', 0.5);
    for (let i = 0; i < sp.slabs; i++) { const sx = -lx * 0.9 - i * 15, sy = 8 + i * 4; grave(g, sx, sy, 0.7 + 0.1 * (i % 2)); }
    for (let i = 0; i < sp.torches; i++) { const t = P(i ? a * 0.82 : -a * 0.82, b, sp.h * 0.55); ln([t, [t[0], t[1] + 7]], 2, '#4a3418'); glowAt(g, t[0], t[1] - 3, 22, '255,150,60', 0.5); circ(t[0], t[1] - 3, 2.4, '#ffb040', 1); }
  } else {
    // olbrzymie drzewo: pień, korzenie z wyrwą na jamę, pajęczyny i kokony
    blob(6, 3, sp.trunkW * 1.7, 12, '#000', 0.35);
    const tw = sp.trunkW, th = sp.height;
    // korzenie
    for (let i = 0; i < sp.roots; i++) { const sd = i % 2 ? 1 : -1, t = Math.floor(i / 2), len = tw * (0.9 + t * 0.35) * r.range(0.8, 1.2), yy = r.range(-4, 4) - t * 2; g.beginPath(); g.moveTo(sd * tw * 0.35, -14); g.bezierCurveTo(sd * tw * 0.7, -4 - t, sd * len * 0.9, yy - 6, sd * len * 1.2, yy + 3); g.bezierCurveTo(sd * len * 0.9, yy + 2, sd * tw * 0.8, 3, sd * tw * 0.2, 2); g.closePath(); g.fillStyle = shade(sp.bark, sd < 0 ? 0.04 : -0.04); g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); }
    // pień
    g.beginPath(); g.moveTo(-tw * 0.62, 0); g.bezierCurveTo(-tw * 0.5, -th * 0.3, -tw * 0.42, -th * 0.7, -tw * 0.5, -th); g.lineTo(tw * 0.5, -th); g.bezierCurveTo(tw * 0.44, -th * 0.7, tw * 0.5, -th * 0.3, tw * 0.62, 0); g.closePath();
    g.fillStyle = lg(-tw, 0, tw, 0, shade(sp.bark, 0.07), shade(sp.bark, -0.08)); g.fill(); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
    for (let i = 0; i < 9; i++) { const yy = -r.range(14, th - 8), xx = r.range(-tw * 0.4, tw * 0.4); ln([[xx, yy], [xx + r.range(-2, 2), yy - r.range(8, 20)]], 1.2, 'rgba(0,0,0,.35)'); }
    // jama między korzeniami
    ell(0, -13, tw * 0.42, 21, '#080406', 2.6); glowAt(g, 0, -12, 32, '120,200,140', 0.2 * sp.glow);
    for (let i = 0; i < sp.webs; i++) { const yy = -30 + i * 7; ln([[-tw * 0.38, yy + 10], [-tw * 0.1, yy], [tw * 0.12, yy + 5], [tw * 0.38, yy + 11]], 1, 'rgba(235,235,250,.8)'); }
    ln([[-tw * 0.4, -2], [tw * 0.1, -33], [tw * 0.4, -3]], 1, 'rgba(235,235,250,.75)'); ln([[0, -34], [0, -1]], 0.9, 'rgba(235,235,250,.65)');
    if (sp.eyes) { circ(-5, -14, 1.8, '#ffe060', 0); circ(5, -14, 1.8, '#ffe060', 0); glowAt(g, 0, -14, 16, '255,220,90', 0.35); }
    // kokony i grzyby u podstawy
    for (let i = 0; i < sp.eggs; i++) { const ex = r.range(-tw * 1.3, tw * 1.3), ey = r.range(-2, 8), s = r.range(2.4, 4); ell(ex, ey - s, s, s * 1.3, '#d4d0c4', 1.3); }
    for (let i = 0; i < sp.shrooms; i++) { const mx = r.range(-tw * 1.2, tw * 1.2), my = r.range(-2, 7), s = r.range(2, 4); ln([[mx, my], [mx, my - s * 1.4]], 1.6, '#e0d8c0'); ell(mx, my - s * 1.5, s * 1.3, s * 0.8, '#a05a3a', 1.2); }
    // korona wysoko nad głową
    for (let i = 0; i < 9; i++) { const cx = r.range(-tw * 1.9, tw * 1.9), cy = -th - r.range(-10, 26), rr = r.range(18, 34); circ(cx, cy, rr, shade(sp.leaf, r.range(-0.06, 0.06)), 2); }
    for (let i = 0; i < 5; i++) { const cx = r.range(-tw * 1.4, tw * 1.4), cy = -th - r.range(0, 26); circ(cx - 3, cy - 4, r.range(8, 14), shade(sp.leaf, 0.1), 0); }
    for (let i = 0; i < 3; i++) { const wx = r.range(-tw * 1.5, tw * 1.5); ln([[wx, -th + 10], [wx + r.range(-3, 3), -th + r.range(40, 70)]], 0.9, 'rgba(235,235,250,.55)'); }
  }
  g.restore();
}
