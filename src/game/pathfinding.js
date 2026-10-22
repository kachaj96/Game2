// Ścieżki po siatce: A* i zasięg ruchu. Bez przekątnych: kafel ma 4 sąsiadów, koszt jednego kroku to 1 punkt ruchu.
// `blocked` to zbiór kluczy komórek zajętych przez jednostki (ściany siatki są w samej siatce).
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // stała kolejność = deterministyczny wynik

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  less(i, j) { const p = this.a[i], q = this.a[j]; return p.f - q.f || p.h - q.h || p.seq - q.seq; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this.less(i, p) < 0) { [a[i], a[p]] = [a[p], a[i]]; i = p; } else break; } }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this.less(l, m) < 0) m = l; if (r < a.length && this.less(r, m) < 0) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
    return top;
  }
}

const open = (grid, x, y, blocked) => grid.walkable(x, y) && !blocked.has(grid.key(x, y));

// Najkrótsza ścieżka od `from` do `to`: tablica komórek bez startu, z celem. [] gdy start = cel, null gdy nie ma drogi.
export function findPath(grid, from, to, blocked = new Set()) {
  if (!open(grid, to.x, to.y, blocked)) return null;
  if (from.x === to.x && from.y === to.y) return [];
  const h = (x, y) => Math.abs(x - to.x) + Math.abs(y - to.y);
  const heap = new Heap(), g = new Map(), prev = new Map(), done = new Set(), sk = grid.key(from.x, from.y);
  g.set(sk, 0); heap.push({ x: from.x, y: from.y, f: h(from.x, from.y), h: h(from.x, from.y), seq: 0 });
  let seq = 1;
  while (heap.size) {
    const n = heap.pop(), k = grid.key(n.x, n.y);
    if (done.has(k)) continue; done.add(k);
    if (n.x === to.x && n.y === to.y) {
      const path = []; let c = k;
      while (c !== sk) { path.push({ x: c % grid.cols, y: Math.floor(c / grid.cols) }); c = prev.get(c); }
      return path.reverse();
    }
    for (const [dx, dy] of DIRS) {
      const x = n.x + dx, y = n.y + dy;
      if (!open(grid, x, y, blocked)) continue;
      const nk = grid.key(x, y), ng = g.get(k) + 1;
      if (g.has(nk) && g.get(nk) <= ng) continue;
      g.set(nk, ng); prev.set(nk, k); heap.push({ x, y, f: ng + h(x, y), h: h(x, y), seq: seq++ });
    }
  }
  return null;
}

// Wszystkie komórki osiągalne w `maxCost` krokach (bez startu): Map klucz -> {x,y,cost}.
export function reachable(grid, from, maxCost, blocked = new Set()) {
  const out = new Map(), seen = new Set([grid.key(from.x, from.y)]);
  let frontier = [{ x: from.x, y: from.y }];
  for (let cost = 1; cost <= maxCost && frontier.length; cost++) {
    const next = [];
    for (const c of frontier) for (const [dx, dy] of DIRS) {
      const x = c.x + dx, y = c.y + dy, k = grid.key(x, y);
      if (!open(grid, x, y, blocked) || seen.has(k)) continue;
      seen.add(k); out.set(k, { x, y, cost }); next.push({ x, y });
    }
    frontier = next;
  }
  return out;
}
