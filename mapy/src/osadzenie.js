// Osadzenie sprite'ów w podłożu (mapy/SPEC.md, sekcja 2): jeden kierunek światła, cień rzucony z sylwetki, zaczernienie przy podstawie,
// trawa nachodząca na dół obiektu. Część czysta (tablice pikseli), więc testowalna w node; rysowanie pomocnicze na końcu.
export const LIGHT = { kx: 0.55, ky: 0.22 };   // przesunięcie cienia na ekranie na jednostkę wysokości: w prawo i w stronę widza (światło z lewej góry)

// linia gruntu każdej kolumny: base 'corner' = dolny zarys sylwetki w tej kolumnie (podstawa bryły), 'center' = dolny wiersz sylwetki (pień, słup)
export function groundLine(alpha, w, h, base = 'center', thr = 128) {
  const gl = new Int32Array(w).fill(-1);
  if (base === 'corner') { for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (alpha[y * w + x] >= thr) { gl[x] = y; break; } return gl; }
  let yb = -1; for (let y = h - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < w; x++) if (alpha[y * w + x] >= thr) { yb = y; break; }
  return gl.fill(yb);
}

// cień rzucony: każdy piksel sylwetki ląduje na gruncie w odległości proporcjonalnej do wysokości nad linią gruntu; słabnie ku końcowi
export function shadowMask(alpha, w, h, { base = 'center', kx = LIGHT.kx, ky = LIGHT.ky, thr = 128 } = {}) {
  const gl = groundLine(alpha, w, h, base, thr), W = w + Math.ceil(h * kx) + 3, H = h + Math.ceil(h * ky) + 3, data = new Uint8ClampedArray(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[y * w + x] < thr || gl[x] < 0) continue;
    const hp = Math.max(0, gl[x] - y), dx = Math.round(x + hp * kx), dy = Math.round(gl[x] + hp * ky), v = Math.round(255 * (1 - 0.55 * hp / h));
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = (dy + oy) * W + dx + ox; if (v > data[i]) data[i] = v; }
  }
  return { data, w: W, h: H };
}

// nachodzenie podłoża na dolny pas sprite'a: maska 0..255 na pikselach sylwetki, najmocniejsza przy linii gruntu
export function sunkMask(alpha, w, h, { base = 'center', band = 14, strength = 0.8, thr = 128 } = {}) {
  const gl = groundLine(alpha, w, h, base, thr), out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = alpha[y * w + x]; if (a < 16 || gl[x] < 0) continue; const d = gl[x] - y; if (d >= band) continue;
    const t = 1 - Math.max(0, d) / band; out[y * w + x] = Math.round(a * strength * t * t * (3 - 2 * t));
  }
  return out;
}

export const alphaOf = (rgba) => { const a = new Uint8ClampedArray(rgba.length / 4); for (let i = 0; i < a.length; i++) a[i] = rgba[i * 4 + 3]; return a; };

// ---- rysowanie (wymaga DOM) ----
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function pixelsOf(img) { const c = canvas(img.width, img.height), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); return { c, g, d: g.getImageData(0, 0, c.width, c.height) }; }
export function flipped(img) { const c = canvas(img.width, img.height), g = c.getContext('2d'); g.translate(img.width, 0); g.scale(-1, 1); g.drawImage(img, 0, 0); return c; }
// cień jako canvas w pikselach sprite'a (lewy górny róg ten sam co sprite), czarny z maską, lekko rozmyty
export function shadowCanvas(img, base, blur = 1.4, strength = 0.46) {
  const { d } = pixelsOf(img), m = shadowMask(alphaOf(d.data), d.width, d.height, { base }), src = canvas(m.w, m.h), g = src.getContext('2d'), id = g.createImageData(m.w, m.h);
  for (let i = 0; i < m.data.length; i++) id.data[i * 4 + 3] = m.data[i] * strength;
  g.putImageData(id, 0, 0); const out = canvas(m.w, m.h), og = out.getContext('2d'); og.filter = `blur(${blur}px)`; og.drawImage(src, 0, 0); return out;
}
// podłoże nachodzące na dół sprite'a: piksele podłoża z obrazu ground w miejscu sprite'a, przemnożone maską
export function sunkCanvas(img, base, ground, gx, gy, opt) {
  const { d } = pixelsOf(img), mask = sunkMask(alphaOf(d.data), d.width, d.height, { base, ...opt }), out = canvas(d.width, d.height), g = out.getContext('2d'), id = g.createImageData(d.width, d.height);
  for (let y = 0; y < d.height; y++) for (let x = 0; x < d.width; x++) {
    const i = y * d.width + x; if (!mask[i]) continue; const px = gx + x, py = gy + y; if (px < 0 || py < 0 || px >= ground.width || py >= ground.height) continue;
    const k = (py * ground.width + px) * 4; id.data[i * 4] = ground.data[k]; id.data[i * 4 + 1] = ground.data[k + 1]; id.data[i * 4 + 2] = ground.data[k + 2]; id.data[i * 4 + 3] = mask[i];
  }
  g.putImageData(id, 0, 0); return out;
}
