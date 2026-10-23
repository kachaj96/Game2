// UWAGA: pora dnia dotyczy tylko świata zewnętrznego (swiat.html). Wnętrza, areny i lochy (walka.html) mają stałe oświetlenie z motywu lochu i nigdy nie importują tego pliku.
// Pora dnia i noc: im ciemniej, tym mniej widać poza światłem latarni bohatera (stożek przed nim) i lamp. Rysowane na osobnej, półprzezroczystej warstwie.
export const DAY_LENGTH = 300;                       // sekund na pełną dobę w trybie zmiennym
// poziom ciemności 0 (dzień) .. 1 (głęboka noc): dzień, zmierzch, noc, świt
export function darkness(t, mode = 'cycle') {
  if (mode === 'day') return 0; if (mode === 'night') return 1;
  const p = ((t / DAY_LENGTH) % 1 + 1) % 1, ss = (a, b, x) => { const v = Math.max(0, Math.min(1, (x - a) / (b - a))); return v * v * (3 - 2 * v); };
  return ss(0.5, 0.62, p) * (1 - ss(0.9, 1.0, p));
}
export const NIGHT_COLOR = [5, 7, 20];
const hole = (g, x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.55, `rgba(0,0,0,${a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
// Stożek światła jako gotowa tekstura (alfa z gładkim zanikiem po kącie i odległości), liczona raz; poza przeglądarką (testy) rysujemy prosty sektor.
const TEX = {};
function coneTex(rgb) {
  const key = rgb.join(','); if (TEX[key] !== undefined) return TEX[key];
  if (typeof document === 'undefined') return (TEX[key] = null);
  const W = 256, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d'), im = q.createImageData(W, H), HALF = 0.95;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x, dy = y - H / 2, r = Math.hypot(dx, dy) / W; let a = 0;
    if (r < 1 && dx >= 0) { const ang = Math.abs(Math.atan2(dy, dx)); if (ang < HALF) { const f = Math.cos(ang / HALF * Math.PI / 2); a = f * f * Math.pow(1 - r, 0.6) * Math.min(1, r * 14 + 0.25); } }
    const i = (y * W + x) * 4; im.data[i] = rgb[0]; im.data[i + 1] = rgb[1]; im.data[i + 2] = rgb[2]; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  q.putImageData(im, 0, 0); return (TEX[key] = c);
}
function cone(g, x, y, angle, range, rgb, alpha) {
  const t = coneTex(rgb);
  g.save(); g.translate(x, y); g.rotate(angle); g.globalAlpha = alpha;
  if (t) g.drawImage(t, 0, -range / 2, range, range);
  else { const gr = g.createRadialGradient(0, 0, range * 0.05, 0, 0, range); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, range, -0.8, 0.8); g.closePath(); g.fill(); }
  g.restore();
}
// warstwa nocy: night to płótno o rozmiarze ekranu (ponownie używane), lights to [{x,y,r,a}] w pikselach ekranu, hero to {x,y,angle} w pikselach ekranu
export function drawNight(g, night, dark, hero, lights, scale) {
  if (dark <= 0.01) return;
  const w = night.width, h = night.height, q = night.getContext('2d');
  q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, w, h); q.fillStyle = `rgba(${NIGHT_COLOR[0]},${NIGHT_COLOR[1]},${NIGHT_COLOR[2]},${(0.96 * dark).toFixed(3)})`; q.fillRect(0, 0, w, h);
  q.globalCompositeOperation = 'destination-out';
  for (const l of lights) hole(q, l.x, l.y, l.r * scale, l.a);
  hole(q, hero.x, hero.y - 24 * scale, 48 * scale, 0.5);                                        // lekka poświata przy samym bohaterze
  cone(q, hero.x, hero.y - 22 * scale, hero.angle, 700 * scale, [0, 0, 0], 1);                  // stożek latarni
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(night, 0, 0);
  // ciepłe światło latarni i lamp dodane na wierzch
  g.save(); g.globalCompositeOperation = 'lighter';
  cone(g, hero.x, hero.y - 22 * scale, hero.angle, 640 * scale, [255, 160, 60], 0.42 * dark);
  for (const l of lights) { const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * scale * 0.7); gr.addColorStop(0, `rgba(255,190,90,${(0.3 * l.a * dark).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.beginPath(); g.arc(l.x, l.y, l.r * scale * 0.7, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
