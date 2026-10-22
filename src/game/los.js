// Linia widzenia na siatce. Symetryczna (a widzi b <=> b widzi a), bo linia liczona zawsze od "mniejszego" końca.
// Linię blokują ściany terenu i groby, jednostki nie.
export function lineCells(a, b) {
  let p = a, q = b; if (p.x > q.x || (p.x === q.x && p.y > q.y)) [p, q] = [q, p];
  const out = [], dx = Math.abs(q.x - p.x), dy = Math.abs(q.y - p.y), sx = p.x < q.x ? 1 : -1, sy = p.y < q.y ? 1 : -1;
  let x = p.x, y = p.y, err = dx - dy;
  for (;;) { out.push({ x, y }); if (x === q.x && y === q.y) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x += sx; } if (e2 < dx) { err += dx; y += sy; } }
  return out;
}
// graveKeys: zbiór kluczy komórek z grobami (grid.key)
export function hasLineOfSight(grid, graveKeys, a, b) {
  const cells = lineCells(a, b);
  for (let i = 1; i < cells.length - 1; i++) { const c = cells[i]; if (grid.isBlocked(c.x, c.y) || graveKeys.has(grid.key(c.x, c.y))) return false; }
  return true;
}
