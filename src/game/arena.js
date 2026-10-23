// Plansza walki w lochu: większa niż prototyp 7 x 7 (jak w Dofusie), z przeszkodami rozrzuconymi ziarnem komnaty.
// Przeszkody nigdy nie odcinają drużyn od siebie ani nie zajmują pól startowych (lewe kolumny) i miejsc wrogów (prawe kolumny).
export const ARENA = { cols: 11, rows: 9, startCols: 3 };
const lcg = (seed) => { let s = (Math.abs(Math.round(seed)) * 2654435761 + 12345) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
function connected(cols, rows, blocked, from, to) {
  const key = (x, y) => y * cols + x, bl = new Set(blocked.map((b) => key(b.x, b.y))), seen = new Set([key(from.x, from.y)]), q = [from];
  for (let i = 0; i < q.length; i++) { const c = q[i]; if (c.x === to.x && c.y === to.y) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c.x + dx, y = c.y + dy; if (x < 0 || y < 0 || x >= cols || y >= rows || bl.has(key(x, y)) || seen.has(key(x, y))) continue; seen.add(key(x, y)); q.push({ x, y }); } }
  return false;
}
export function makeArena(seed, { cols = ARENA.cols, rows = ARENA.rows } = {}) {
  const r = lcg(seed), blocked = [], want = 9 + Math.floor(r() * 4), lo = ARENA.startCols, hi = cols - 4;
  for (let tries = 0; tries < 200 && blocked.length < want; tries++) {
    const x = lo + Math.floor(r() * (hi - lo + 1)), y = Math.floor(r() * rows); if (blocked.some((b) => b.x === x && b.y === y)) continue;
    // bez zbitek 2 x 2 i bez zamykania przejścia: po dodaniu obie połowy planszy muszą się nadal łączyć
    if (blocked.some((b) => Math.abs(b.x - x) <= 1 && Math.abs(b.y - y) <= 1 && b.x !== x && b.y !== y && blocked.some((c) => (c.x === x && c.y === b.y) || (c.y === y && c.x === b.x)))) continue;
    const next = [...blocked, { x, y }]; if (!connected(cols, rows, next, { x: 0, y: Math.floor(rows / 2) }, { x: cols - 1, y: Math.floor(rows / 2) })) continue;
    // każdy kafel poza blokadami ma nadal choć jednego wolnego sąsiada (bez zamkniętych kieszeni)
    blocked.push({ x, y });
  }
  return { cols, rows, blocked, zone: (x) => x < ARENA.startCols };
}
