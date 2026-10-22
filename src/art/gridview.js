// Rysowanie siatki: linie, podświetlone komórki, znacznik pod kursorem.
import { kit } from './kit.js';

export function fillCell(g, grid, x, y, color, lw = 0, stroke = 'rgba(0,0,0,0)') {
  const { poly } = kit(g); poly(grid.corners(x, y), color, lw, stroke);
}
export function fillCells(g, grid, cells, color) { for (const c of cells) fillCell(g, grid, c.x, c.y, color); }
export function drawGridLines(g, grid, color = 'rgba(255,255,255,.26)') {
  g.strokeStyle = color; g.lineWidth = 1;
  for (let i = 0; i <= grid.cols; i++) { g.beginPath(); g.moveTo(...grid.toScreen(i, 0)); g.lineTo(...grid.toScreen(i, grid.rows)); g.stroke(); }
  for (let j = 0; j <= grid.rows; j++) { g.beginPath(); g.moveTo(...grid.toScreen(0, j)); g.lineTo(...grid.toScreen(grid.cols, j)); g.stroke(); }
}
export function drawCellOutline(g, grid, x, y, color = '#ffffff', lw = 2.2) {
  const { poly } = kit(g); poly(grid.corners(x, y), null, lw, color);
}
// zablokowana komórka: ciemny romb z krzyżykiem
export function drawBlocked(g, grid, x, y) {
  const { ln } = kit(g), [t, r, b, l] = grid.corners(x, y);
  fillCell(g, grid, x, y, 'rgba(120,30,20,.35)');
  ln([[t[0], t[1] + 8], [b[0], b[1] - 8]], 2, 'rgba(255,255,255,.5)'); ln([[l[0] + 14, l[1]], [r[0] - 14, r[1]]], 2, 'rgba(255,255,255,.5)');
}

// Kafle jak płyty z kamienia: każdy w innym odcieniu, ze ściętymi krawędziami, plamami brudu i drobnymi odpryskami.
import { rng } from './rng.js';
export function drawFlagstones(g, grid, seed = 1) {
  const { poly, ln } = kit(g);
  for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.cols; x++) {
    const r = rng(seed * 131 + x * 17 + y * 29), [t, rt, b, l] = grid.corners(x, y), L = r.range(0.2, 0.3);
    const col = `hsl(${r.range(24, 40)},${r.range(8, 16)}%,${L * 100}%)`;
    poly([t, rt, b, l], col, 0);
    g.save(); g.beginPath(); [t, rt, b, l].forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip();
    const cx = (t[0] + b[0]) / 2, cy = (t[1] + b[1]) / 2;
    for (let i = 0; i < 5; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.14)' : 'rgba(255,240,210,.05)'; g.beginPath(); g.ellipse(cx + r.range(-22, 22), cy + r.range(-9, 9), r.range(4, 13), r.range(2, 6), 0, 0, 7); g.fill(); }
    for (let i = 0; i < 2; i++) { const px = cx + r.range(-16, 16), py = cy + r.range(-6, 6); ln([[px, py], [px + r.range(-9, 9), py + r.range(-3, 3)], [px + r.range(-14, 14), py + r.range(-5, 5)]], 0.9, 'rgba(0,0,0,.4)'); }
    g.restore();
    ln([l, t, rt], 1.4, 'rgba(255,235,200,.13)'); ln([rt, b, l], 1.8, 'rgba(0,0,0,.42)');
  }
}
