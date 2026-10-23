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

// ---- interfejs w stylu Dofusa: kryształowe serce, gwiazda PA, romb PM (rysowane kodem) ----
const shadowText = (g, text, x, y, size, fill = '#fff') => { g.font = `800 ${Math.round(size)}px "Trebuchet MS",system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.28; g.strokeStyle = '#1a0c10'; g.strokeText(text, x, y); g.fillStyle = fill; g.fillText(text, x, y); };
// Serce-kryształ: ciemny fiolet (pustka) i czerwień (życie) do poziomu frac, fasety, metalowa oprawa i liczba życia nad kreską i maksimum pod nią.
export function drawHeart(g, S, frac, cur, max) {
  g.clearRect(0, 0, S, S); const f = Math.max(0, Math.min(1, frac)), W = S, H = S;
  const path = (k = 1, dy = 0) => { const cx = W / 2, top = H * 0.2 + dy, bot = H * 0.94; g.beginPath(); g.moveTo(cx, H * 0.34 + dy); g.bezierCurveTo(cx - W * 0.1 * k, top - H * 0.08, cx - W * 0.46 * k, top - H * 0.02, cx - W * 0.46 * k, H * 0.42 + dy); g.bezierCurveTo(cx - W * 0.46 * k, H * 0.68 + dy, cx - W * 0.16 * k, H * 0.82, cx, bot); g.bezierCurveTo(cx + W * 0.16 * k, H * 0.82, cx + W * 0.46 * k, H * 0.68 + dy, cx + W * 0.46 * k, H * 0.42 + dy); g.bezierCurveTo(cx + W * 0.46 * k, top - H * 0.02, cx + W * 0.1 * k, top - H * 0.08, cx, H * 0.34 + dy); g.closePath(); };
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = S * 0.05; g.shadowOffsetY = S * 0.03; path(1.04); g.fillStyle = '#3a3c58'; g.fill(); g.restore();
  path(1.04); const mg = g.createLinearGradient(0, 0, W, H); mg.addColorStop(0, '#c9cbe0'); mg.addColorStop(0.5, '#6c6f92'); mg.addColorStop(1, '#2e3050'); g.fillStyle = mg; g.fill();   // oprawa
  g.save(); path(0.9); g.clip();
  const bg = g.createLinearGradient(0, H * 0.15, 0, H * 0.95); bg.addColorStop(0, '#6a4f8a'); bg.addColorStop(1, '#241a3c'); g.fillStyle = bg; g.fillRect(0, 0, W, H);   // pustka
  const top = H * 0.94 - (H * 0.94 - H * 0.2) * f;
  if (f > 0) { const rg = g.createLinearGradient(0, top, 0, H * 0.94); rg.addColorStop(0, '#ff5a6a'); rg.addColorStop(0.5, '#d4283e'); rg.addColorStop(1, '#7a0e24'); g.fillStyle = rg; g.fillRect(0, top, W, H); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, top, W, Math.max(1, S * 0.012)); }
  // fasety kryształu
  g.lineWidth = Math.max(1, S * 0.012); g.strokeStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(W / 2, H * 0.3); g.lineTo(W / 2, H * 0.94); g.moveTo(W * 0.1, H * 0.4); g.lineTo(W / 2, H * 0.52); g.lineTo(W * 0.9, H * 0.4); g.stroke();
  const hl = g.createLinearGradient(W * 0.2, H * 0.2, W * 0.6, H * 0.6); hl.addColorStop(0, 'rgba(255,255,255,.4)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.beginPath(); g.ellipse(W * 0.34, H * 0.36, W * 0.2, H * 0.1, -0.5, 0, 7); g.fill();
  g.restore();
  path(0.9); g.lineWidth = S * 0.02; g.strokeStyle = '#15162c'; g.stroke();
  shadowText(g, String(cur), W / 2, H * 0.47, S * 0.19);
  g.fillStyle = '#fff'; g.fillRect(W * 0.3, H * 0.575, W * 0.4, Math.max(1.5, S * 0.014)); shadowText(g, String(max), W / 2, H * 0.69, S * 0.17);
}
const star = (g, cx, cy, R, r, n = 5) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); };
// Gwiazda PA (niebieska) i romb PM (zielony) z liczbą w środku
export function drawStat(g, S, kind, value) {
  g.clearRect(0, 0, S, S); const c = S / 2, isStar = kind === 'pa', [hi, mid, lo] = isStar ? ['#8ac0ff', '#3c78e0', '#16327a'] : ['#b6ee6a', '#52b02a', '#1c5a14'];
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = S * 0.06; g.shadowOffsetY = S * 0.03;
  if (isStar) star(g, c, c * 1.04, c * 0.92, c * 0.5); else { g.beginPath(); g.moveTo(c, S * 0.06); g.lineTo(S * 0.94, c); g.lineTo(c, S * 0.94); g.lineTo(S * 0.06, c); g.closePath(); }
  const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, hi); gr.addColorStop(0.5, mid); gr.addColorStop(1, lo); g.fillStyle = gr; g.fill(); g.restore();
  g.lineJoin = 'round'; g.lineWidth = S * 0.045; g.strokeStyle = '#14162e'; if (isStar) star(g, c, c * 1.04, c * 0.92, c * 0.5); else { g.beginPath(); g.moveTo(c, S * 0.06); g.lineTo(S * 0.94, c); g.lineTo(c, S * 0.94); g.lineTo(S * 0.06, c); g.closePath(); } g.stroke();
  g.save(); g.clip(); const hl = g.createLinearGradient(0, 0, 0, c); hl.addColorStop(0, 'rgba(255,255,255,.5)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(0, 0, S, c); g.restore();
  shadowText(g, String(value), c, c * 1.08, S * 0.4);
}
