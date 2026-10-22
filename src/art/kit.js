// Małe narzędzia rysunkowe: równy ciemny kontur, wypełnienia z gradientem.
export const OUT = '#3a2414';
export function kit(g) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const lg = (x0, y0, x1, y1, c0, c1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, c0); q.addColorStop(1, c1); return q; };
  const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
  const poly = (pts, fill, lw = 1.8, stroke = OUT) => {
    path(pts); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  };
  const ln = (pts, w, col) => { path(pts); g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  const blob = (x, y, rx, ry, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; };
  const circ = (x, y, rad, fill, lw = 1.6, stroke = OUT) => { g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  const ell = (x, y, rx, ry, fill, lw = 1.6, stroke = OUT) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
  return { lerp, lg, path, poly, ln, blob, circ, ell };
}
