// Nastrój sceny: kolorystyka i światło nakładane na gotowy obraz, bez zmiany kształtów generatorów.
// Wywołuj po narysowaniu świata, w układzie ekranu (bez skalowania świata).
export const MOODS = {
  dzien: { tint: null, vig: 0.15 },
  zmierzch: { tint: 'rgb(214,170,150)', vig: 0.5 },
  noc: { tint: 'rgb(118,130,190)', vig: 0.66 },
};
export function applyMood(g, w, h, name = 'noc') {
  const m = MOODS[name] || MOODS.dzien;
  if (m.tint) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = m.tint; g.fillRect(0, 0, w, h); g.restore(); }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(4,7,18,${m.vig})`);
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}
// ciepła poświata (latarnia, kula maga, okno): dodaje światło, więc w ciemności działa najmocniej
export function glow(g, x, y, r, color = '255,200,90', a = 0.4) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
