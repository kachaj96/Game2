// Siatka izometryczna map v3: prawdziwa izometria (30 stopni), kafel 72 x 42 j, poziom wysokości = 42 j (mapy/SPEC.md).
// Czysta logika, bez DOM. Punkt siatki (x,y) leży w rogu kafli; kafel (cx,cy) zajmuje [cx,cx+1] x [cy,cy+1].
export const TW = 72, TH = 42, LEVEL = 42;

export class Iso {
  // origin: położenie punktu siatki (0,0) w jednostkach ekranu; size: prostokąt mapy w j (obraz podłoża / 2 dla pliku 2x)
  constructor({ ox = 0, oy = 0, w = 768, h = 512 } = {}) { this.ox = ox; this.oy = oy; this.w = w; this.h = h; }
  toScreen(x, y, z = 0) { return [this.ox + (x - y) * TW / 2, this.oy + (x + y) * TH / 2 - z * LEVEL]; }
  toGrid(sx, sy, z = 0) { const u = (sx - this.ox) / (TW / 2), v = (sy - this.oy + z * LEVEL) / (TH / 2); return [(u + v) / 2, (v - u) / 2]; }
  cellAt(sx, sy, z = 0) { const [x, y] = this.toGrid(sx, sy, z); return [Math.floor(x), Math.floor(y)]; }
  center(cx, cy, z = 0) { return this.toScreen(cx + 0.5, cy + 0.5, z); }
  inside(cx, cy) { const [sx, sy] = this.center(cx, cy); return sx >= 0 && sx <= this.w && sy >= 0 && sy <= this.h; }   // siatka przycięta do prostokąta, jak w Dofusie
  cells() {
    const out = [], R = Math.ceil((this.w + this.h) / 18);
    for (let cy = -R; cy <= R; cy++) for (let cx = -R; cx <= R; cx++) if (this.inside(cx, cy)) out.push([cx, cy]);
    return out;
  }
}

// komórki odcisku obiektu: róg S (przedni dolny) w punkcie siatki (sx,sy), odcisk w x d kafli leży "za nim"
export const footprintCells = (sx, sy, w, d) => { const out = []; for (let cx = sx - w; cx < sx; cx++) for (let cy = sy - d; cy < sy; cy++) out.push([cx, cy]); return out; };

// klucz sortowania głębi: im większy, tym bliżej widza (przedni róg odcisku), potem poziom, potem x; bohater to odcisk 0 x 0 w swoim punkcie
export const depthKey = (o) => [o.x + o.y + (o.bias || 0), o.z || 0, o.x];
export const byDepth = (a, b) => { const A = depthKey(a), B = depthKey(b); return A[0] - B[0] || A[1] - B[1] || A[2] - B[2]; };
