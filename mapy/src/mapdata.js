// Dane mapy v3 i logika: kolizja z odcisków obiektów, wysokości, wyjścia na krawędzi, A*, sortowanie rysowania.
import { Iso, footprintCells, byDepth } from './iso.js';

// def: { id, size:[w,h] w j, origin:[ox,oy], sprites:{id:{footprint:{w,d}, height, free?:[[cx,cy]...]}}, objects:[{sprite,x,y,z?}],
//        blocked:[[cx,cy]], levels:{'cx,cy':n}, ramps:[[cx,cy]], exits:[{cells:[[cx,cy]], to:{map,x,y}}], start:[cx,cy] }
export function buildMap(def) {
  const iso = new Iso({ ox: def.origin[0], oy: def.origin[1], w: def.size[0], h: def.size[1] });
  const key = (x, y) => x + ',' + y, cells = new Set(iso.cells().map(([x, y]) => key(x, y))), block = new Set(), ramp = new Set((def.ramps || []).map(([x, y]) => key(x, y)));
  for (const [x, y] of def.blocked || []) block.add(key(x, y));
  for (const o of def.objects || []) {
    const s = def.sprites[o.sprite]; if (!s) throw new Error('nieznany sprite ' + o.sprite);
    const free = new Set((s.free || []).map(([x, y]) => key(o.x + x, o.y + y)));   // wolne kafle odcisku (np. łuk bramy), względem rogu S
    for (const [cx, cy] of footprintCells(o.x, o.y, s.footprint.w, s.footprint.d)) if (!free.has(key(cx, cy))) block.add(key(cx, cy));
  }
  const level = (cx, cy) => (def.levels && def.levels[key(cx, cy)]) || 0;
  const exits = (def.exits || []).map((e) => ({ ...e, set: new Set(e.cells.map(([x, y]) => key(x, y))) }));
  const m = {
    def, iso, level,
    inMap: (cx, cy) => cells.has(key(cx, cy)),
    blocked: (cx, cy) => !cells.has(key(cx, cy)) || block.has(key(cx, cy)),
    // krok między sąsiednimi kaflami: zmiana poziomu o 1 tylko przez rampę, o 2 i więcej nigdy (klif)
    stepOk(ax, ay, bx, by) {
      if (m.blocked(bx, by)) return false;
      const dz = Math.abs(level(ax, ay) - level(bx, by));
      if (dz === 0) return true; if (dz >= 2) return false; return ramp.has(key(ax, ay)) || ramp.has(key(bx, by));
    },
    exitAt(cx, cy) { const e = exits.find((q) => q.set.has(key(cx, cy))); return e ? e.to : null; },
    // A* po 8 sąsiadach, bez cięcia rogów (przekątna tylko gdy oba sąsiednie kafle wolne)
    findPath(from, to) {
      if (m.blocked(to[0], to[1])) return null;
      const open = new Map([[key(...from), { p: from, g: 0, f: 0, prev: null }]]), closed = new Set(), h = (a) => Math.hypot(a[0] - to[0], a[1] - to[1]);
      while (open.size) {
        let cur = null; for (const n of open.values()) if (!cur || n.f < cur.f) cur = n;
        const ck = key(...cur.p); open.delete(ck); closed.add(ck);
        if (cur.p[0] === to[0] && cur.p[1] === to[1]) { const out = []; for (let n = cur; n; n = n.prev) out.push(n.p); return out.reverse(); }
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          if (!dx && !dy) continue; const nx = cur.p[0] + dx, ny = cur.p[1] + dy, nk = key(nx, ny);
          if (closed.has(nk) || !m.stepOk(cur.p[0], cur.p[1], nx, ny)) continue;
          if (dx && dy && (!m.stepOk(cur.p[0], cur.p[1], cur.p[0] + dx, cur.p[1]) || !m.stepOk(cur.p[0], cur.p[1], cur.p[0], cur.p[1] + dy))) continue;
          const g = cur.g + (dx && dy ? Math.SQRT2 : 1), ex = open.get(nk); if (ex && ex.g <= g) continue;
          open.set(nk, { p: [nx, ny], g, f: g + h([nx, ny]), prev: cur });
        }
      }
      return null;
    },
    // lista do narysowania w kolejności od najdalszych: obiekty mapy plus dodatkowe byty (bohater, NPC) z polami x, y, z
    drawOrder(extra = []) { return [...def.objects.map((o) => ({ ...o, kind: 'object' })), ...extra].sort(byDepth); },
  };
  return m;
}
