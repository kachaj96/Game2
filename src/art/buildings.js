// Generator budynków. genBuilding(ziarno, rodzaj) losuje specyfikację, drawBuilding rysuje ją w rzucie izometrycznym.
// (X,Y) to przedni dolny róg budynku (róg S). Lewa ściana patrzy w lewo-dół (cień), prawa w prawo-dół (światło).
import { rng } from './rng.js';
import { kit, OUT, plane, planeEllipse, RECEDE, leafClump } from './kit.js';
import { TW, TH } from '../grid.js';
import { shade, mix } from './color.js';
import { PROPS } from './props.js';

export { TW, TH };
export const OVERHANG = 0.16;
const NL = [-0.894, 0.447], NR = [0.894, 0.447];
export const KINDS = ['cottage', 'townhouse', 'tavern', 'shop', 'tower', 'farmhouse'];

const PLASTER = ['#f6ecc9', '#efd9a0', '#f1dfc8', '#e9e2cf', '#f4d9b8', '#dfe6d8', '#e8cfa8', '#f2c9b0', '#f8f2e0'];
const TIMBER = ['#6a3f1c', '#4a2e1a', '#7a4a26', '#5a3a2a', '#3e3a36'];
const STONE = ['#b9b1a0', '#a29a8a', '#c4b898', '#9a9e98', '#b0a48c'];
const ROOF = ['#c0582c', '#a8452a', '#7a8a98', '#6a8a6a', '#8a5a3a', '#b04a3a', '#5a6a86', '#c07a3a', '#9a6a4a', '#d8742a', '#2f8aa0', '#c84a5a', '#4a7ac0', '#d89a2a'];
const SHUT = ['#2f6a4a', '#a8352a', '#2a5a8a', '#6a3f1c', '#7a4a8a', '#c08a2a'];
const FLOWER = ['#e8483a', '#f0c83a', '#f07aa8', '#ffffff', '#a86ae0', '#ff9a3a'];
const AWN = [['#c8382a', '#fff3d8'], ['#2a6aa8', '#fff3d8'], ['#2f8a4a', '#fff3d8'], ['#d89a1a', '#fff3d8'], ['#8a3a8a', '#fff3d8']];

export function genBuilding(seed, kind) {
  const r = rng(seed * 7919 + 13);
  kind = kind || r.pick(KINDS);
  const s = { seed, kind };
  s.timber = r.pick(TIMBER); s.stone = r.pick(STONE); s.wall = r.pick(PLASTER); s.roofCol = r.pick(ROOF);
  s.shutter = r.chance(0.7) ? r.pick(SHUT) : null;
  s.flowerBox = r.chance(0.45); s.vines = r.chance(0.3); s.lamp = r.chance(0.55);
  s.doorFace = r.chance(0.6) ? 'R' : 'L'; s.doorType = r.pick(['plank', 'arch', 'double']); s.doorU = r.range(0.3, 0.62);
  s.winType = r.pick(['rect', 'arch', 'rect', 'round']);
  s.chimney = r.chance(0.8); s.smoke = r.chance(0.5); s.litProb = r.range(0, 0.55);
  s.ridge = r.pick(['x', 'y']); s.jetty = false; s.balcony = false; s.awning = null; s.sign = false; s.flag = false; s.dormer = false; s.thatch = false;
  s.props = [];
  const prop = (types, n) => { for (let i = 0; i < n; i++) s.props.push({ type: r.pick(types), face: r.chance(0.7) ? s.doorFace : (s.doorFace === 'R' ? 'L' : 'R'), u: r.range(0.08, 0.92), off: r.range(8, 20), seed: r.int(1, 999), sc: r.range(0.9, 1.15) }); };
  switch (kind) {
    case 'cottage':
      s.w = r.range(1.6, 2.4); s.d = r.range(1.5, 2.2); s.floors = r.chance(0.3) ? 2 : 1; s.fh = r.int(34, 40);
      s.material = r.pick(['timber', 'plaster', 'stone', 'plank']); s.roofShape = r.pick(['hip', 'gable']); s.thatch = r.chance(0.3);
      prop(['pot', 'barrel', 'logs', 'bench', 'sack'], r.int(1, 2)); break;
    case 'townhouse':
      s.w = r.range(1.4, 1.9); s.d = r.range(1.6, 2.3); s.floors = r.int(2, 3); s.fh = r.int(32, 38);
      s.material = r.pick(['timber', 'timber', 'plaster']); s.roofShape = 'gable'; s.jetty = r.chance(0.7); s.balcony = r.chance(0.5); s.dormer = r.chance(0.5);
      prop(['pot', 'barrel', 'crate'], r.int(1, 2)); break;
    case 'tavern':
      s.w = r.range(2.4, 3.1); s.d = r.range(2, 2.5); s.floors = 2; s.fh = r.int(36, 42);
      s.material = r.pick(['timber', 'timber', 'plaster']); s.roofShape = r.pick(['gable', 'hip']); s.balcony = r.chance(0.7); s.sign = true; s.doorType = 'double'; s.lamp = true;
      prop(['barrel', 'barrel', 'crate', 'bench', 'lampPost'], r.int(2, 3)); break;
    case 'shop':
      s.w = r.range(1.7, 2.4); s.d = r.range(1.6, 2.2); s.floors = r.chance(0.5) ? 2 : 1; s.fh = r.int(36, 42);
      s.material = r.pick(['timber', 'plaster', 'stone']); s.roofShape = r.pick(['hip', 'gable']); s.awning = r.pick(AWN); s.sign = r.chance(0.6); s.doorType = 'double';
      prop(['crate', 'crate', 'barrel', 'sack', 'cart'], r.int(2, 3)); break;
    case 'tower':
      s.w = r.range(1.2, 1.5); s.d = s.w; s.floors = r.int(3, 4); s.fh = r.int(30, 36); s.material = 'stone'; s.roofShape = 'cone'; s.flag = r.chance(0.8);
      s.doorType = 'arch'; s.winType = 'slit'; s.shutter = null; s.flowerBox = false; s.chimney = false; s.stone = r.pick(['#a8a8a0', '#b4aa94', '#98a0a8']); break;
    case 'farmhouse':
      s.w = r.range(2.3, 3); s.d = r.range(1.8, 2.2); s.floors = 1; s.fh = r.int(38, 44);
      s.material = r.pick(['plank', 'timber', 'plaster']); s.roofShape = 'gable'; s.thatch = r.chance(0.55); s.roofCol = s.thatch ? '#d4b45a' : s.roofCol;
      prop(['haybale', 'haybale', 'cart', 'logs', 'sack'], r.int(2, 3)); break;
  }
  s.w = Math.max(1, Math.min(4, Math.round(s.w))); s.d = Math.max(1, Math.min(4, Math.round(s.d)));
  if (kind === 'tower') { s.w = s.d = r.chance(0.3) ? 2 : 1; }
  const base = Math.max(s.w, s.d);
  s.roofH = s.roofShape === 'cone' ? r.int(58, 76) : s.roofShape === 'hip' ? r.int(26, 38) * (0.85 + base * 0.12) : r.int(24, 34) * (0.85 + base * 0.1);
  if (s.thatch) s.roofH *= 1.1;
  s.doorFaceLen = s.doorFace === 'R' ? s.d : s.w;
  return s;
}

// Geometria budynku w przestrzeni siatki: (x,y) w kaflach względem rogu S=(0,0), z w pikselach. Podstawa to x w [-w,0], y w [-d,0].
// Okap i kalenica liczone tutaj w siatce, dzięki temu dach leży dokładnie nad murami (bez odklejania się).
export function buildingGeometry(s) {
  const { w, d } = s, h = s.floors * s.fh, o = s.roofShape === 'cone' ? 0.08 : OVERHANG, ez = h - 3, rz = h + s.roofH;
  const eave = { W: [-w - o, o, ez], S: [o, o, ez], E: [o, -d - o, ez], N: [-w - o, -d - o, ez] };
  const geo = { w, d, h, o, ez, rz, eave };
  if (s.roofShape === 'hip' || s.roofShape === 'cone') geo.roof = { type: 'hip', apex: [-w / 2, -d / 2, rz] };
  else if (s.ridge === 'x') geo.roof = { type: 'gx', R1: [-w - o, -d / 2, rz], R2: [o, -d / 2, rz], gableFace: 'R', gableApex: [0, -d / 2, rz], baseZ: ez + (rz - ez) * o / (d / 2 + o) };
  else geo.roof = { type: 'gy', R1: [-w / 2, o, rz], R2: [-w / 2, -d - o, rz], gableFace: 'L', gableApex: [-w / 2, 0, rz], baseZ: ez + (rz - ez) * o / (w / 2 + o) };
  return geo;
}
// komórki siatki zajęte przez budynek, gdy jego róg S stoi w punkcie siatki (sx,sy)
export function footprintCells(s, sx, sy) {
  const out = []; for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) out.push({ x: sx - s.w + i, y: sy - s.d + j }); return out;
}

export function drawBuilding(g, X, Y, s) {
  const k = kit(g), { poly, ln, blob, lg, lerp, circ } = k;
  const r = rng(s.seed * 31 + 7);
  const h = s.floors * s.fh;
  const S = [X, Y], Wp = [X - s.w * TW / 2, Y - s.w * TH / 2], E = [X + s.d * TW / 2, Y - s.d * TH / 2];
  const Np = [Wp[0] + E[0] - X, Wp[1] + E[1] - Y];
  const up = (p, v) => [p[0], p[1] - v];
  const Wt = up(Wp, h), St = up(S, h), Et = up(E, h), Nt = up(Np, h);
  const faces = { L: { a: Wp, b: S, n: NL, len: s.w, dark: true }, R: { a: S, b: E, n: NR, len: s.d, dark: false } };
  const isStone = s.material === 'stone';
  const baseWall = s.material === 'stone' ? mix(s.stone, '#ffffff', 0.18) : s.material === 'plank' ? shade(s.timber, 0.2, -0.05) : s.wall;

  const P3 = (x, y, z) => [X + (x - y) * TW / 2, Y + (x + y) * TH / 2 - z];
  const quad3 = (x0, y0, x1, y1, z = 0) => [P3(x0, y0, z), P3(x1, y0, z), P3(x1, y1, z), P3(x0, y1, z)];
  // grunt pod budynkiem: wydeptana ziemia wokół podstawy i miękki cień (światło z lewej góry, cień pada w prawo-dół)
  poly(quad3(-s.w - 0.3, -s.d - 0.3, 0.3, 0.3), 'rgba(168,140,92,.5)', 0);
  for (let q = 0; q < 14; q++) blob(...P3(-s.w - 0.2 + r() * (s.w + 0.4), -s.d - 0.2 + r() * (s.d + 0.4), 0), 5 + r() * 5, 2.4 + r() * 2, r() < 0.5 ? '#b89a62' : '#d8c08a', 0.35);
  for (let q = 0; q < 7; q++) poly(quad3(-s.w + q * 0.11, -s.d + q * 0.05, q * 0.11, q * 0.05 + 0.0), 'rgba(20,30,10,.07)', 0);

  const doorFace = faces[s.doorFace];
  function face(id) {
    const f = faces[id], dark = f.dark, len = f.len;
    const F = (u, v) => [f.a[0] + (f.b[0] - f.a[0]) * u, f.a[1] + (f.b[1] - f.a[1]) * u - v];
    const Q = (u0, v0, u1, v1, fill, lw = 1.3) => poly([F(u0, v0), F(u1, v0), F(u1, v1), F(u0, v1)], fill, lw);
    const pxu = 1 / (len * TW / 2);
    const c0 = dark ? shade(baseWall, -0.11) : shade(baseWall, 0.02), c1 = dark ? shade(baseWall, -0.2) : shade(baseWall, -0.08);
    poly([f.a, f.b, up(f.b, h), up(f.a, h)], lg(0, f.a[1] - h, 0, f.a[1], c0, c1), 2);
    const tim = dark ? shade(s.timber, -0.06) : s.timber;
    // plinth
    if (!isStone) { Q(0, 0, 1, 7, lg(0, 0, 0, 7, shade(s.stone, dark ? -0.1 : 0.04), shade(s.stone, dark ? -0.2 : -0.06)), 1.2); for (let u = 0.04; u < 1; u += 0.09) ln([F(u, 0), F(u, 7)], 0.7, 'rgba(58,36,20,.35)'); }
    // material
    if (s.material === 'timber') {
      for (let kf = 0; kf <= s.floors; kf++) Q(0, kf * s.fh - (kf ? 2 : -7), 1, kf * s.fh + (kf ? 2 : 9), tim, 1);
      const n = Math.max(2, Math.round(len * 2.4));
      for (let i = 0; i <= n; i++) { const u = i / n; Q(Math.max(0, u - 0.012), 0, Math.min(1, u + 0.012), h, tim, 0.8); }
      for (let kf = 0; kf < s.floors; kf++) for (let i = 0; i < n; i++) if (r() < 0.38) { const a = F(i / n, kf * s.fh + 4), b = F((i + 1) / n, kf * s.fh + s.fh - 3), a2 = F((i + 1) / n, kf * s.fh + 4), b2 = F(i / n, kf * s.fh + s.fh - 3); const flip = r() < 0.5; ln(flip ? [a, b] : [a2, b2], 4.4, OUT); ln(flip ? [a, b] : [a2, b2], 3, tim); }
    } else if (s.material === 'stone') {
      for (let row = 0; row * 6 < h; row++) { const v = row * 6, off = (row % 2) * 0.5; ln([F(0, v + 6), F(1, v + 6)], 0.8, 'rgba(58,36,20,.3)'); const nb = Math.round(len * 5); for (let b = 0; b < nb; b++) { const u0 = (b + off) / nb, u1 = (b + off + 1) / nb; if (u0 >= 0 && u1 <= 1) { ln([F(u0, v), F(u0, v + 6)], 0.8, 'rgba(58,36,20,.28)'); if (r() < 0.14) poly([F(u0, v), F(u1, v), F(u1, v + 6), F(u0, v + 6)], 'rgba(58,36,20,.12)', 0); } } }
    } else if (s.material === 'plank') {
      const n = Math.round(len * TW / 2 / 5);
      for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n; if (i % 2) poly([F(u0, 0), F(u1, 0), F(u1, h), F(u0, h)], 'rgba(58,36,20,.1)', 0); ln([F(u0, 0), F(u0, h)], 0.8, 'rgba(58,36,20,.45)'); }
      Q(0, h - 4, 1, h, shade(s.timber, 0), 1);
    } else {
      for (let i = 0; i < 5; i++) { const u = r(); blob(...F(u, r() * h), 6, 10, '#7a5a2a', 0.07); }
      Q(0, h - 3, 1, h, tim, 1);
    }
    // cień pod okapem
    poly([F(0, h - 8), F(1, h - 8), F(1, h), F(0, h)], 'rgba(40,20,10,.2)', 0);
    poly([F(0, 0), F(1, 0), F(1, 12), F(0, 12)], lg(0, F(0, 0)[1], 0, F(0, 12)[1], 'rgba(30,20,8,.3)', 'rgba(30,20,8,0)'), 0);
    return { F, Q, pxu, tim };
  }

  const fL = face('L'), fR = face('R');
  const fo = (id) => (id === 'L' ? fL : fR);

  // okna i drzwi
  function openings(id) {
    const f = faces[id], { F, Q, pxu, tim } = fo(id), dark = f.dark, len = f.len;
    const n = Math.max(1, Math.round(len * 1.45));
    const hasDoor = s.doorFace === id;
    const du = s.doorU, dw = 7.5 * pxu;
    const balcU = s.balcony && hasDoor && s.floors >= 2 ? du : null;
    const wh = s.winType === 'slit' ? 14 : r.int(15, 19), hw0 = (s.winType === 'slit' ? 2.6 : 6.2) * pxu;
    for (let kf = 0; kf < s.floors; kf++) for (let i = 0; i < n; i++) {
      const uc = (i + 0.5) / n;
      if (hasDoor && kf === 0 && Math.abs(uc - du) < 0.19) continue;
      if (balcU != null && kf === 1 && Math.abs(uc - balcU) < 0.27) continue;
      if (s.winType === 'slit' && (kf === 0 || r() < 0.35)) continue;
      const v0 = kf * s.fh + (kf === 0 ? 7 : 0) + (s.fh - (kf === 0 ? 7 : 0) - wh) / 2 + 1, v1 = v0 + wh, hw = hw0;
      const lit = r() < s.litProb;
      const glassTop = lit ? '#ffe9a0' : dark ? '#7fb0c8' : '#a8d8ee', glassBot = lit ? '#ffb84a' : dark ? '#4a7a98' : '#6aa4c4';
      if (s.shutter && s.winType !== 'slit') { const sw = 5.6 * pxu, sc = dark ? shade(s.shutter, -0.08) : s.shutter; for (const sd of [-1, 1]) { const a = sd < 0 ? uc - hw - sw : uc + hw, b = sd < 0 ? uc - hw : uc + hw + sw; Q(a, v0 - 1, b, v1 + 1, sc, 1.2); for (let q = 1; q < 4; q++) ln([F(a, v0 + (v1 - v0) * q / 4), F(b, v0 + (v1 - v0) * q / 4)], 0.7, 'rgba(0,0,0,.35)'); } }
      const rise = s.winType === 'arch' ? 6 : 0;
      // kształt otworu: pad poszerza go o ościeżnicę (padU w jednostkach u, padV w px)
      const mk = (padU, padV) => {
        if (s.winType === 'round') { const out = [], vc = (v0 + v1) / 2; for (let a = 0; a < Math.PI * 2; a += 0.4) out.push(F(uc + (hw * 1.05 + padU) * Math.cos(a), vc + (8 + padV) * Math.sin(a))); return out; }
        const out = [F(uc - hw - padU, v0 - padV), F(uc + hw + padU, v0 - padV), F(uc + hw + padU, v1 + padV)];
        if (rise) for (let a = 0.3; a < Math.PI; a += 0.4) out.push(F(uc + (hw + padU) * Math.cos(a), v1 + padV + (rise + padU / pxu * 0.4) * Math.sin(a)));
        out.push(F(uc - hw - padU, v1 + padV)); return out;
      };
      const pts = mk(0, 0);
      // kamienna ościeżnica: otwór ma grubość muru, więc widać obramowanie, a szyba siedzi w głębi
      if (s.winType !== 'slit') poly(mk(1.9 * pxu, 1.8), dark ? shade(s.stone, -0.1) : shade(s.stone, 0.1), 1.3);
      if (s.winType === 'slit') { poly(pts, '#2a2a30', 1.4); continue; }
      const gy0 = F(uc, v0)[1], gy1 = F(uc, v1 + rise)[1];
      poly(pts, lg(0, gy1, 0, gy0, glassTop, glassBot), 1.9);
      if (lit) blob(F(uc, (v0 + v1) / 2)[0], F(uc, (v0 + v1) / 2)[1], 12, 12, '#ffd84a', 0.18);
      else { ln([F(uc - hw * 0.5, v1 - 2), F(uc - hw * 0.1, v1 - 6)], 1.2, 'rgba(255,255,255,.7)'); }
      // cień w głębi otworu: góra i lewa strona (światło z lewej góry) zasłonięte murem
      if (s.winType !== 'round') { Q(uc - hw, v1 - 3.2, uc + hw, v1, 'rgba(12,10,34,.5)', 0); Q(uc - hw, v0, uc - hw + 2.6 * pxu, v1, 'rgba(12,10,34,.34)', 0); }
      ln([F(uc, v0), F(uc, v1 + (rise ? rise : 0))], 1, OUT); ln([F(uc - hw, (v0 + v1) / 2), F(uc + hw, (v0 + v1) / 2)], 1, OUT);
      Q(uc - hw - 1.5 * pxu, v0 - 6, uc + hw + 2.5 * pxu, v0 - 2.2, 'rgba(25,12,6,.26)', 0);
      Q(uc - hw - 2.4 * pxu, v0 - 2.6, uc + hw + 2.4 * pxu, v0 - 0.2, shade(s.stone, 0.14), 1);
      if (s.flowerBox && kf < 2 && r() < 0.7) { Q(uc - hw - 1 * pxu, v0 - 6, uc + hw + 1 * pxu, v0 - 2, '#7a4a26', 1.1); for (let q = 0; q < 6; q++) { const p = F(uc - hw + (q + 0.5) * (hw * 2 / 6), v0 - 5 + 1); circ(p[0], p[1] - 3 - r() * 2, 2.1, r.pick(FLOWER), 0.9); } }
    }
    if (hasDoor) {
      const u0 = du - dw, u1 = du + dw, dh = 27;
      const stepA = F(u0 - 0.02, 0), stepB = F(u1 + 0.02, 0), nn = f.n;
      poly([stepA, stepB, [stepB[0] + nn[0] * 6, stepB[1] + nn[1] * 6], [stepA[0] + nn[0] * 6, stepA[1] + nn[1] * 6]], shade(s.stone, 0.1), 1.3);
      const wood = shade(s.timber, dark ? 0.08 : 0.16, 0.05);
      { const fr = s.doorType === 'arch' ? [F(u0 - 2.2 * pxu, 0), F(u1 + 2.2 * pxu, 0), F(u1 + 2.2 * pxu, dh - 6)] : [F(u0 - 2.2 * pxu, 0), F(u1 + 2.2 * pxu, 0), F(u1 + 2.2 * pxu, dh + 3)]; if (s.doorType === 'arch') { for (let a = 0.2; a < Math.PI; a += 0.4) fr.push(F(du + (dw + 2.2 * pxu) * Math.cos(a), dh - 6 + 9 * Math.sin(a))); fr.push(F(u0 - 2.2 * pxu, dh - 6)); } else fr.push(F(u0 - 2.2 * pxu, dh + 3)); poly(fr, shade(s.stone, dark ? -0.08 : 0.12), 1.4); }
      let pts;
      if (s.doorType === 'arch') { pts = [F(u0, 0), F(u1, 0), F(u1, dh - 6)]; for (let a = 0.2; a < Math.PI; a += 0.4) pts.push(F(du + dw * Math.cos(a), dh - 6 + 7 * Math.sin(a))); pts.push(F(u0, dh - 6)); }
      else pts = [F(u0, 0), F(u1, 0), F(u1, dh), F(u0, dh)];
      poly(pts, lg(0, F(du, dh)[1], 0, F(du, 0)[1], shade(wood, 0.04), shade(wood, -0.1)), 2);
      Q(u0, 0, u0 + 2.8 * pxu, dh - 6, 'rgba(10,6,4,.42)', 0); Q(u0, dh - 8, u1, dh - 6 + (s.doorType === 'arch' ? 0 : 6), 'rgba(10,6,4,.3)', 0);
      if (s.doorType === 'double') ln([F(du, 0), F(du, dh)], 1.3, OUT);
      for (let q = 1; q < 5; q++) ln([F(u0 + (u1 - u0) * q / 5, 0), F(u0 + (u1 - u0) * q / 5, dh - 4)], 0.7, 'rgba(40,20,8,.4)');
      ln([F(u0, 8), F(u1, 8)], 1.4, '#3a3a42'); ln([F(u0, 19), F(u1, 19)], 1.4, '#3a3a42');
      circ(...F(du + dw * 0.55, 13), 1.2, '#e8c24a', 0.8);
      if (s.lamp) { const lp = F(u1 + 0.07, 24), Lp = plane(id, lp[0], lp[1]); ln([Lp(-5, 2), Lp(0, 2)], 1.4, OUT); blob(lp[0], lp[1], 11, 11, '#ffd84a', 0.24); poly([Lp(-2.5, -4), Lp(2.5, -4), Lp(2.5, 3), Lp(-2.5, 3)], '#ffe27a', 1.2); }
    }
    return { F, Q, pxu };
  }
  openings('L'); openings('R');

  // pas wysunięcia piętra (jetty)
  if (s.jetty && s.floors >= 2) for (const id of ['L', 'R']) { const f = faces[id], { F } = fo(id), v = s.fh; const nn = f.n, A = F(0, v + 3), B = F(1, v + 3); poly([A, B, [B[0] + nn[0] * 4, B[1] + nn[1] * 4 + 0], [A[0] + nn[0] * 4, A[1] + nn[1] * 4]], shade(s.timber, 0.04), 1.3); poly([[A[0] + nn[0] * 4, A[1] + nn[1] * 4], [B[0] + nn[0] * 4, B[1] + nn[1] * 4], [B[0] + nn[0] * 4, B[1] + nn[1] * 4 + 4], [A[0] + nn[0] * 4, A[1] + nn[1] * 4 + 4]], shade(s.timber, -0.08), 1.1); }
  ln([Wp, up(Wp, h)], 2, OUT); ln([S, up(S, h)], 2, OUT); ln([E, up(E, h)], 2, OUT);
  // kępy liści i kwiatów przy podstawie murów: budynek wyrasta z ziemi (nie przy drzwiach)
  { const rr = rng(s.seed * 313 + 7), spots = [[Wp, S, 0.12], [Wp, S, 0.82], [S, E, 0.18], [S, E, 0.9], [Wp, S, 0.5]]; for (const [a, b, t] of spots) { if (rr() < 0.3) continue; const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 4]; if (Math.abs(t - (b === E ? 1 - s.doorU : s.doorU)) < 0.16 && ((b === E) === (s.doorFace === 'R'))) continue; leafClump(g, p[0], p[1], 0.7 + rr() * 0.5, rr, rr() < 0.7); } }
  // narożniki z kamienia
  if (!isStone) for (const p of [Wp, S, E]) for (let v = 0; v < h; v += 9) poly([[p[0] - 2.4, p[1] - v], [p[0] + 2.4, p[1] - v], [p[0] + 2.4, p[1] - v - 7], [p[0] - 2.4, p[1] - v - 7]], v % 18 ? shade(s.stone, 0.06) : shade(s.stone, -0.04), 0.9);

  // balkon
  if (s.balcony && s.floors >= 2) {
    const f = doorFace, { F } = fo(s.doorFace), bu = s.doorU, v = s.fh, sp = 0.25, nn = f.n, dist = 15;
    const A = F(bu - sp, v), B = F(bu + sp, v), A2 = [A[0] + nn[0] * dist, A[1] + nn[1] * dist], B2 = [B[0] + nn[0] * dist, B[1] + nn[1] * dist];
    const dh = 24;
    const { Q } = fo(s.doorFace);
    Q(bu - 0.08, v + 1, bu + 0.08, v + dh, 'rgba(0,0,0,0)', 0);
    poly([F(bu - 0.075, v + 1), F(bu + 0.075, v + 1), F(bu + 0.075, v + dh), F(bu - 0.075, v + dh)], '#a8d8ee', 1.8);
    ln([F(bu, v + 1), F(bu, v + dh)], 1, OUT);
    const wood = shade(s.timber, 0.14);
    poly([A, B, B2, A2], wood, 1.6); poly([A2, B2, [B2[0], B2[1] + 3.5], [A2[0], A2[1] + 3.5]], shade(s.timber, -0.04), 1.3);
    for (const [P0, P1] of [[A, A2], [B, B2]]) ln([[P0[0], P0[1] + 3], [P1[0], P1[1] + 8]], 1.8, OUT);
    ln([A2, up(A2, 11)], 1.8, OUT); ln([B2, up(B2, 11)], 1.8, OUT);
    for (let q = 1; q < 7; q++) { const t = q / 7, p = lerp(A2, B2, t); ln([p, up(p, 10)], 1.1, shade(s.timber, 0.1)); }
    ln([up(A2, 11), up(B2, 11)], 2.4, OUT); ln([up(A2, 11), up(B2, 11)], 1.2, wood);
    ln([up(A, 11), up(A2, 11)], 2.4, OUT); ln([up(A, 11), up(A2, 11)], 1.2, wood);
    ln([up(B, 11), up(B2, 11)], 2.4, OUT); ln([up(B, 11), up(B2, 11)], 1.2, wood);
    if (r() < 0.6) for (let q = 0; q < 4; q++) { const p = lerp(A2, B2, (q + 0.5) / 4); circ(p[0], p[1] - 13, 2.4, r.pick(FLOWER), 0.9); }
  }
  // markiza
  if (s.awning) {
    const f = doorFace, { F } = fo(s.doorFace), nn = f.n, c = s.awning, du = s.doorU;
    const ua = Math.max(0.02, du - 0.3), ub = Math.min(0.98, du + 0.3), v1 = 34, ns = 6;
    for (let i = 0; i < ns; i++) {
      const t0 = ua + (ub - ua) * i / ns, t1 = ua + (ub - ua) * (i + 1) / ns, T0 = F(t0, v1), T1 = F(t1, v1);
      poly([T0, T1, [T1[0] + nn[0] * 15, T1[1] + nn[1] * 15 + 7], [T0[0] + nn[0] * 15, T0[1] + nn[1] * 15 + 7]], i % 2 ? c[1] : c[0], 1.2);
      const b0 = [T0[0] + nn[0] * 15, T0[1] + nn[1] * 15 + 7], b1 = [T1[0] + nn[0] * 15, T1[1] + nn[1] * 15 + 7];
      poly([b0, b1, [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2 + 4]], i % 2 ? c[1] : c[0], 1);
    }
  }
  // szyld wiszący: wysięgnik idzie od prawej ściany wzdłuż osi x, szyld wisi w płaszczyźnie wysięgnika (nie wprost na ekran)
  if (s.sign) {
    const A = P3(0, -0.12 * s.d, s.fh * 1.08), Lp = plane('L', A[0], A[1]);
    ln([Lp(0, 0), Lp(24, 0)], 3.4, OUT); ln([Lp(0, 0), Lp(24, 0)], 1.8, '#4a4a52'); ln([Lp(0, -7), Lp(10, 0)], 1.6, '#4a4a52');
    ln([Lp(8, 0), Lp(8, -5)], 1, OUT); ln([Lp(21, 0), Lp(21, -5)], 1, OUT);
    poly([Lp(5, -5), Lp(24, -5), Lp(24, -21), Lp(5, -21)], '#c8924a', 1.7);
    const c = Lp(14.5, -13);
    if (s.kind === 'tavern') { poly([Lp(11, -9), Lp(17, -9), Lp(17, -17), Lp(11, -17)], '#fff3d8', 1.2); ln([Lp(11, -10), Lp(17, -10)], 2, '#f0c83a'); }
    else poly(planeEllipse(Lp, 14.5, -13, 4.4, 4.4), '#f0c83a', 1.3);
  }
  // pnącza
  if (s.vines) { const f = faces[r.pick(['L', 'R'])]; const id = f.dark ? 'L' : 'R'; const { F } = fo(id); const u0 = r.range(0.05, 0.95), vm = r.range(0.4, 0.95) * h; for (let v = 0; v < vm; v += 3.2) { const u = u0 + Math.sin(v * 0.13) * 0.025 + (r() - 0.5) * 0.02; const p = F(u, v); circ(p[0], p[1], 2 + r() * 2.2, r.pick(['#3f8a34', '#56a03e', '#2f7a2c']), 0); if (r() < 0.12) circ(p[0] + 2, p[1], 1.4, '#f07aa8', 0); } }

  // ---- dach (geometria z buildingGeometry, wszystko w siatce, więc dach leży nad murami) ----
  const G = buildingGeometry(s), eP = (k) => P3(...G.eave[k]);
  const eW = eP('W'), eS = eP('S'), eE = eP('E'), eN = eP('N');
  const rc = s.roofCol, litRoof = shade(rc, 0.05), darkRoof = shade(rc, -0.09);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function roofPlane(A, B, Cc, D, fill) {
    poly([A, B, Cc, D], fill, 2);
    const rows = Math.max(4, Math.round(Math.max(dist(A, D), dist(B, Cc)) / 7));
    if (s.thatch) {
      const rowsT = Math.max(4, Math.round(Math.max(dist(A, D), dist(B, Cc)) / 8));
      for (let i = 1; i <= rowsT; i++) {
        const t = i / rowsT, p0 = lerp(A, D, Math.min(1, t)), p1 = lerp(B, Cc, Math.min(1, t)), n = Math.max(3, Math.round(dist(p0, p1) / 7));
        for (let j = 0; j < n; j++) { const c = lerp(p0, p1, (j + 0.5) / n), rx = dist(p0, p1) / n / 2 + 0.6; g.beginPath(); g.ellipse(c[0], c[1] + 1, rx, 3.2, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 0, Math.PI); g.fillStyle = (i + j) % 2 ? shade(rc, 0.03) : shade(rc, -0.03); g.fill(); g.lineWidth = 0.9; g.strokeStyle = 'rgba(80,50,10,.55)'; g.stroke(); }
      }
      for (let i = 0; i < 40; i++) { const u = r(), t0 = r() * 0.8, t1 = t0 + 0.06 + r() * 0.08; ln([lerp(lerp(A, D, t0), lerp(B, Cc, t0), u), lerp(lerp(A, D, Math.min(1, t1)), lerp(B, Cc, Math.min(1, t1)), u)], 0.8, r() < 0.5 ? 'rgba(90,60,10,.25)' : 'rgba(255,240,170,.3)'); }
      return;
    }
    for (let i = 1; i < rows; i++) {
      const t = i / rows, p0 = lerp(A, D, t), p1 = lerp(B, Cc, t);
      ln([p0, p1], 1, 'rgba(60,22,8,.5)'); ln([[p0[0], p0[1] + 1.6], [p1[0], p1[1] + 1.6]], 1, 'rgba(255,220,170,.26)');
      const tn = Math.max(2, Math.round(dist(p0, p1) / 9)), q0 = lerp(A, D, Math.min(1, t + 0.5 / rows)), q1 = lerp(B, Cc, Math.min(1, t + 0.5 / rows));
      for (let j = 0; j < tn; j++) { const u = (j + (i % 2 ? 0.5 : 0)) / tn; if (u > 1) continue; ln([lerp(p0, p1, u), lerp(q0, q1, u)], 0.8, 'rgba(60,22,8,.32)'); }
      // zaokrąglone końce dachówek i niejednakowe odcienie: dach jest malowany, a nie narysowany linijką
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      for (let j = 0; j < tn; j++) { const u = (j + (i % 2 ? 1 : 0.5)) / tn, c = lerp(p0, p1, Math.min(1, u)), tone = (r() - 0.5) * 0.12; g.beginPath(); g.ellipse(c[0], c[1] - 0.5, dist(p0, p1) / tn / 2 + 0.3, 2.6, ang, 0, Math.PI); g.fillStyle = shade(rc, tone + (i % 2 ? 0.03 : -0.01)); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; g.lineWidth = 0.8; g.strokeStyle = 'rgba(60,22,8,.4)'; g.stroke(); }
    }
  }
  function thatchFringe(a, b) { if (!s.thatch) return; const n = Math.round(dist(a, b) / 4); const pts = [a]; for (let i = 1; i < n; i++) { const p = lerp(a, b, i / n); pts.push([p[0], p[1] + 2 + r() * 3.5]); } pts.push(b); ln(pts, 2.2, OUT); ln(pts, 1, mix(rc, '#ffffff', 0.2)); }
  // grubość dachu: bez niej połać wygląda jak płaska kartka bez tyłu
  const slab = (a, b) => poly([a, b, [b[0], b[1] + 4], [a[0], a[1] + 4]], shade(rc, -0.3), 1.4);
  const board = (a, b) => { poly([a, b, [b[0], b[1] + 6.5], [a[0], a[1] + 6.5]], shade(rc, -0.22), 1.6); ln([a, b], 2.4, OUT); ln([[a[0], a[1] + 1.4], [b[0], b[1] + 1.4]], 1, 'rgba(255,220,170,.3)'); };
  const ridge = (a, b) => { ln([a, b], 5.2, OUT); ln([a, b], 3.2, shade(rc, 0.1)); ln([[a[0], a[1] - 0.8], [b[0], b[1] - 0.8]], 1, 'rgba(255,240,200,.5)'); };
  // ściana szczytowa: pięciokąt od podstawy muru do kalenicy, z szkieletem i okrągłym okienkiem rysowanym w płaszczyźnie ściany
  function gableWall(ro) {
    const dark = ro.gableFace === 'L', fid = ro.gableFace;
    const base = dark ? [P3(-s.w, 0, h), P3(0, 0, h), P3(0, 0, ro.baseZ), P3(-s.w, 0, ro.baseZ)] : [P3(0, 0, h), P3(0, -s.d, h), P3(0, -s.d, ro.baseZ), P3(0, 0, ro.baseZ)];
    const ap = P3(...ro.gableApex);
    const poly5 = dark ? [base[0], base[1], base[2], ap, base[3]] : [base[0], base[1], base[2], ap, base[3]];
    poly(poly5, lg(0, ap[1], 0, base[0][1], dark ? shade(baseWall, -0.11) : shade(baseWall, 0.02), dark ? shade(baseWall, -0.18) : shade(baseWall, -0.04)), 1.8);
    const a0 = dark ? P3(-s.w, 0, h) : P3(0, 0, h), a1 = dark ? P3(0, 0, h) : P3(0, -s.d, h), bm = mid(a0, a1);
    if (s.material === 'timber' || s.material === 'plaster') { ln([bm, ap], 3, s.timber); ln([lerp(a0, ap, 0.5), lerp(bm, ap, 0.18)], 2, s.timber); ln([lerp(a1, ap, 0.5), lerp(bm, ap, 0.18)], 2, s.timber); }
    if (s.material === 'stone') for (let q = 1; q < 4; q++) ln([lerp(a0, a1, 0.12), lerp(a0, a1, 0.88)].map((p) => [p[0], p[1] - q * 6]), 0.7, 'rgba(58,36,20,.3)');
    const wc = lerp(bm, ap, 0.42), Lp = plane(fid, wc[0], wc[1]);
    poly(planeEllipse(Lp, 0, 0, 5, 5), dark ? '#6fa0b8' : '#a8d8ee', 1.5); ln([Lp(-5, 0), Lp(5, 0)], 0.9, OUT); ln([Lp(0, -5), Lp(0, 5)], 0.9, OUT);
  }
  let apex = null, ridgeA = null, ridgeB = null, planeMid = null, planeKind = 'L';
  const ro = G.roof;
  if (ro.type === 'hip') {
    apex = P3(...ro.apex);
    roofPlane(eW, eS, apex, apex, lg(eW[0], 0, apex[0], 0, shade(rc, -0.14), darkRoof));
    roofPlane(eS, eE, apex, apex, lg(apex[0], 0, eE[0], 0, litRoof, shade(rc, 0.12)));
    slab(eW, eS); slab(eS, eE); ln([eW, eS, eE], 2.6, OUT); ln([eW, apex, eE], 2, OUT); ridge(eS, apex);
    if (s.thatch) { thatchFringe(eW, eS); thatchFringe(eS, eE); }
    planeMid = lerp(mid(eS, eE), apex, 0.4); planeKind = 'R';
  } else if (ro.type === 'gx') {
    const R1 = P3(...ro.R1), R2 = P3(...ro.R2); ridgeA = R1; ridgeB = R2;
    gableWall(ro);
    roofPlane(eW, eS, R2, R1, lg(eW[0], 0, R2[0], 0, shade(rc, -0.14), darkRoof));
    slab(eW, eS); board(eS, R2); board(R2, eE); ln([eW, eS], 2.6, OUT); ridge(R1, R2);
    if (s.thatch) thatchFringe(eW, eS);
    planeMid = lerp(mid(eW, eS), mid(R1, R2), 0.45); planeKind = 'L';
  } else {
    const R1 = P3(...ro.R1), R2 = P3(...ro.R2); ridgeA = R1; ridgeB = R2;
    gableWall(ro);
    roofPlane(eS, eE, R2, R1, lg(R1[0], 0, eE[0], 0, litRoof, shade(rc, 0.12)));
    slab(eS, eE); board(eW, R1); board(R1, eS); ln([eS, eE], 2.6, OUT); ridge(R1, R2);
    if (s.thatch) thatchFringe(eS, eE);
    planeMid = lerp(mid(eS, eE), mid(R1, R2), 0.45); planeKind = 'R';
  }
  // lukarna: bryła w płaszczyźnie połaci (front w płaszczyźnie ściany, bok cofnięty w głąb), nie płaski prostokąt
  if (s.dormer && ridgeA) {
    const Lp = plane(planeKind, planeMid[0], planeMid[1]), rec = RECEDE[planeKind], dep = 11, side = planeKind === 'L' ? 1 : -1;
    const hw = 8, wh = 12, ph = 8;
    const sh = (p) => [p[0] + rec[0] * dep, p[1] + rec[1] * dep];
    // bok widoczny (od strony, z której patrzymy), potem front, potem dach
    const bx = side * hw;
    poly([Lp(bx, 0), Lp(bx, wh), sh(Lp(bx, wh)), sh(Lp(bx, 0))], shade(baseWall, planeKind === 'L' ? -0.2 : -0.14), 1.6);
    poly([Lp(bx, wh), Lp(0, wh + ph), sh(Lp(0, wh + ph)), sh(Lp(bx, wh))], shade(rc, planeKind === 'L' ? 0.06 : -0.08), 1.7);
    poly([Lp(-hw, 0), Lp(hw, 0), Lp(hw, wh), Lp(0, wh + ph), Lp(-hw, wh)], baseWall, 1.7);
    poly([Lp(-hw + 3, 2), Lp(hw - 3, 2), Lp(hw - 3, wh - 3), Lp(-hw + 3, wh - 3)], '#a8d8ee', 1.4); ln([Lp(0, 2), Lp(0, wh - 3)], 0.9, OUT);
    ln([Lp(-hw - 1.5, wh - 1), Lp(0, wh + ph + 1), Lp(hw + 1.5, wh - 1)], 2.4, OUT); ln([Lp(-hw - 1.5, wh - 1), Lp(0, wh + ph + 1), Lp(hw + 1.5, wh - 1)], 1.2, shade(rc, -0.2));
  }
  // komin: stoi na kalenicy lub grani, bryła izometryczna
  if (s.chimney) {
    const base = apex ? lerp(apex, eE, 0.3) : lerp(ridgeA, ridgeB, r.range(0.25, 0.7));
    const cx = base[0], cy = base[1] + 5, stn = shade(s.stone, -0.05);
    poly([[cx - 5.5, cy + 3], [cx, cy + 6], [cx, cy - 15], [cx - 5.5, cy - 18]], shade(stn, -0.1), 1.6);
    poly([[cx, cy + 6], [cx + 5.5, cy + 3], [cx + 5.5, cy - 18], [cx, cy - 15]], shade(stn, 0.05), 1.6);
    poly([[cx - 6.5, cy - 18], [cx, cy - 21.5], [cx + 6.5, cy - 18], [cx, cy - 14.5]], shade(stn, -0.14), 1.6);
    poly([[cx - 3, cy - 18], [cx, cy - 19.5], [cx + 3, cy - 18], [cx, cy - 16.5]], '#2a1a12', 0);
    s._chim = [cx, cy - 22];   // punkt wylotu komina (do animowanego dymu w świecie)
    if (s.smoke && !s.noSmoke) for (let i = 0; i < 4; i++) blob(cx + 3 + i * 4, cy - 26 - i * 10, 5 + i * 2, 4 + i * 1.5, '#ffffff', 0.5 - i * 0.1);
  }
  // flaga: płat materiału w płaszczyźnie, w której wieje wiatr
  if (s.flag && apex) { const Lp = plane('L', apex[0], apex[1] - 22); ln([[apex[0], apex[1]], [apex[0], apex[1] - 22]], 2, OUT); ln([[apex[0], apex[1]], [apex[0], apex[1] - 22]], 1, '#6a4a2a'); poly([Lp(0, 0), Lp(15, 3), Lp(10, -1), Lp(16, -5), Lp(0, -8)], r.pick(['#c8382a', '#2a6aa8', '#d89a1a']), 1.3); }

  // kępki trawy przy podstawie murów: wiążą budynek z ziemią
  for (const id of ['L', 'R']) { const f = faces[id], { F } = fo(id), n = Math.round(f.len * 5); for (let q = 0; q < n; q++) { const u = (q + r()) / n; if (s.doorFace === id && Math.abs(u - s.doorU) < 0.16) continue; const p = F(u, 0), gx = p[0] + f.n[0] * (1 + r() * 3), gy = p[1] + f.n[1] * (1 + r() * 3) + 1; const c = r() < 0.5 ? '#4f9a2c' : '#78c040'; for (const dx of [-2.4, 0, 2.4]) ln([[gx + dx, gy], [gx + dx * 1.5 + (r() - 0.5) * 2, gy - 4 - r() * 4]], 1.3, c); } }

  // rekwizyty z przodu
  const items = s.props.map((p) => { const f = faces[p.face], { F } = fo(p.face); const q = F(p.u, 0); return { y: q[1] + f.n[1] * p.off, x: q[0] + f.n[0] * p.off, p }; }).sort((a, b) => a.y - b.y);
  for (const it of items) PROPS[it.p.type](g, it.x, it.y, it.p.sc, it.p.seed);
}
