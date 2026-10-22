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
