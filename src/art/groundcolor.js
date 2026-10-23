// Kolor gruntu na płaskich platformach: malarskie, z szumem, ostre nieregularne granice między rodzajami (trawa, mech, droga, bruk, piasek, woda).
// Granice rodzajów są przesunięte szumem, więc nie biegną po krawędziach kafli.
import { fbm, noise2, smoothstep, hash2 } from '../world/noise.js';
import { GRIT } from './color.js';

const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
export function hslRgb(h, s, l) {
  s = Math.max(0, Math.min(1, s * GRIT.sat)); l = Math.max(0, Math.min(1, l * GRIT.light)); h = (((h % 360) + 360) % 360) / 360;
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgbStr = (c) => `rgb(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))})`;
const N = 192;
const kindAt = (w, x, y) => { const tx = Math.max(0, Math.min(N - 1, Math.floor(x))), ty = Math.max(0, Math.min(N - 1, Math.floor(y))); return w.cellKind[ty * N + tx]; };
const shoreAt = (w, x, y) => { const tx = Math.max(0, Math.min(N - 1, Math.floor(x))), ty = Math.max(0, Math.min(N - 1, Math.floor(y))); return w.shore[ty * N + tx]; };

// zwraca [r,g,b] 0..255 dla punktu siatki (x,y) leżącego na płaskiej powierzchni
export function groundRGB(w, x, y) {
  const seed = w.seed, K = w.KIND;
  // granice rodzajów przesunięte szumem
  const wx = x + (noise2(seed + 74, x * 1.3, y * 1.3) - 0.5) * 0.9, wy = y + (noise2(seed + 75, x * 1.3 + 9, y * 1.3) - 0.5) * 0.9;
  const kind = kindAt(w, wx, wy), n1 = fbm(seed + 70, x / 11, y / 11, 3), n2 = noise2(seed + 71, x * 2.1, y * 2.1), n3 = fbm(seed + 72, x / 3.2, y / 3.2, 2), f = w.fieldAt(x, y);
  const grass = hslRgb(97 + 14 * (n1 - 0.5), 0.52, 0.46 + 0.13 * (n1 - 0.5) + 0.05 * (n3 - 0.5));
  let c;
  if (kind === K.water) {
    const d = shoreAt(w, x, y) + (noise2(seed + 76, x * 0.8, y * 0.8) - 0.5), deep = smoothstep(0.5, 7, d), foam = smoothstep(1.15, 0.35, d + (n2 - 0.5) * 0.7);
    c = mix(hslRgb(188, 0.52, 0.52), hslRgb(214, 0.6, 0.3), deep); c = mix(c, [238, 246, 250], foam * 0.85);
  } else if (kind === K.shallow) c = mix(hslRgb(170, 0.42, 0.55), hslRgb(190, 0.5, 0.5), n3);
  else if (kind === K.chasm) c = mix(hslRgb(30, 0.1, 0.12), hslRgb(30, 0.12, 0.2), n3);
  else if (kind === K.moss) c = hslRgb(122, 0.3, 0.26 + 0.07 * (n2 - 0.5) + 0.05 * (n3 - 0.5));
  else if (kind === K.dry) c = hslRgb(66 - 8 * n3, 0.42, 0.46 + 0.07 * (n3 - 0.5));
  else if (kind === K.sand) c = hslRgb(46 + 4 * n3, 0.46, 0.66 + 0.06 * (n2 - 0.5));
  else if (kind === K.road) c = hslRgb(36 + 5 * n3, 0.36, 0.58 + 0.07 * (n2 - 0.5));
  else if (kind === K.plaza) { const st = hash2(seed + 77, Math.floor(x * 1.6), Math.floor(y * 1.6)); c = hslRgb(38, 0.1, 0.5 + 0.12 * st); }
  else if (kind === K.meadow) c = mix(grass, hslRgb(84, 0.58, 0.58), 0.55);
  else c = grass;
  return c;
}
export const groundColor = (w, x, y) => rgbStr(groundRGB(w, x, y));
