// Ikony czarów: medalion w kolorze i kształcie żywiołu, symbol unikalny dla czaru, znaczniki stanu (wybrany, wyszarzony, odnowienie, koszt PA).
// Kształt ramki mówi o żywiole także bez koloru (daltonizm): Ziemia kwadrat, Ogień koło, Woda sześciokąt, Powietrze romb, Zwykłe tarcza.
import { kit, OUT } from './kit.js';
import { ELEMENTS } from '../game/classdata.js';
import { shade, mix } from './color.js';

const CREAM = '#fff1d0';
// kształty ramek, promień 28 jednostek wokół (0,0)
const FRAMES = {
  square: () => [[-24, -24], [24, -24], [24, 24], [-24, 24]],
  circle: () => Array.from({ length: 28 }, (_, i) => [Math.cos(i / 28 * 6.2832) * 27, Math.sin(i / 28 * 6.2832) * 27]),
  hex: () => Array.from({ length: 6 }, (_, i) => [Math.cos(i / 6 * 6.2832 + 0.5236) * 28, Math.sin(i / 6 * 6.2832 + 0.5236) * 28]),
  diamond: () => [[0, -30], [28, 0], [0, 30], [-28, 0]],
  shield: () => [[-24, -24], [24, -24], [24, 6], [0, 28], [-24, 6]],
};

// symbole rysowane w cremowym kolorze z ciemnym konturem, układ (0,0) = środek, zakres około +-20
const SYMBOLS = {
  cios_lopata(k) { const { poly, ln } = k; ln([[-15, 16], [8, -8]], 5.6, OUT); ln([[-15, 16], [8, -8]], 3, '#c8a06a'); poly([[2, -16], [18, -4], [10, 2], [-4, -8]], CREAM, 2); ln([[4, -12], [13, -3]], 1.2, '#b8a888'); },
  zrzut_ziemi(k) { const { poly, ln } = k; poly([[-14, -6], [-6, -16], [6, -14], [12, -4], [6, 8], [-8, 8]], CREAM, 2); ln([[-6, -8], [2, -4]], 1.4, '#b8a888'); for (const y of [-10, -2, 6]) ln([[-22, y + 2], [-16, y + 2]], 2.2, CREAM); poly([[14, 10], [22, 14], [14, 18]], CREAM, 1.8); },
  dol(k) { const { ell, poly } = k; ell(0, 4, 17, 8, '#2a1a10', 2); ell(0, 5, 11, 4.5, '#120a06', 0); for (const x of [-11, 0, 11]) poly([[x - 3, 2], [x, -12], [x + 3, 2]], CREAM, 1.8); },
  belt(k) { const { poly, ln } = k; ln([[-18, 14], [14, -14]], 4.6, OUT); ln([[-18, 14], [14, -14]], 2.4, CREAM); poly([[12, -18], [20, -20], [18, -10]], CREAM, 2); poly([[-18, 14], [-24, 12], [-20, 8]], CREAM, 1.6); poly([[-18, 14], [-20, 20], [-14, 18]], CREAM, 1.6); ln([[-4, 20], [8, 8]], 1.4, 'rgba(255,241,208,.6)'); ln([[2, 22], [14, 10]], 1.4, 'rgba(255,241,208,.6)'); },
  sidla(k) { const { circ, ln } = k; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832; ln([[0, 0], [Math.cos(a) * 20, Math.sin(a) * 20]], 2, CREAM); } for (const r of [8, 14, 20]) { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * 6.2832, rr = r - (i % 2 ? 0 : 0); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } ln(pts, 1.6, CREAM); } circ(0, 0, 2.4, CREAM, 1.4); },
  odskok(k) { const { ln, poly, circ } = k; g_arc(k, -20, 12, 0, -14, 20, 6); poly([[16, 4], [24, 10], [14, 14]], CREAM, 1.8); circ(-18, 14, 3.4, 'rgba(255,241,208,.55)', 0); circ(-8, 4, 3, 'rgba(255,241,208,.35)', 0); },
  zar(k) { const { poly, ln } = k; poly([[0, -22], [10, -8], [16, 4], [8, 18], [-8, 18], [-16, 4], [-8, -6], [-4, -12]], CREAM, 2); poly([[0, -4], [6, 6], [3, 14], [-3, 14], [-6, 6]], '#ffb24a', 0); ln([[18, -14], [20, -18]], 2, CREAM); ln([[-18, -12], [-20, -17]], 2, CREAM); },
  podmuch(k) { const { ln, circ } = k; const pts = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * 11, r = 2 + i * 0.6; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } ln(pts, 4.4, OUT); ln(pts, 2.4, CREAM); circ(18, -14, 2, CREAM, 0); circ(-19, 12, 2.4, CREAM, 0); circ(20, 12, 1.6, CREAM, 0); },
  lzy_zaloby(k) { const { poly, ln } = k; poly([[0, -22], [12, 2], [10, 12], [0, 18], [-10, 12], [-12, 2]], CREAM, 2); ln([[-5, 4], [-3, 11]], 2, '#9ac8f0'); ln([[-16, 20], [16, 20]], 1.6, 'rgba(255,241,208,.7)'); },
  kamienny_calun(k) { const { poly, ln } = k; poly([[-18, 14], [-14, -10], [0, -18], [14, -10], [18, 14]], CREAM, 2); ln([[-8, 2], [0, -6], [8, 2]], 1.6, '#b8a888'); ln([[0, -6], [0, 12]], 1.6, '#b8a888'); },
  plonacy_belt(k) { const { poly, ln } = k; ln([[-18, 14], [10, -12]], 4.6, OUT); ln([[-18, 14], [10, -12]], 2.4, CREAM); poly([[8, -20], [18, -22], [16, -10]], CREAM, 2); poly([[-4, -8], [2, -2], [-2, 4], [-8, -1]], '#ffb24a', 1.4); poly([[-18, 14], [-24, 12], [-20, 8]], CREAM, 1.6); },
  szron(k) { const { ln, circ } = k; for (let i = 0; i < 3; i++) { const a = i / 3 * 3.1416; ln([[Math.cos(a) * -20, Math.sin(a) * -20], [Math.cos(a) * 20, Math.sin(a) * 20]], 3.2, OUT); ln([[Math.cos(a) * -20, Math.sin(a) * -20], [Math.cos(a) * 20, Math.sin(a) * 20]], 1.8, CREAM); } circ(0, 0, 3, CREAM, 1.4); },
  wicher(k) { const { ln } = k; for (const [y, w] of [[-10, 22], [0, 26], [10, 20]]) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([-w + i * (w * 2 / 12), y + Math.sin(i * 0.9) * 3 - (i > 9 ? (i - 9) * 1.5 : 0)]); ln(pts, 4.2, OUT); ln(pts, 2.2, CREAM); } },
  stos(k) { const { poly, ln } = k; ln([[-18, 16], [14, 8]], 5.4, OUT); ln([[-18, 16], [14, 8]], 3, '#c8a06a'); ln([[-14, 8], [18, 16]], 5.4, OUT); ln([[-14, 8], [18, 16]], 3, '#a8804a'); poly([[0, -22], [8, -8], [12, 4], [0, 12], [-12, 4], [-6, -8]], CREAM, 2); poly([[0, -6], [4, 2], [0, 8], [-4, 2]], '#ffb24a', 0); },
};
function g_arc(k, x0, y0, cx, cy, x1, y1) { const { ln } = k; const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); } ln(pts, 5, OUT); ln(pts, 2.8, CREAM); }
export const SPELL_SYMBOLS = Object.keys(SYMBOLS);

// state: { selected, disabled, cooldown (liczba), soon (czar jeszcze nie działa), noPa (za mało PA) }
export function drawSpellIcon(g, spell, x, y, size = 64, state = {}) {
  const k = kit(g), { poly, circ, lg } = k, el = ELEMENTS[spell.element] || ELEMENTS.neutral, s = size / 64;
  g.save(); if ('filter' in g) g.filter = 'saturate(.68) brightness(.9) contrast(1.08)'; g.translate(x, y); g.scale(s, s);
  if (state.selected) { const gr = g.createRadialGradient(0, 0, 18, 0, 0, 46); gr.addColorStop(0, 'rgba(255,224,102,.65)'); gr.addColorStop(1, 'rgba(255,224,102,0)'); g.fillStyle = gr; g.fillRect(-46, -46, 92, 92); }
  const pts = FRAMES[el.shape]();
  poly(pts, lg(0, -28, 0, 28, shade(el.color, 0.16), shade(el.color, -0.2)), 3.2);
  poly(pts.map(([px, py]) => [px * 0.86, py * 0.86]), null, 1.2, 'rgba(255,255,255,.28)');
  (SYMBOLS[spell.id] || (() => circ(0, 0, 10, CREAM, 2)))(k);
  if (state.selected) poly(pts.map(([px, py]) => [px * 1.08, py * 1.08]), null, 3, '#ffe066');
  if (state.disabled || state.soon) { poly(pts, 'rgba(14,16,12,.62)', 0); }
  if (state.cooldown > 0) { poly(pts, 'rgba(10,12,10,.7)', 0); g.font = 'bold 30px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(String(state.cooldown), 0, 2); g.fillStyle = '#fff'; g.fillText(String(state.cooldown), 0, 2); }
  if (state.soon) { g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d8d8c8'; g.fillText('wkrótce', 0, 2); }
  if (spell.pa != null) { // znaczek kosztu PA w prawym dolnym rogu
    const bad = state.noPa; circ(20, 22, 11, bad ? '#8a2020' : '#1a2a5a', 2.2); g.font = 'bold 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(String(spell.pa), 20, 23);
  }
  g.restore();
}
