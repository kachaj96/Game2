// Szum wartościowy: deterministyczny, gładki, bez Math.random. Używany do ukształtowania terenu i rozmieszczenia obiektów.
const hash = (seed, x, y) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (t) => t * t * (3 - 2 * t);
export function noise2(seed, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
  const a = hash(seed, x0, y0), b = hash(seed, x0 + 1, y0), c = hash(seed, x0, y0 + 1), d = hash(seed, x0 + 1, y0 + 1);
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
}
// suma oktaw, wynik w przybliżeniu 0..1
export function fbm(seed, x, y, oct = 4) {
  let amp = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += amp * noise2(seed + i * 101, x * f, y * f); n += amp; amp *= 0.5; f *= 2; }
  return s / n;
}
export const hash2 = hash;
export const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
