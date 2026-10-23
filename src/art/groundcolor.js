// Kolor gruntu w dowolnym punkcie świata: ciągła funkcja położenia, wysokości i nachylenia, więc zbocza są gładkie, bez kafli.
// Trawa miesza się z mchem lasu, piaskiem nad wodą, drogą i skałą na stromiznach; światło pada z lewej góry.
import { heightAt } from '../world/nav.js';
import { WATER } from '../world/kraina.js';
import { fbm, noise2, smoothstep } from '../world/noise.js';
import { GRIT } from './color.js';

const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
export function hslRgb(h, s, l) {
  s = Math.max(0, Math.min(1, s * GRIT.sat)); l = Math.max(0, Math.min(1, l * GRIT.light)); h = (((h % 360) + 360) % 360) / 360;
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbStr = (c) => `rgb(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))})`;

// zwraca [r,g,b] 0..255 dla punktu siatki (x,y)
export function groundRGB(w, x, y) {
  const seed = w.seed, h = heightAt(w, x, y), e = 0.7;
  const gx = (heightAt(w, x + e, y) - heightAt(w, x - e, y)) / (2 * e), gy = (heightAt(w, x, y + e) - heightAt(w, x, y - e)) / (2 * e), slope = Math.hypot(gx, gy);
  const f = w.fieldAt(x, y), n1 = fbm(seed + 70, x / 11, y / 11, 3), n2 = noise2(seed + 71, x * 1.9, y * 1.9), n3 = fbm(seed + 72, x / 3.5, y / 3.5, 2);
  // trawa, na wyżynie sucha, w lesie mech
  let c = hslRgb(97 + 14 * (n1 - 0.5), 0.5, 0.45 + 0.13 * (n1 - 0.5) + 0.04 * (n3 - 0.5));
  c = mix(c, hslRgb(66, 0.4, 0.46 + 0.05 * (n3 - 0.5)), smoothstep(1.6, 4.2, h));
  c = mix(c, hslRgb(122, 0.3, 0.24 + 0.06 * (n2 - 0.5) + 0.04 * (n3 - 0.5)), smoothstep(0.42, 0.5, f.forest + (n3 - 0.5) * 0.45));
  c = mix(c, hslRgb(48, 0.42, 0.66), smoothstep(WATER + 0.3, WATER + 0.02, h) * (1 - f.forest * 0.5));
  c = mix(c, hslRgb(36, 0.36, 0.58 + 0.05 * (n2 - 0.5)), smoothstep(0.48, 0.54, f.road + (n2 - 0.5) * 0.3));
  const stone = Math.floor(x * 1.6) * 7 + Math.floor(y * 1.6) * 13, st = ((Math.sin(stone) * 43758.5) % 1 + 1) % 1;
  c = mix(c, hslRgb(38, 0.1, 0.5 + 0.1 * st), smoothstep(0.46, 0.52, f.plaza + (n3 - 0.5) * 0.12));
  // skała na stromiznach i szczytach, z poziomymi warstwami
  const rk = Math.max(smoothstep(0.5, 0.58, slope + (n3 - 0.5) * 0.18), smoothstep(5.2, 6.4, h));
  if (rk > 0) c = mix(c, hslRgb(30, 0.1, 0.42 + 0.05 * Math.sin(h * 9 + n1 * 7) + 0.04 * (n2 - 0.5)), rk);
  // światło z lewej góry: zbocze rosnące ku +x patrzy w stronę światła
  const L = 0.5 + (gx * 0.7 - gy * 0.26) * 0.55, k = Math.max(0.55, Math.min(1.3, 0.74 + 0.52 * L));
  c = [c[0] * k, c[1] * k, c[2] * k];
  if (f.chasm > 0) c = mix(c, [14, 11, 10], f.chasm);
  if (h < WATER) {
    const d = WATER - h, deep = smoothstep(0, 1.1, d), foam = smoothstep(0.1, 0, d);
    let wc = mix(hslRgb(190, 0.5, 0.5), hslRgb(212, 0.58, 0.28), deep); wc = mix(wc, [236, 244, 248], foam * 0.8);
    c = mix(c, wc, smoothstep(0, 0.05, d) * 0.97 + 0.03);
  }
  return c;
}
export const groundColor = (w, x, y) => rgbStr(groundRGB(w, x, y));
