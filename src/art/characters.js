// Generator postaci. genCharacter(ziarno, rola) losuje wygląd, drawCharacter rysuje go w jednym z 4 kierunków i w kroku chodu.
// Kierunki: SE i NE rysowane wprost, SW i NW to lustro. SE/SW to widok z przodu, NE/NW z tyłu.
import { rng } from './rng.js';
import { kit, OUT } from './kit.js';
import { hsl, shade, mix } from './color.js';

const SKIN = ['#f8d9ba', '#f0c49a', '#dba878', '#b87c52', '#8a5a38', '#5e3c26'];
const HAIR = ['#2a1a14', '#4a2c18', '#6a4020', '#8a5a2a', '#c8a050', '#e8c86a', '#a8381e', '#1a1a22', '#5a3a2a'];
const GREY = ['#9a9a9a', '#d8d8d8', '#e8e8e8'];
const EYES = ['#3a2a1a', '#4a7a2a', '#2a5a9a', '#6a4a2a', '#5a5a5a'];
const EARTH = [[20, 50], [30, 60], [90, 140], [200, 225], [0, 14], [270, 300], [40, 52]];
export const ROLES = ['villager', 'merchant', 'mage', 'warrior', 'ranger', 'child', 'elder'];

export function genCharacter(seed, role) {
  const r = rng(seed * 104729 + 17);
  role = role || r.pick(ROLES);
  const female = role === 'child' ? r.chance(0.5) : r.chance(0.5);
  const col = (l = [0.36, 0.5], s = [0.35, 0.65], sets = EARTH) => { const [a, b] = r.pick(sets); return hsl(r.range(a, b), r.range(...s), r.range(...l)); };
  const sp = { seed, role, female, skin: r.pick(SKIN), eye: r.pick(EYES), hair: r.pick(HAIR), build: r.pick(['slim', 'avg', 'avg', 'stocky']), sc: r.range(0.94, 1.08), headS: 1, brow: r.range(-1, 1) };
  sp.hairStyle = female ? r.pick(['long', 'long', 'ponytail', 'bun', 'braids', 'short']) : r.pick(['short', 'short', 'curly', 'ponytail', 'bald', 'long']);
  sp.outfit = { kind: female && r.chance(0.55) ? 'dress' : 'tunic', base: col(), trim: col([0.5, 0.7], [0.5, 0.8]), pants: shade(col([0.3, 0.4], [0.2, 0.4]), 0), boots: r.pick(['#5a3a22', '#3a2a1a', '#6a4a2a', '#2a2a30']), apron: false, belt: true, beltCol: '#4a2c14' };
  sp.cloak = null; sp.scarf = null; sp.hat = null; sp.beard = null; sp.held = 'none'; sp.pack = null;
  switch (role) {
    case 'villager':
      sp.hat = r.pick([null, null, { kind: 'straw' }, { kind: 'cap' }, { kind: 'band' }]); sp.outfit.apron = r.chance(0.4); sp.held = r.pick(['none', 'none', 'bag', 'lantern', 'staff']);
      if (!female && r.chance(0.3)) sp.beard = r.pick(['stubble', 'full']); if (r.chance(0.3)) sp.scarf = col([0.45, 0.6], [0.5, 0.8]); break;
    case 'merchant':
      sp.build = r.pick(['avg', 'stocky']); sp.outfit.base = col([0.32, 0.42], [0.45, 0.7], [[270, 300], [350, 10], [30, 45], [200, 220]]); sp.outfit.trim = '#e0b43a'; sp.outfit.beltCol = '#2a1a10';
      sp.hat = r.pick([{ kind: 'beret' }, { kind: 'beret' }, { kind: 'straw' }]); sp.pack = 'pack'; sp.held = r.pick(['bag', 'lantern']); sp.scarf = col([0.45, 0.6], [0.5, 0.8]);
      if (!female && r.chance(0.55)) sp.beard = r.pick(['mustache', 'full']); break;
    case 'mage':
      sp.outfit.kind = 'robe'; sp.outfit.base = col([0.3, 0.44], [0.45, 0.7], [[220, 280], [330, 350], [160, 180]]); sp.outfit.trim = '#e8c24a'; sp.hat = r.pick([{ kind: 'wizard' }, { kind: 'wizard' }, { kind: 'hood' }]);
      sp.held = 'staff'; if (r.chance(0.4)) sp.cloak = shade(sp.outfit.base, -0.08); if (!female && r.chance(0.5)) sp.beard = 'full'; if (r.chance(0.3)) sp.hair = r.pick(GREY); break;
    case 'warrior':
      sp.outfit.kind = 'armor'; sp.build = r.pick(['stocky', 'avg']); sp.outfit.base = col([0.35, 0.45], [0.45, 0.7], [[0, 14], [200, 225], [90, 130]]); sp.outfit.metal = r.pick(['#b4bac4', '#9aa0aa', '#c4a860']);
      sp.hat = r.chance(0.8) ? { kind: 'helmet', plume: r.chance(0.5) ? col([0.4, 0.5], [0.6, 0.8], [[0, 12], [210, 225]]) : null } : null; sp.held = r.pick(['sword', 'sword', 'hammer']); sp.shield = r.chance(0.7);
      if (r.chance(0.5)) sp.cloak = col([0.3, 0.4], [0.5, 0.7], [[0, 12], [210, 225]]); if (!female && r.chance(0.5)) sp.beard = r.pick(['stubble', 'full']); break;
    case 'ranger':
      sp.outfit.base = col([0.3, 0.42], [0.4, 0.6], [[90, 140], [28, 40]]); sp.outfit.trim = shade(sp.outfit.base, 0.14); sp.hat = r.pick([{ kind: 'hood' }, { kind: 'hood' }, { kind: 'cap' }]);
      sp.cloak = col([0.26, 0.36], [0.35, 0.55], [[90, 140], [25, 40]]); sp.held = 'bow'; sp.pack = 'quiver'; sp.build = r.pick(['slim', 'avg']); if (!female && r.chance(0.4)) sp.beard = 'stubble'; break;
    case 'child':
      sp.sc = r.range(0.74, 0.82); sp.headS = 1.22; sp.build = 'slim'; sp.hairStyle = r.pick(['short', 'short', 'ponytail', 'braids', 'curly']); sp.hat = r.pick([null, null, { kind: 'cap' }]);
      sp.held = r.pick(['none', 'none', 'lantern']); sp.outfit.apron = false; break;
    case 'elder':
      sp.hair = r.pick(GREY); sp.build = r.pick(['slim', 'avg']); sp.sc = r.range(0.9, 0.98); sp.held = r.pick(['staff', 'staff', 'none']); sp.hairStyle = r.pick(['short', 'bald', 'bun']);
      sp.outfit.kind = r.chance(0.5) ? 'robe' : 'tunic'; sp.outfit.base = col([0.32, 0.45], [0.2, 0.4]); if (!female && r.chance(0.7)) sp.beard = 'full'; sp.hat = r.pick([null, { kind: 'cap' }, { kind: 'straw' }]); if (r.chance(0.5)) sp.cloak = shade(sp.outfit.base, -0.06); break;
  }
  if (role !== 'warrior' && role !== 'mage' && female && r.chance(0.5)) sp.outfit.kind = 'dress';
  if (sp.outfit.kind === 'dress') sp.outfit.hem = col([0.5, 0.7], [0.4, 0.7]);
  return sp;
}

export function drawCharacter(g, x, y, sp, o = {}) {
  const k = kit(g), { poly, ln, circ, ell, blob, lg } = k;
  const back = o.view === 'back', walking = o.t != null;
  const th = walking ? o.t * Math.PI * 2 : 0;
  const bob = walking ? -Math.abs(Math.cos(th)) * 1.5 : 0;
  const [hw, shw] = { slim: [6, 5.3], avg: [7, 6.3], stocky: [8.4, 7.6] }[sp.build];
  const O_ = sp.outfit, base = O_.base, bDark = shade(base, -0.1), bLite = shade(base, 0.07);
  const fshift = back ? 0 : 1.2;
  g.save(); g.translate(x, y);
  if (o.ring) { g.save(); g.scale(1, 0.5); g.beginPath(); g.arc(0, 4, 22 * sp.sc, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = o.ring; g.stroke(); g.fillStyle = o.ring.replace('rgb', 'rgba').replace(')', ',.22)'); g.fill(); g.restore(); }
  if (o.mirror) g.scale(-1, 1);
  g.scale(sp.sc, sp.sc);
  blob(2, 1, 13, 4.6, '#000', 0.28);
  // --- pozycje nóg ---
  const legSt = (ph) => ({ dx: Math.sin(ph) * 3.2 * (back ? -1 : 1), dy: Math.sin(ph) * 0.9 * (back ? -1 : 1), lift: Math.max(0, Math.cos(ph)) * 2.6 });
  const L1 = walking ? legSt(th) : { dx: 0, dy: 0, lift: 0 }, L2 = walking ? legSt(th + Math.PI) : { dx: 0, dy: 0, lift: 0 };
  const dressy = O_.kind === 'dress' || O_.kind === 'robe';
  const drawLeg = (cx, L) => {
    const fx = cx + L.dx, fy = L.dy - L.lift;
    poly([[cx - 2.8, -13], [cx + 2.8, -13], [fx + 2.8, fy - 4], [fx - 2.8, fy - 4]], O_.pants, 1.5);
    poly([[fx - 3, fy - 5], [fx + 3, fy - 5], [fx + 3.6 + (back ? 0 : 1.8), fy], [fx - 3.4, fy]], O_.boots, 1.6);
  };
  // tył: peleryna za ciałem (widok z przodu)
  if (sp.cloak && !back) poly([[-shw - 1.5, -27 + bob], [shw + 1.5, -27 + bob], [hw + 5, -4], [-hw - 5, -4]], lg(-hw, 0, hw, 0, shade(sp.cloak, -0.06), shade(sp.cloak, -0.16)), 1.8);
  if (sp.pack === 'quiver' && !back) { poly([[shw - 2, -22 + bob], [shw + 4, -26 + bob], [shw + 7, -34 + bob], [shw + 1, -30 + bob]], '#7a4a26', 1.5); for (let i = 0; i < 3; i++) ln([[shw + 3 + i, -31 + bob - i], [shw + 5 + i, -37 + bob - i]], 1.2, '#e8e0c8'); }
  if (!dressy) { drawLeg(-3, L1); drawLeg(3, L2); }
  else { drawLeg(-2.6, L1); drawLeg(2.6, L2); }
  g.save(); g.translate(0, bob);
  // --- tułów ---
  const tor = [[-hw, -12], [hw, -12], [hw + 0.6, -19], [shw, -27], [-shw, -27], [-hw - 0.6, -19]];
  const torFill = lg(-hw, 0, hw, 0, bDark, bLite);
  if (O_.kind === 'dress') {
    poly([[-hw, -14], [hw, -14], [hw + 4.5, -4], [-hw - 4.5, -4]], lg(-hw, 0, hw, 0, bDark, bLite), 1.8);
    for (let i = -1; i <= 1; i++) ln([[i * 4, -13], [i * 6.5, -5]], 0.9, 'rgba(0,0,0,.18)');
    ln([[-hw - 4.2, -5.2], [hw + 4.2, -5.2]], 2.2, O_.hem);
    poly([[-hw, -12], [hw, -12], [hw + 0.6, -19], [shw, -27], [-shw, -27], [-hw - 0.6, -19]], torFill, 1.8);
  } else if (O_.kind === 'robe') {
    poly([[-hw - 0.6, -14], [hw + 0.6, -14], [hw + 6, -2], [-hw - 6, -2]], lg(-hw, 0, hw, 0, bDark, bLite), 1.8);
    poly([[-hw, -12], [hw, -12], [hw + 0.6, -19], [shw, -27], [-shw, -27], [-hw - 0.6, -19]], torFill, 1.8);
    ln([[-hw - 5.4, -3.6], [hw + 5.4, -3.6]], 2.4, O_.trim);
    if (!back) ln([[0, -26], [0, -3]], 1.2, 'rgba(0,0,0,.22)');
  } else {
    poly(tor, torFill, 1.8);
    if (O_.kind === 'armor') {
      poly([[-hw + 0.5, -13], [hw - 0.5, -13], [hw, -19], [shw - 0.6, -26], [-shw + 0.6, -26], [-hw, -19]], lg(-hw, 0, hw, 0, shade(O_.metal, -0.1), shade(O_.metal, 0.1)), 1.5);
      poly([[-hw, -12], [hw, -12], [hw + 2.4, -7], [-hw - 2.4, -7]], bDark, 1.6);
      if (!back) { ln([[0, -26], [0, -13]], 0.9, 'rgba(0,0,0,.3)'); circ(-3, -19, 0.9, '#fff', 0); circ(3, -19, 0.9, '#fff', 0); }
    } else if (!back) {
      ln([[-shw + 1, -26], [0, -23], [shw - 1, -26]], 1.2, 'rgba(0,0,0,.25)'); ln([[0, -23], [0, -14]], 0.9, 'rgba(0,0,0,.18)');
      if (O_.apron) poly([[-hw + 1.4, -14], [hw - 1.4, -14], [hw - 0.6, -3.5], [-hw + 0.6, -3.5]], '#f4eddc', 1.4);
    }
  }
  if (O_.belt && O_.kind !== 'robe') { poly([[-hw - 0.4, -15.4], [hw + 0.4, -15.4], [hw + 0.4, -12.8], [-hw - 0.4, -12.8]], O_.beltCol, 1.3); if (!back) circ(0, -14.1, 1.5, '#e8c24a', 0.8); }
  if (O_.kind === 'robe') ln([[-hw, -15], [hw, -15]], 2.6, O_.trim);
  // plecak / kołczan na plecach
  if (back && sp.pack === 'pack') { poly([[-hw + 1, -25], [hw - 1, -25], [hw, -12], [-hw, -12]], '#8a5a2a', 1.7); poly([[-hw + 2, -26], [hw - 2, -26], [hw - 1.4, -22], [-hw + 1.4, -22]], '#a8703a', 1.4); ln([[-hw + 2, -12], [hw - 2, -12]], 1.2, '#4a2c14'); }
  if (back && sp.pack === 'quiver') { poly([[-shw - 1, -14], [shw + 2, -29], [shw + 5, -26], [-shw + 2, -11]], '#7a4a26', 1.6); for (let i = 0; i < 3; i++) ln([[shw + 2 + i, -29 + i], [shw + 4 + i, -35 + i]], 1.2, '#e8e0c8'); }
  if (sp.pack === 'pack' && !back) { ln([[-shw + 1.5, -26], [-hw + 1, -14]], 1.6, '#6a3f1c'); ln([[shw - 1.5, -26], [hw - 1, -14]], 1.6, '#6a3f1c'); }
  // peleryna z tyłu
  if (sp.cloak && back) { poly([[-shw - 1.5, -27], [shw + 1.5, -27], [hw + 5, -4], [-hw - 5, -4]], lg(-hw, 0, hw, 0, shade(sp.cloak, -0.06), shade(sp.cloak, 0.04)), 1.8); for (const i of [-1, 0, 1]) ln([[i * 4, -25], [i * 6.5, -5]], 0.9, 'rgba(0,0,0,.2)'); }
  // --- ręce ---
  const armSw = walking ? Math.sin(th) : 0;
  const sleeve = O_.kind === 'armor' ? O_.metal : base, glove = O_.kind === 'armor' ? shade(O_.metal, -0.15) : sp.skin;
  const hand = (sd) => { const a = sd * armSw * 2.4 * (back ? -1 : 1); return [sd * (hw + 3.6), -13.5 + a, sd * (shw - 0.6), -25.5]; };
  const drawArm = (sd) => { const [hx, hy, sx, sy] = hand(sd); ln([[sx, sy], [hx, hy]], 6.6, OUT); ln([[sx, sy], [hx, hy]], 4.6, sd < 0 ? bDark : sleeve); circ(hx, hy + 1.4, 2.3, glove, 1.2); if (O_.kind === 'armor') circ(sx, sy + 0.5, 3.6, shade(O_.metal, 0.06), 1.4); };
  const held = (sd) => {
    const [hx, hy] = hand(sd);
    if (sp.held === 'staff') { ln([[hx, hy + 12], [hx + 0.6, -50]], 3.4, OUT); ln([[hx, hy + 12], [hx + 0.6, -50]], 2, '#8a5a2a'); blob(hx + 0.6, -53, 8, 8, '#8ad8ff', 0.25); circ(hx + 0.6, -53, 3.8, '#a8ecff', 1.5); circ(hx - 0.6, -54.2, 1.1, '#fff', 0); }
    if (sp.held === 'sword') { ln([[hx, hy - 1], [hx + 4, -40]], 5, OUT); ln([[hx, hy - 1], [hx + 4, -40]], 3, '#dfe6ee'); ln([[hx + 0.6, hy - 4], [hx + 3.4, -37]], 0.8, '#fff'); ln([[hx - 4, hy - 2.4], [hx + 4, hy - 0.4]], 2.8, OUT); ln([[hx - 4, hy - 2.4], [hx + 4, hy - 0.4]], 1.4, '#c8a23a'); }
    if (sp.held === 'hammer') { ln([[hx, hy + 8], [hx + 1, -40]], 3.4, OUT); ln([[hx, hy + 8], [hx + 1, -40]], 2, '#8a5a2a'); poly([[hx - 6, -45], [hx + 8, -45], [hx + 8, -36], [hx - 6, -36]], '#9aa0aa', 1.6); poly([[hx - 6, -45], [hx + 8, -45], [hx + 7, -42], [hx - 5, -42]], '#c4cad4', 0); }
    if (sp.held === 'lantern') { ln([[hx, hy + 1], [hx, hy + 6]], 1.3, OUT); blob(hx, hy + 10, 9, 9, '#ffd84a', 0.2); poly([[hx - 3.5, hy + 6], [hx + 3.5, hy + 6], [hx + 3.5, hy + 14], [hx - 3.5, hy + 14]], '#ffe27a', 1.4); ln([[hx - 3.5, hy + 6], [hx + 3.5, hy + 6]], 2, '#3a3a42'); }
    if (sp.held === 'bag') { g.save(); g.translate(hx + 1, hy + 9); g.beginPath(); g.moveTo(-5, 0); g.bezierCurveTo(-8, -7, -3, -9, 0, -10); g.bezierCurveTo(3, -9, 8, -7, 5, 0); g.closePath(); g.fillStyle = '#b8884a'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); ln([[-2, -9], [2, -9]], 1.4, '#6a3f1c'); g.restore(); }
  };
  drawArm(-1); drawArm(1);
  if (sp.held === 'bow' && !back) { const [hx, hy] = hand(-1); g.beginPath(); g.moveTo(hx - 2, -42); g.quadraticCurveTo(hx - 12, -26, hx - 2, -10); g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#8a5a2a'; g.stroke(); ln([[hx - 2, -42], [hx - 2, -10]], 0.8, '#e8e0c8'); }
  if (sp.held === 'bow' && back) { ln([[-hw - 1, -40], [hw + 1, -8]], 3.2, OUT); ln([[-hw - 1, -40], [hw + 1, -8]], 1.8, '#8a5a2a'); }
  if (sp.shield) { const [hx, hy] = hand(-1); poly([[hx - 8.5, hy - 12], [hx + 3, hy - 12], [hx + 3, hy - 1], [hx - 2.7, hy + 6], [hx - 8.5, hy - 1]], lg(hx - 8, 0, hx + 3, 0, shade(base, 0.12), shade(base, -0.1)), 1.8); ln([[hx - 2.7, hy - 12], [hx - 2.7, hy + 5]], 1.3, shade(O_.metal || '#c8a23a', 0.05)); ln([[hx - 8, hy - 5], [hx + 2.5, hy - 5]], 1.3, shade(O_.metal || '#c8a23a', 0.05)); }
  held(1);
  // --- głowa ---
  const hr = 8.6 * sp.headS, hy = -35 - (sp.headS - 1) * 8, hx0 = 0;
  const hairCol = sp.hair, hairDk = shade(hairCol, -0.12), hairLt = shade(hairCol, 0.1);
  const hair = (pts, lw = 1.6) => poly(pts, lg(0, hy - hr, 0, hy + hr, hairLt, hairDk), lw);
  // włosy za głową
  const hs = sp.hairStyle, hoodUp = sp.hat && sp.hat.kind === 'hood';
  if (!hoodUp) {
    if (hs === 'long' || hs === 'braids') hair([[-hr - 1, hy - 1], [hr + 1, hy - 1], [hr + 2.5, hy + 15], [-hr - 2.5, hy + 15]]);
    if (hs === 'ponytail') { g.beginPath(); g.moveTo(-hr + 1, hy - 3); g.bezierCurveTo(-hr - 9, hy - 2, -hr - 10, hy + 10, -hr - 4, hy + 16); g.bezierCurveTo(-hr - 3, hy + 8, -hr + 1, hy + 4, -hr + 3, hy + 2); g.closePath(); g.fillStyle = hairCol; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); }
  }
  if (hoodUp) { poly([[-hr - 2.5, hy + 4], [-hr - 3, hy - 7], [-hr * 0.5, hy - hr - 4], [hr * 0.5, hy - hr - 4], [hr + 3, hy - 7], [hr + 2.5, hy + 4]], shade(sp.cloak || base, -0.05), 1.8); }
  // szyja i głowa
  poly([[-3, hy + hr - 2], [3, hy + hr - 2], [3, hy + hr + 3.5], [-3, hy + hr + 3.5]], shade(sp.skin, -0.08), 1.4);
  if (!back) {
    circ(-hr + 0.2, hy + 1.5, 2, shade(sp.skin, -0.04), 1.2); circ(hr - 0.2, hy + 1.5, 2, shade(sp.skin, -0.04), 1.2);
    g.beginPath(); g.arc(hx0, hy, hr, 0, Math.PI * 2); g.fillStyle = lg(-hr, hy, hr, hy, shade(sp.skin, 0.03), shade(sp.skin, -0.07)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
  } else {
    g.beginPath(); g.arc(hx0, hy, hr, 0, Math.PI * 2); g.fillStyle = lg(-hr, hy - hr, hr, hy + hr, shade(hairCol, 0.12), shade(hairCol, -0.1)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
    for (let i = -2; i <= 2; i++) ln([[i * 2.6, hy - hr + 1.5], [i * 3.4, hy + hr - 2]], 0.9, i % 2 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.2)');
    blob(-hr * 0.35, hy - hr * 0.45, 3.2, 1.8, '#fff', 0.22);
  }
  // broda
  if (!back && sp.beard && sp.beard !== 'mustache') { if (sp.beard === 'full') poly([[-hr + 0.4, hy + 1], [hr - 0.4, hy + 1], [hr - 1.5, hy + hr + 5], [0, hy + hr + 8], [-hr + 1.5, hy + hr + 5]], lg(0, hy, 0, hy + hr + 8, hairLt, hairDk), 1.6); else { g.globalAlpha = 0.3; g.beginPath(); g.arc(hx0, hy + 1, hr - 0.5, 0.15, Math.PI - 0.15); g.fillStyle = hairDk; g.fill(); g.globalAlpha = 1; } }
  // twarz
  if (!back) {
    const ey = hy + 0.2;
    for (const sd of [-1, 1]) {
      const ex = sd * 3.3 + fshift;
      ell(ex, ey, 1.9, 2.5, '#fff', 0.8); circ(ex + 0.2 * (fshift > 0 ? 1 : 0), ey + 0.2, 1.55, sp.eye, 0); circ(ex + 0.3, ey + 0.2, 0.8, '#16100c', 0); circ(ex + 0.9, ey - 0.7, 0.55, '#fff', 0);
      ln([[ex - 2.2, ey - 3.6 + sp.brow * 0.5 * -sd], [ex + 2.2, ey - 3.6 - sp.brow * 0.5 * -sd]], 1.2, hairDk);
    }
    ln([[fshift - 0.6, hy + 3.2], [fshift + 0.8, hy + 3.6]], 0.9, 'rgba(120,60,30,.55)');
    if (sp.role === 'child' || sp.female) { blob(-5 + fshift, hy + 3.2, 1.8, 1.1, '#ff7a6a', 0.3); blob(5 + fshift, hy + 3.2, 1.8, 1.1, '#ff7a6a', 0.3); }
    g.beginPath(); g.moveTo(fshift - 2, hy + 5.4); g.quadraticCurveTo(fshift, hy + 6.8, fshift + 2.2, hy + 5.4); g.lineWidth = 1.1; g.strokeStyle = '#6a2a1a'; g.stroke();
    if (sp.beard === 'mustache' || sp.beard === 'full') { poly([[fshift - 4, hy + 4.2], [fshift, hy + 3.4], [fshift + 4, hy + 4.2], [fshift + 2.6, hy + 5.4], [fshift - 2.6, hy + 5.4]], hairCol, 1.1); }
  }
  // włosy na głowie
  const cap = (extra = 0.9, to = Math.PI * 1.98, from = Math.PI * 1.02) => { g.beginPath(); g.arc(hx0, hy - 1.2, hr + extra, from, to); g.closePath(); g.fillStyle = lg(0, hy - hr, 0, hy, hairLt, hairDk); g.fill(); g.lineWidth = 1.7; g.strokeStyle = OUT; g.stroke(); };
  if (!hoodUp && !back) {
    if (hs === 'curly') { for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i / 8); circ(Math.cos(a) * (hr + 1.2), hy - 1 + Math.sin(a) * (hr + 1.2), 3.3, i % 2 ? hairLt : hairCol, 1.4); } cap(0.4); }
    else if (hs !== 'bald') { cap(); const fr = [[-hr + 0.6, hy - 2], [-hr * 0.4, hy - 5.5], [0, hy - 2.6], [hr * 0.45, hy - 5.8], [hr - 0.6, hy - 2], [hr - 1.4, hy - 7], [-hr + 1.4, hy - 7]]; poly(fr, hairCol, 1.3); if (hs === 'long' || hs === 'braids') { hair([[-hr - 0.4, hy - 3], [-hr + 3.4, hy - 2], [-hr + 2.6, hy + 11], [-hr - 2.4, hy + 13]], 1.5); hair([[hr + 0.4, hy - 3], [hr - 3.4, hy - 2], [hr - 2.6, hy + 11], [hr + 2.4, hy + 13]], 1.5); } if (hs === 'bun') circ(0, hy - hr - 2.4, 4.2, hairCol, 1.6); }
    else { ln([[-hr + 1, hy - 2], [-hr + 0.5, hy + 2]], 2, hairDk); ln([[hr - 1, hy - 2], [hr - 0.5, hy + 2]], 2, hairDk); }
    if (hs === 'braids') for (const sd of [-1, 1]) for (let q = 0; q < 4; q++) circ(sd * (hr - 0.5), hy + 4 + q * 3.4, 1.9, q % 2 ? hairCol : hairLt, 1.1);
  } else if (!hoodUp && back) {
    if (hs === 'curly') for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); circ(Math.cos(a) * (hr + 1.2), hy - 1 - Math.sin(a) * (hr + 0.6), 3.3, i % 2 ? hairLt : hairCol, 1.4); }
    if (hs === 'long' || hs === 'braids') hair([[-hr - 0.5, hy - 2], [hr + 0.5, hy - 2], [hr + 2.5, hy + 15], [-hr - 2.5, hy + 15]]);
    if (hs === 'ponytail') hair([[-2.4, hy + 1], [2.4, hy + 1], [3.4, hy + 15], [-3.4, hy + 15]]);
    if (hs === 'bun') circ(0, hy - hr - 2.4, 4.2, hairCol, 1.6);
    if (hs === 'braids') for (let q = 0; q < 5; q++) { circ(-2.2, hy + 4 + q * 3, 1.9, q % 2 ? hairCol : hairLt, 1.1); circ(2.2, hy + 4 + q * 3, 1.9, q % 2 ? hairCol : hairLt, 1.1); }
    if (hs !== 'bald') { g.beginPath(); g.arc(hx0, hy - 1, hr + 0.6, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.2)'; g.stroke(); }
  }
  if (hoodUp && !back) { poly([[-hr - 1.5, hy + 3], [-hr - 1.5, hy - 5], [-hr * 0.7, hy - hr - 2.5], [hr * 0.7, hy - hr - 2.5], [hr + 1.5, hy - 5], [hr + 1.5, hy + 3], [hr - 0.5, hy + 1], [hr - 1.5, hy - 5], [0, hy - 8.5], [-hr + 1.5, hy - 5], [-hr + 0.5, hy + 1]], shade(sp.cloak || base, -0.02), 1.7); }
  if (hoodUp && back) { g.beginPath(); g.arc(hx0, hy - 1, hr + 1.8, Math.PI * 0.9, Math.PI * 2.1); g.fillStyle = shade(sp.cloak || base, -0.04); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); g.beginPath(); g.arc(hx0, hy + 2, hr + 1.4, 0.05, Math.PI - 0.05); g.fill(); g.stroke(); }
  // nakrycia głowy
  const hat = sp.hat;
  if (hat && hat.kind !== 'hood') {
    const hy2 = hy - 6.8 * sp.headS;
    if (hat.kind === 'wizard') { const hc = shade(sp.outfit.base, -0.02); ell(0, hy2 + 1, hr + 5.5, 3.4, shade(hc, -0.06), 1.8); g.beginPath(); g.moveTo(-hr + 0.5, hy2); g.quadraticCurveTo(-3, hy2 - 14, 6, hy2 - 26); g.quadraticCurveTo(2, hy2 - 14, hr - 0.5, hy2); g.closePath(); g.fillStyle = lg(-hr, 0, hr, 0, shade(hc, 0.03), shade(hc, -0.12)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); ln([[-hr + 0.8, hy2 - 1.4], [hr - 0.8, hy2 - 1.4]], 2, '#e8c24a'); circ(6.5, hy2 - 27, 1.8, '#ffe27a', 1); }
    if (hat.kind === 'straw') { ell(0, hy2 + 2, hr + 6.5, 3.8, '#e2c25a', 1.8); g.beginPath(); g.ellipse(0, hy2, hr - 0.2, hr * 0.8, 0, Math.PI, 0); g.closePath(); g.fillStyle = lg(0, hy2 - 8, 0, hy2, '#f0d878', '#d8b448'); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); ln([[-hr + 0.5, hy2 - 1], [hr - 0.5, hy2 - 1]], 2, sp.outfit.trim); }
    if (hat.kind === 'cap') { g.beginPath(); g.ellipse(0, hy2 + 2, hr + 0.6, hr * 0.75, 0, Math.PI, 0); g.closePath(); g.fillStyle = lg(0, hy2 - 8, 0, hy2, shade(sp.outfit.trim, 0.06), shade(sp.outfit.trim, -0.1)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); if (!back) poly([[-2, hy2 + 3], [hr + 3, hy2 + 3.6], [hr + 2, hy2 + 5.6], [-2, hy2 + 5]], shade(sp.outfit.trim, -0.14), 1.4); }
    if (hat.kind === 'beret') { g.beginPath(); g.ellipse(1.5, hy2 + 0.5, hr + 2.5, 5.2, -0.12, 0, Math.PI * 2); g.fillStyle = lg(0, hy2 - 5, 0, hy2 + 5, shade(sp.outfit.base, 0.12), shade(sp.outfit.base, -0.1)); g.fill(); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); circ(1.5, hy2 - 5.4, 1.2, '#2a1a10', 0); }
    if (hat.kind === 'band') { ln([[-hr, hy - 5.2], [hr, hy - 5.2]], 3.6, OUT); ln([[-hr, hy - 5.2], [hr, hy - 5.2]], 2.2, sp.outfit.trim); }
    if (hat.kind === 'helmet') { const m = sp.outfit.metal; g.beginPath(); g.ellipse(0, hy - 1.4, hr + 1.4, hr + 0.6, 0, Math.PI, 0); g.lineTo(hr + 1.4, hy + 1); g.lineTo(-hr - 1.4, hy + 1); g.closePath(); g.fillStyle = lg(-hr, 0, hr, 0, shade(m, 0.12), shade(m, -0.14)); g.fill(); g.lineWidth = 1.9; g.strokeStyle = OUT; g.stroke(); if (!back) { poly([[-1.4, hy - 1], [1.4, hy - 1], [1.2, hy + 5], [-1.2, hy + 5]], shade(m, -0.06), 1.2); } ln([[-hr, hy - 3], [hr, hy - 3]], 1, 'rgba(255,255,255,.35)'); if (hat.plume) { g.beginPath(); g.moveTo(0, hy - hr - 1); g.bezierCurveTo(-8, hy - hr - 10, -14, hy - hr - 2, -11, hy - 2); g.bezierCurveTo(-8, hy - hr - 4, -3, hy - hr - 4, 1, hy - hr + 1); g.closePath(); g.fillStyle = hat.plume; g.fill(); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke(); } }
  }
  // szalik
  if (sp.scarf) { poly([[-6.4, hy + hr - 1.6], [6.4, hy + hr - 1.6], [6, hy + hr + 4], [-6, hy + hr + 4]], sp.scarf, 1.6); if (!back) poly([[1, hy + hr + 3], [5, hy + hr + 3.4], [5.6, hy + hr + 13], [1.8, hy + hr + 12]], shade(sp.scarf, -0.08), 1.5); }
  if (sp.cloak && !back) poly([[-shw - 1.2, -27], [-3, -26.6], [-shw + 2.5, -20], [-shw - 1.8, -19]], shade(sp.cloak, 0.04), 1.4);
  g.restore(); g.restore();
}
export const DIRS = { SE: { view: 'front', mirror: false }, SW: { view: 'front', mirror: true }, NE: { view: 'back', mirror: false }, NW: { view: 'back', mirror: true } };
