// Model Grabarza z brył 3D (fig3d.js): szeroki kapelusz, jeden wielki naramiennik, łopata-topór, latarnia u pasa, długi płaszcz, ciężki krok.
// Jednostki to centymetry, stopy w y = 0, twarzą do +z. Wygląd (skóra, włosy, broda, kolory, kształt głowy) pochodzi z heroSpec, więc kreator działa.
import { v3, ell, box, cyl, rod, bone, vnoise, renderRGBA } from './fig3d.js';

const hex = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k], mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const HEADS = { round: [9.2, 11, 10], long: [8.6, 12.2, 9.8], heart: [9.6, 10.8, 9.8], square: [9.8, 10.6, 10.2], oval: [8.9, 11.6, 9.9] };

export function grabarzParts(sp, pose = {}) {
  const f = !!sp.female, skin = hex(sp.skin || '#f0c49a'), hair = hex(sp.hair || '#4a2c18'), coat = hex((sp.outfit && sp.outfit.base) || '#6b5a3a'), trim = hex((sp.outfit && sp.outfit.trim) || '#c8a050');
  const lant = sp.beltLantern ? (Array.isArray(sp.beltLantern) ? sp.beltLantern : [sp.beltLantern.r, sp.beltLantern.g, sp.beltLantern.b]) : [232, 160, 64];
  const W = (f ? 0.92 : 1) * 1.2, HS = HEADS[(sp.face && sp.face.shape) || 'round'] || HEADS.round, hk = (f ? 0.95 : 1) * 1.28;
  // materiały: faktura z gładkiego szumu i delikatnych fałd, nie z kwadratów
  const cloth = (col, s = 0.22) => ({ col, spec: 0.03, shine: 8, tex: (lp) => 0.86 + 0.26 * vnoise(lp, s) + 0.06 * Math.sin(Math.atan2(lp[0], lp[2]) * 11) });
  const leather = (col) => ({ col, spec: 0.3, shine: 20, tex: (lp) => 0.84 + 0.3 * vnoise(lp, 0.5) });
  const metal = (col, sp2 = 0.55) => ({ col, spec: sp2, shine: 30, tex: (lp) => 0.86 + 0.22 * vnoise(lp, 0.35) });
  const skinM = { col: skin, spec: 0.08, shine: 14, tex: (lp) => 0.94 + 0.1 * vnoise(lp, 0.6) };
  const coatM = cloth(coat), coatDark = cloth(mulc(coat, 0.72)), trimM = cloth(trim), pantM = cloth(mulc(coat, 0.45)), bootM = leather([50, 36, 26]), gloveM = leather([62, 44, 30]);
  const skirtM = { ...coatM, tex: (lp) => { let m = 0.86 + 0.26 * vnoise(lp, 0.2) + 0.07 * Math.sin(Math.atan2(lp[0], lp[2]) * 9); if (lp[2] > 0 && Math.abs(lp[0]) < 1.2) m *= 0.3; if (lp[1] < -24) m *= 0.62 + 0.25 * vnoise(lp, 0.9); return m; } };
  // pozy: faza chodu 0..1 (undefined = postój z oddechem)
  const walking = pose.t !== undefined, ph = walking ? pose.t * Math.PI * 2 : 0, breathe = walking ? 0 : Math.sin((pose.time || 0) * 2) * 0.35;
  const legAng = (s) => { const p = ph + (s < 0 ? Math.PI : 0); return { sw: walking ? 0.5 * Math.sin(p) : 0, bend: walking ? 0.85 * Math.max(0, Math.cos(p)) : 0 }; };
  const hipY = 92, thigh = 44, shin = 40, legs = [1, -1].map((s) => { const { sw, bend } = legAng(s), hip = [9 * W * s, hipY, 0], knee = v3.add(hip, [0, -thigh * Math.cos(sw), thigh * Math.sin(sw)]), a2 = sw - bend, ank = v3.add(knee, [0, -shin * Math.cos(a2), shin * Math.sin(a2)]); return { s, hip, knee, ank, a2 }; });
  const drop = 8 - Math.min(...legs.map((l) => l.ank[1])), bob = walking ? Math.max(0, drop) : 0;   // ciało opada tak, by niższa stopa stała na ziemi
  const up = (p) => [p[0], p[1] + bob, p[2]], by = (y) => y + bob + breathe * 0.4, P = [];
  for (const l of legs) {
    const hip = up(l.hip), knee = up(l.knee), ank = up(l.ank);
    P.push(bone(hip, knee, 8.2 * W, pantM, 'leg'), bone(knee, ank, 6.4 * W, pantM, 'leg'));
    P.push(ell([ank[0], ank[1] - 1.5, ank[2] + 5.5], [6.8 * W, 5.6, 12], bootM, undefined, 'boot'), cyl([ank[0], ank[1] + 8, ank[2] + 0.5 * Math.sin(l.a2) * 6], [7.3 * W, 8.5, 7.3 * W], bootM, undefined, 'boot'));
  }
  // płaszcz: spódnica rozszerzająca się ku dołowi, talia, pierś, nadziewka barkowa, kołnierz, wyłogi i guziki
  const lean = walking ? 0.03 * Math.sin(ph * 2) : 0;
  P.push(ell([0, by(62), 0], [22 * W, 30, 15.8], skirtM, undefined, 'coat'), ell([0, by(90), 0], [19.5 * W, 12, 13.6], skirtM, undefined, 'coat'), ell([0, by(108), 0], [16.8 * W, 10, 11.8], coatM, undefined, 'coat'));
  P.push(ell([0, by(127 + breathe), lean * 30], [21.5 * W, 17.5, 13.6], coatM, undefined, 'coat'), ell([0, by(143), 0], [24.5 * W, 6.5, 11.6], coatM, undefined, 'coat'));
  P.push(cyl([0, by(99), 0.3], [18.4 * W, 2.3, 12.8], leather([44, 30, 20]), undefined, 'belt'), box([0, by(99), 12.9], [3, 2.7, 1], metal([200, 176, 112], 0.8), undefined, 'buckle'));
  P.push(ell([0, by(151.5), -1], [11.4 * W, 5.2, 9.8], coatDark, undefined, 'collar'), cyl([0, by(154.5), 0], [5.2, 4.5, 5.2], skinM, undefined, 'neck'));
  for (const y of [122, 113, 104]) P.push(ell([0.4, by(y), 13.9], [1.3, 1.3, 1], metal([205, 180, 110], 0.8), undefined, 'button'));
  // naramiennik (lewy bark modelu, po prawej na ekranie): trzy nachodzące płyty i nity
  const tiltZ = (a) => [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
  P.push(ell([27.5 * W, by(150), 0], [15.5, 6.6, 14.6], metal([92, 98, 108], 0.5), tiltZ(-0.36), 'pauldron'), ell([29.5 * W, by(145), 0], [14.6, 4.4, 13.8], metal([74, 78, 86], 0.45), tiltZ(-0.4), 'pauldron'), ell([31.2 * W, by(140.5), 0], [13.4, 3.4, 12.6], metal([62, 66, 74], 0.4), tiltZ(-0.42), 'pauldron'));
  for (const [dx, dz] of [[-6, 6], [3, 8.4], [9, 2]]) P.push(ell([27.5 * W + dx, by(155.4), dz], [1.4, 1.1, 1.4], metal([170, 160, 130], 0.8), undefined, 'rivet'));
  // ręce: lewa (po prawej na ekranie) wymachuje, prawa trzyma łopatę
  const sh = (s) => [s * 23.5 * W, by(146), 0];
  { const s = 1, ang = walking ? 0.45 * Math.sin(ph) : 0.05, S = sh(s), el = v3.add(S, [3, -29 * Math.cos(ang), 29 * Math.sin(ang)]), ha = v3.add(el, [1.5, -26 * Math.cos(ang + 0.45), 26 * Math.sin(ang + 0.45)]);
    P.push(bone(S, el, 7.4 * W, coatM, 'arm'), bone(el, ha, 5.8 * W, coatM, 'arm'), ell(v3.add(ha, [0, -4, 1]), [5.4, 5.8, 5.4], gloveM, undefined, 'hand')); }
  { const S = sh(-1), el = [-30 * W, by(121), 3], ha = [-27 * W, by(97), 9 + (walking ? 1.5 * Math.sin(ph) : 0)];
    P.push(bone(S, el, 7.4 * W, coatM, 'arm'), bone(el, ha, 5.8 * W, coatM, 'arm'), ell(ha, [5.6, 5.8, 5.6], gloveM, undefined, 'hand'));
    // łopata-topór: trzonek, okucie, szerokie ostrze obrócone tak, by było widać z obu stron, topór po zewnętrznej stronie
    const top = [-31 * W, by(163), 5], low = [-26 * W, by(40), 12]; P.push(rod(low, top, 1.9, leather([112, 80, 46]), 'handle'), rod([low[0], low[1] + 20, low[2]], [low[0], low[1] + 27, low[2]], 2.5, metal([80, 84, 92], 0.5), 'ferrule'));
    const ry = 0.62, rot = [[Math.cos(ry), 0, -Math.sin(ry)], [0, 1, 0], [Math.sin(ry), 0, Math.cos(ry)]], bl = [-26 * W, by(21), 12.5];
    P.push(ell(bl, [11.5, 18, 2.4], metal([128, 134, 142], 0.55), rot, 'blade'), ell([bl[0], bl[1] + 17, bl[2]], [4.2, 5, 3.4], metal([90, 94, 102], 0.5), rot, 'socket'), box([bl[0] - 12 * Math.cos(ry), bl[1] + 6, bl[2] + 12 * Math.sin(ry)], [2.4, 11, 1.8], metal([176, 182, 190], 0.7), rot, 'axe')); }
  // latarnia u pasa
  { const c = [18 * W, by(88), 11]; P.push(rod([c[0], by(99), 10], [c[0], c[1] + 6, c[2]], 0.5, metal([60, 56, 52], 0.5), 'chain'), box(c, [3.6, 4.8, 3.6], metal([54, 50, 46], 0.5), undefined, 'lantern'), ell(c, [2.9, 3.8, 2.9], { col: lant, emit: mulc(lant, 0.55), spec: 0 }, undefined, 'glow')); }
  // głowa: twarz powściągliwa, malowana teksturą (oczy, brwi, usta), cień od ronda kapelusza
  const hc = [0, by(164.5 + (hk > 1.2 ? 3 : 0)), 1], hr = [HS[0] * hk, HS[1] * hk, HS[2] * hk], hairD = mulc(hair, 0.85);
  const faceTex = (lp) => {
    let c = skin; const x = lp[0] / hr[0] * 9.2, y = lp[1] / hr[1] * 11, front = lp[2] > 0 ? 1 : 0;
    if (front) {
      for (const sx of [-1, 1]) { const ex = (x - sx * 3.6) / 1.5, ey = (y - 1.3) / 0.8; if (ex * ex + ey * ey < 1) c = mixc(c, [22, 14, 10], 0.9); const bx = Math.abs(x - sx * 3.8); if (bx < 2.5 && Math.abs(y - 3.4) < 0.55) c = mixc(c, hairD, 0.8); }
      if (Math.abs(x) < 2.4 && Math.abs(y + 5.2) < 0.45) c = mixc(c, [96, 44, 36], 0.8);
      c = mulc(c, 1 - 0.1 * sm(2, 4.2, Math.abs(x)));
    }
    return mulc(c, (1 - 0.42 * sm(1.5, 8, y) * (front ? 1 : 0.6)) * (0.95 + 0.1 * vnoise(lp, 0.7)));   // rondo kapelusza
  };
  P.push(ell(hc, hr, { col: skin, spec: 0.1, shine: 16, tex: faceTex }, undefined, 'head'));
  for (const sx of [-1, 1]) P.push(ell([sx * (hr[0] - 0.3), hc[1] - 0.5, hc[2] - 0.6], [1.5, 3, 2.2], skinM, undefined, 'ear'));
  P.push(ell([0, hc[1] + 0.5, hc[2] - 3.2], [hr[0] * 1.03, hr[1] * 0.88, hr[2] * 0.78], { col: hair, spec: 0.12, shine: 18, tex: (lp) => 0.84 + 0.3 * vnoise(lp, 0.8) }, undefined, 'hair'));
  if (f || sp.hairStyle === 'long') P.push(ell([0, hc[1] - 11, hc[2] - 6.5], [hr[0] * 0.95, 14, 4.8], { col: hair, spec: 0.1, shine: 18, tex: (lp) => 0.84 + 0.3 * vnoise(lp, 0.7) }, undefined, 'hair'));
  if (!f && sp.beard) { const full = sp.beard === 'full'; P.push(ell([0, hc[1] - hr[1] * 0.62, hc[2] + hr[2] * 0.3], [hr[0] * (full ? 0.82 : 0.66), full ? 6 : 3, hr[2] * 0.62], { col: hair, spec: 0.08, shine: 14, tex: (lp) => 0.84 + 0.3 * vnoise(lp, 0.8) }, undefined, 'beard')); }
  P.push(ell([0, hc[1] - 1.5, hc[2] + hr[2] - 0.6], [1.7, 2.7, 2.6], skinM, undefined, 'nose'));
  // kapelusz
  const hy = by(174.2 + (hk > 1.2 ? 4.4 : 0)), hatM = leather(mulc(coat, 0.6));
  P.push(ell([0, hy, 0.5], [19 * W, 2.1, 19 * W], hatM, undefined, 'brim'), cyl([0, hy + 5.4, 0.5], [8.9, 5.8, 9.1], hatM, undefined, 'crown'), ell([0, hy + 10.6, 0.5], [8.7, 3, 8.9], hatM, undefined, 'crown'),
    cyl([0, hy + 2.8, 0.5], [9.15, 1.4, 9.35], leather(trim), undefined, 'band'), box([0, hy + 2.8, 9.9], [2, 1.7, 0.6], metal([205, 184, 110], 0.8), undefined, 'buckle'));
  return P;
}

// kierunki ekranu -> obrót modelu (stopnie): twarzą do widza i w prawo (SE), w lewo (SW), tyłem w prawo (NE), tyłem w lewo (NW)
export const YAW = { SE: -42, SW: 42, NE: -138, NW: 138, S: 0, N: 180, E: -90, W: 90 };
export function renderGrabarz(sp, { dir = 'SE', t, time = 0, w = 220, h = 260, ppu = 1, elev = 30 } = {}) {
  return renderRGBA(grabarzParts(sp, { t, time }), { w, h, ppu, feet: [w / 2, h - 24 * ppu], yaw: YAW[dir] ?? 0, elev, gain: 1.5, rim: 0.34, outlineW: 2 });
}
