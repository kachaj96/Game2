// Osadzenie w podłożu: cień rzucony z sylwetki jednym kierunkiem światła (z lewej góry, cień pada w prawo i ku widzowi, jak blob pod skałą w nature.js).
// Część czysta (tablice pikseli) jest testowalna w node; część canvasowa dorysowuje cień przeszkód i postaci w walce.
export const LIGHT = { kx: 0.42, ky: 0.2 };   // przesunięcie cienia na ekranie na jednostkę wysokości

// linia gruntu każdej kolumny: 'center' = dolny wiersz sylwetki (pień, postać, słup), 'corner' = dolny zarys w kolumnie (podstawa bryły)
export function groundLine(alpha, w, h, base = 'center', thr = 128) {
  const gl = new Int32Array(w).fill(-1);
  if (base === 'corner') { for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (alpha[y * w + x] >= thr) { gl[x] = y; break; } return gl; }
  let yb = -1; for (let y = h - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < w; x++) if (alpha[y * w + x] >= thr) { yb = y; break; }
  return gl.fill(yb);
}

// cień rzucony: piksel sylwetki ląduje na gruncie w odległości proporcjonalnej do wysokości nad linią gruntu i słabnie ku końcowi
export function shadowMask(alpha, w, h, { base = 'center', kx = LIGHT.kx, ky = LIGHT.ky, thr = 128 } = {}) {
  const gl = groundLine(alpha, w, h, base, thr), ox = kx < 0 ? Math.ceil(-kx * h) + 2 : 0, W = w + Math.ceil(Math.abs(kx) * h) + 4, H = h + Math.ceil(Math.max(0, ky) * h) + 3, data = new Uint8ClampedArray(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[y * w + x] < thr || gl[x] < 0) continue;
    const hp = Math.max(0, gl[x] - y), dx = Math.round(x + hp * kx) + ox, dy = Math.round(gl[x] + hp * ky), v = Math.round(255 * (1 - 0.55 * hp / h));
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = (dy + b) * W + dx + a; if (v > data[i]) data[i] = v; }
  }
  return { data, w: W, h: H, ox };   // ox: o ile kolumn cień wystaje w lewo poza lewy brzeg sprite'a (przy świetle z prawej)
}
export const alphaOf = (rgba) => { const a = new Uint8ClampedArray(rgba.length / 4); for (let i = 0; i < a.length; i++) a[i] = rgba[i * 4 + 3]; return a; };

// ---- rysowanie (wymaga DOM) ----
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
// cień sprite'a narysowanego funkcją draw(g, x, y) (stopy w punkcie x, y) jako canvas; zwraca też położenie stóp w tym canvasie
export function shadowOf(draw, { size = 160, feet = [80, 130], base = 'center', blur = 1.2, strength = 0.45 } = {}) {
  const c = mk(size, size), g = c.getContext('2d', { willReadFrequently: true }); draw(g, feet[0], feet[1]);
  const d = g.getImageData(0, 0, size, size), m = shadowMask(alphaOf(d.data), size, size, { base }), src = mk(m.w, m.h), sg = src.getContext('2d'), id = sg.createImageData(m.w, m.h);
  for (let i = 0; i < m.data.length; i++) id.data[i * 4 + 3] = m.data[i] * strength;
  sg.putImageData(id, 0, 0); const out = mk(m.w, m.h), og = out.getContext('2d'); og.filter = `blur(${blur}px)`; og.drawImage(src, 0, 0);
  return { canvas: out, fx: feet[0] + m.ox, fy: feet[1] };
}
