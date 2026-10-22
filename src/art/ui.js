// Oprawa interfejsu: kute żelazo, kość i mosiężny akcent. Wszystko rysuje kod, bez plików graficznych.
// drawPlate rysuje kafel pod ramkę 9-częściową (border-image): rogi z nitami i kościanymi okuciami, krawędzie jednolite.
import { rng } from './rng.js';
import { kit } from './kit.js';
import { shade } from './color.js';

export const THEME = { edge: '#0b0909', bone: '#d8ccb0', brass: '#b08a3a', brassHi: '#e0b44a', ink: '#f0e6d0', dim: '#a89878', ember: '#e07a3a' };
const KINDS = { panel: ['#4a4244', '#1f1a1b'], btn: ['#5a5052', '#2a2425'], on: ['#7a5e2a', '#2e2410'] };

export function drawPlate(g, S, kind = 'panel') {
  const { poly, circ, ln } = kit(g), [hi, lo] = KINDS[kind] || KINDS.panel, r = rng(kind.length * 131 + S);
  const grad = g.createLinearGradient(0, 0, 0, S); grad.addColorStop(0, hi); grad.addColorStop(1, lo);
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  // ślady obróbki: delikatne rysy na żelazie
  for (let i = 0; i < 14; i++) { const x = 14 + r() * (S - 28), y = 14 + r() * (S - 28); ln([[x, y], [x + r.range(-5, 5), y + r.range(2, 6)]], 0.8, 'rgba(255,255,255,.05)'); }
  g.lineWidth = 2; g.strokeStyle = THEME.edge; g.strokeRect(1, 1, S - 2, S - 2);
  g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(2.5, S - 2.5); g.lineTo(2.5, 2.5); g.lineTo(S - 2.5, 2.5); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.moveTo(S - 2.5, 2.5); g.lineTo(S - 2.5, S - 2.5); g.lineTo(2.5, S - 2.5); g.stroke();
  g.lineWidth = 1.2; g.strokeStyle = kind === 'on' ? THEME.brassHi : `${THEME.brass}aa`; g.strokeRect(5.5, 5.5, S - 11, S - 11);
  // kościane okucia w rogach i nity
  const c = 14;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const X = sx ? S : 0, Y = sy ? S : 0, dx = sx ? -1 : 1, dy = sy ? -1 : 1;
    poly([[X + dx * 1.5, Y + dy * 1.5], [X + dx * c, Y + dy * 1.5], [X + dx * 1.5, Y + dy * c]], kind === 'on' ? THEME.brass : THEME.bone, 1.2);
    circ(X + dx * 7.5, Y + dy * 7.5, 2.4, shade(THEME.bone, -0.12), 1); circ(X + dx * 6.9, Y + dy * 6.9, 0.8, '#fff', 0);
  }
}

// kłódka na zablokowany slot klasy (rysowana w kwadracie size x size ze środkiem w (cx,cy))
export function drawLock(g, cx, cy, size, col = '#8a8272') {
  const { poly, ln } = kit(g), s = size / 2;
  g.beginPath(); g.arc(cx, cy - s * 0.25, s * 0.42, Math.PI, 0); g.lineWidth = Math.max(1.5, size * 0.1); g.strokeStyle = col; g.stroke();
  poly([[cx - s * 0.62, cy - s * 0.2], [cx + s * 0.62, cy - s * 0.2], [cx + s * 0.62, cy + s * 0.7], [cx - s * 0.62, cy + s * 0.7]], col, 1.2, THEME.edge);
  ln([[cx, cy + s * 0.12], [cx, cy + s * 0.42]], Math.max(1.5, size * 0.09), THEME.edge);
}

// przenosi ramki do zmiennych CSS (border-image), wywoływane raz po załadowaniu strony
export function installFrames(doc = document, S = 48) {
  const root = doc.documentElement.style;
  for (const kind of Object.keys(KINDS)) { const c = doc.createElement('canvas'); c.width = c.height = S; drawPlate(c.getContext('2d'), S, kind); root.setProperty(`--f-${kind}`, `url(${c.toDataURL()})`); }
}

// Kula zasobu jak w Diablo: ciecz do poziomu frac (0..1), połysk, żelazny pierścień i liczba w środku.
export const ORBS = { hp: ['#d83a30', '#4a0808'], pa: ['#5a86d0', '#10203e'], pm: ['#7aa642', '#1c2c0e'] };
export function drawOrb(g, S, frac, kind = 'hp', text = '') {
  const [hi, lo] = ORBS[kind] || ORBS.hp, c = S / 2, r = S / 2 - S * 0.07, f = Math.max(0, Math.min(1, frac));
  g.clearRect(0, 0, S, S);
  g.save(); g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#120a0a'; g.fillRect(0, 0, S, S);
  const top = c + r - 2 * r * f;
  if (f > 0) {
    const gr = g.createLinearGradient(0, top, 0, c + r); gr.addColorStop(0, hi); gr.addColorStop(1, lo);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, S);
    for (let x = 0; x <= S; x += 2) g.lineTo(x, top + Math.sin(x / S * 6.5) * S * 0.018 * (f < 1 ? 1 : 0));
    g.lineTo(S, S); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, top, S, Math.max(1, S * 0.02));
  }
  const gl = g.createRadialGradient(c - r * 0.4, c - r * 0.5, 1, c - r * 0.4, c - r * 0.5, r * 0.8); gl.addColorStop(0, 'rgba(255,255,255,.32)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(0, 0, S, S);
  g.restore();
  g.lineWidth = S * 0.075; g.strokeStyle = '#4a4244'; g.beginPath(); g.arc(c, c, r + S * 0.02, 0, Math.PI * 2); g.stroke();
  g.lineWidth = S * 0.02; g.strokeStyle = '#0b0909'; g.beginPath(); g.arc(c, c, r + S * 0.06, 0, Math.PI * 2); g.stroke();
  g.lineWidth = S * 0.015; g.strokeStyle = THEME.brass; g.beginPath(); g.arc(c, c, r - S * 0.01, 0, Math.PI * 2); g.stroke();
  if (text) { g.font = `700 ${Math.round(S * 0.3)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = S * 0.06; g.strokeStyle = '#000'; g.strokeText(text, c, c); g.fillStyle = '#f4ead4'; g.fillText(text, c, c); }
}
