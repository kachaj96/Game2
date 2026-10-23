// Nastrój sceny: kolorystyka i światło nakładane na gotowy obraz, bez zmiany kształtów generatorów.
// Wywołuj po narysowaniu świata, w układzie ekranu (bez skalowania świata).
export const MOODS = {
  dzien: { tint: null, vig: 0.15 },
  zmierzch: { tint: 'rgb(214,170,150)', vig: 0.5 },
  noc: { tint: 'rgb(118,130,190)', vig: 0.66 },
  // surowo: wyblakłe kolory, brudne ciepłe cienie, ciężka winieta i ziarno
  gritLekki: { tint: 'rgb(214,202,192)', vig: 0.42, desat: 0.4, grain: 0.18 },
  ziemia: { tint: 'rgb(214,186,156)', vig: 0.62, desat: 0.36, grain: 0.2 },
  gniazdo: { tint: 'rgb(168,176,206)', vig: 0.78, desat: 0.55, grain: 0.24 },
  grit: { tint: 'rgb(196,184,176)', vig: 0.72, desat: 0.5, grain: 0.22 },
};
export function applyMood(g, w, h, name = 'noc') {
  const m = MOODS[name] || MOODS.dzien;
  if (m.desat) { g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${m.desat})`; g.fillRect(0, 0, w, h); g.restore(); }
  if (m.tint) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = m.tint; g.fillRect(0, 0, w, h); g.restore(); }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(4,7,18,${m.vig})`);
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  if (m.grain) grain(g, w, h, m.grain);
}
// ciepła poświata (latarnia, kula maga, okno): dodaje światło, więc w ciemności działa najmocniej
export function glow(g, x, y, r, color = '255,200,90', a = 0.4) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// ziarno filmowe: jeden mały kafel szumu (deterministyczny), kładziony wzorem
let noise = null;
function grain(g, w, h, a) {
  if (typeof document === 'undefined') return;
  if (!noise) {
    noise = document.createElement('canvas'); noise.width = noise.height = 128; const n = noise.getContext('2d'), im = n.createImageData(128, 128); let s = 12345;
    for (let i = 0; i < im.data.length; i += 4) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const v = 110 + ((s >>> 24) % 70); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    n.putImageData(im, 0, 0);
  }
  const pat = g.createPattern(noise, 'repeat'); if (!pat) return;
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a; g.fillStyle = pat; g.fillRect(0, 0, w, h); g.restore();
}

// Wersja do pętli gry: ciężkie części (odbarwienie, ziarno) wypiekamy raz w statycznym tle, a co klatkę nakładamy tylko gotową warstwę
// (odcień razem z winietą jako mnożenie), co jest wielokrotnie tańsze niż applyMood na pełnym ekranie.
export function applyMoodStatic(g, w, h, name = 'noc') {
  const m = MOODS[name] || MOODS.dzien;
  if (m.desat) { g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${m.desat})`; g.fillRect(0, 0, w, h); g.restore(); }
  if (m.grain) grain(g, w, h, m.grain);
}
export function makeMoodLayer(doc, w, h, name = 'noc') {
  const m = MOODS[name] || MOODS.dzien, c = doc.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = m.tint || '#fff'; g.fillRect(0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(4,7,18,${m.vig})`); g.fillStyle = v; g.fillRect(0, 0, w, h);
  return c;
}
