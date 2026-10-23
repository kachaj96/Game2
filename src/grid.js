// Siatka izometryczna 2:1. Logika bez rysowania, żeby dało się ją testować bez canvasa.
// Komórka (gx,gy) to kwadrat [gx,gx+1] x [gy,gy+1] w siatce. Jej wierzchołki na ekranie:
//   góra = toScreen(gx,gy), prawo = toScreen(gx+1,gy), dół = toScreen(gx+1,gy+1), lewo = toScreen(gx,gy+1).
// Oś x idzie w prawo-dół, oś y w lewo-dół. Głębokość (kolejność rysowania) rośnie z gx+gy.
export const TW = 72, TH = 36;

export class IsoGrid {
  // tw, th: rozmiar kafla (domyślnie 72 x 36, rzut 2:1); mapy v3 używają th = 42 (izometria 30 stopni)
  constructor(cols, rows, origin = { x: 0, y: 0 }, { tw = TW, th = TH } = {}) {
    this.tw = tw; this.th = th; this.cols = cols; this.rows = rows; this.ox = origin.x; this.oy = origin.y;
    this.blocked = new Set();
  }
  // punkt siatki (może być ułamkowy) na ekran
  toScreen(gx, gy) { return [this.ox + (gx - gy) * this.tw / 2, this.oy + (gx + gy) * this.th / 2]; }
  // ekran na punkt siatki (ułamkowy)
  toGrid(sx, sy) {
    const a = (sx - this.ox) / (this.tw / 2), b = (sy - this.oy) / (this.th / 2);
    return [(a + b) / 2, (b - a) / 2];
  }
  // komórka pod punktem ekranu albo null poza planszą
  cellAt(sx, sy) {
    const [gx, gy] = this.toGrid(sx, sy), x = Math.floor(gx), y = Math.floor(gy);
    return this.inBounds(x, y) ? { x, y } : null;
  }
  center(gx, gy) { return this.toScreen(gx + 0.5, gy + 0.5); }
  corners(gx, gy) { return [this.toScreen(gx, gy), this.toScreen(gx + 1, gy), this.toScreen(gx + 1, gy + 1), this.toScreen(gx, gy + 1)]; }
  inBounds(x, y) { return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.cols && y < this.rows; }
  key(x, y) { return y * this.cols + x; }
  block(x, y) { if (this.inBounds(x, y)) this.blocked.add(this.key(x, y)); }
  unblock(x, y) { this.blocked.delete(this.key(x, y)); }
  toggle(x, y) { if (!this.inBounds(x, y)) return; const k = this.key(x, y); if (this.blocked.has(k)) this.blocked.delete(k); else this.blocked.add(k); }
  blockCells(cells) { for (const c of cells) this.block(c.x, c.y); }
  isBlocked(x, y) { return !this.inBounds(x, y) || this.blocked.has(this.key(x, y)); }
  walkable(x, y) { return !this.isBlocked(x, y); }
  // sąsiedzi w 4 kierunkach, tylko wolne komórki
  neighbors(x, y) { return [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ x: x + dx, y: y + dy })).filter((c) => this.walkable(c.x, c.y)); }
  // ramka planszy na ekranie
  screenBounds() {
    const p = [this.toScreen(0, 0), this.toScreen(this.cols, 0), this.toScreen(this.cols, this.rows), this.toScreen(0, this.rows)];
    return { minX: Math.min(...p.map((q) => q[0])), maxX: Math.max(...p.map((q) => q[0])), minY: Math.min(...p.map((q) => q[1])), maxY: Math.max(...p.map((q) => q[1])) };
  }
}
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// klucz głębokości do sortowania rysowania: dalsze (mniejsze gx+gy) najpierw
export const depth = (gx, gy) => gx + gy;
export const byDepth = (a, b) => a.depth - b.depth || a.gx - b.gx;
