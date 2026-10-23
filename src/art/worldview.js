// Rysowanie świata. Teren jest pieczony w bloki 6 x 6 kafli z gładkim, ciągłym kolorowaniem (bez kafli i schodków), a obiekty, budynki
// i postacie rysujemy po kolei od tyłu do przodu, blok po bloku. Rzut jest ten sam co w walce (IsoGrid, 2:1, kafel 72x36),
// wysokość to przesunięcie w górę o HZ pikseli na poziom.
import { IsoGrid } from '../grid.js';
import { N, HZ } from '../world/kraina.js';
import { heightAt } from '../world/nav.js';
import { groundColor } from './groundcolor.js';
import { drawBuilding } from './buildings.js';
import { drawEntrance, genEntrance } from './entrances.js';
import { genTree, drawTree } from './trees.js';
import * as NA from './nature.js';
import { lampPost, bench, barrel, crate, cart, sack, logs } from './props.js';

export const MAXZ = 14, CS = 6, SUB = 8;
const BAKE = 1.0;   // teren pieczemy w niższej rozdzielczości i rysujemy z wygładzaniem: miękkie, malarskie przejścia
export const makeGrid = () => new IsoGrid(N, N, { x: N * 36, y: MAXZ * HZ + 60 });

const TREE = { oak: 1, pine: 1, birch: 1, dead: 1, swamp: 1 };
const SMALL = { bush: (g, x, y, sc, s, o) => NA.bush(g, x, y, s, { biome: o.biome, sc: sc * 0.62 }), rock: (g, x, y, sc, s) => NA.rock(g, x, y, s, { sc: sc * 1.15 }), flowers: (g, x, y, sc, s) => NA.flowers(g, x, y, s, { sc: 0.8 }), mushrooms: (g, x, y, sc, s) => NA.mushrooms(g, x, y, s, { sc: 1.1 }), stump: (g, x, y, sc, s) => NA.stump(g, x, y, s, { sc: 1.1 }) };
const PROP = { lamp: (g, x, y) => lampPost(g, x, y, 1.35), bench: (g, x, y) => bench(g, x, y, 1.25), barrel: (g, x, y, s) => barrel(g, x, y, 1.1, s), crate: (g, x, y, s) => crate(g, x, y, 1.1, s), cart: (g, x, y, s) => cart(g, x, y, 1.2, s), sack: (g, x, y) => sack(g, x, y, 1.1), logs: (g, x, y) => logs(g, x, y, 1.2) };
// rozmiar obrazka i punkt zaczepienia (podstawa obiektu) w jednostkach świata
const SPR = { oak: [290, 300, 145, 268], swamp: [320, 320, 160, 282], pine: [210, 310, 105, 282], birch: [220, 300, 110, 272], dead: [220, 240, 110, 214], bush: [110, 80, 55, 62], rock: [170, 120, 85, 96], flowers: [80, 60, 40, 46], mushrooms: [80, 60, 40, 46], stump: [80, 70, 40, 56], lamp: [90, 190, 45, 176], bench: [130, 90, 65, 70], barrel: [90, 90, 45, 74], crate: [90, 90, 45, 74], cart: [190, 140, 95, 108], sack: [80, 70, 40, 54], logs: [140, 90, 70, 70], krypta: [640, 460, 320, 360], jama: [420, 470, 210, 380], budynek: [700, 700, 350, 560] };

export class WorldView {
  constructor(world, deps = {}) {
    this.w = world; this.grid = makeGrid(); this.sprites = new Map(); this.sprScale = 0; this.chunks = new Map(); this.chunkScale = 0; this.doc = deps.document || (typeof document !== 'undefined' ? document : null);
    this.entSpecs = world.entrances.map((e, i) => genEntrance(i + 3, e.kind)); this.baked = 0;
    this.bld = new Map(); world.buildings.forEach((b) => { const k = (b.sy - 1) * N + (b.sx - 1); (this.bld.get(k) || this.bld.set(k, []).get(k)).push(b); });
    this.ent = new Map(); world.entrances.forEach((e, i) => { const k = Math.floor(e.at[1]) * N + Math.floor(e.at[0]); (this.ent.get(k) || this.ent.set(k, []).get(k)).push(i); });
  }
  // ekran (px świata) punktu siatki na wysokości z
  proj(x, y, z = 0) { const p = this.grid.toScreen(x, y); p[1] -= z * HZ; return p; }
  pos(x, y) { return this.proj(x, y, heightAt(this.w, x, y)); }
  // punkt ekranu na punkt gruntu: wysokość zależy od położenia, więc iterujemy
  unproject(wx, wy) {
    let z = 0, gx = 0, gy = 0;
    for (let i = 0; i < 7; i++) { [gx, gy] = this.grid.toGrid(wx, wy + z * HZ); z = heightAt(this.w, gx, gy); }
    return [gx, gy];
  }
  // blok terenu: wszystkie kafle bloku jako jeden obraz, każdy kafel dzielony na SUB x SUB pól o ciągłym kolorze
  bakeChunk(cx, cy, scale, ctx2d) {
    const w = this.w, x0 = cx * CS, y0 = cy * CS, x1 = Math.min(N, x0 + CS), y1 = Math.min(N, y0 + CS), W1 = N + 1;
    let zmin = 99, zmax = -99; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const h = w.heights[y * W1 + x]; zmin = Math.min(zmin, h); zmax = Math.max(zmax, h); }
    const gr = this.grid, X0 = gr.ox + (x0 - y1) * 36 - 6, X1 = gr.ox + (x1 - y0) * 36 + 6, Y0 = gr.oy + (x0 + y0) * 18 - zmax * HZ - 6, Y1 = gr.oy + (x1 + y1) * 18 - zmin * HZ + 6;
    let g = ctx2d, canvas = null;
    if (!g && this.doc) { canvas = this.doc.createElement('canvas'); canvas.width = Math.ceil((X1 - X0) * scale * BAKE); canvas.height = Math.ceil((Y1 - Y0) * scale * BAKE); g = canvas.getContext('2d'); }
    if (!g) return null;
    g.save(); g.scale(scale * BAKE, scale * BAKE); g.translate(-X0, -Y0);
    const e = 0.9;   // lekkie nachodzenie pól, żeby nie było szwów
    for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) for (let j = 0; j < SUB; j++) for (let i = 0; i < SUB; i++) {
      const u0 = i / SUB, u1 = (i + 1) / SUB, v0 = j / SUB, v1 = (j + 1) / SUB;
      const a = this.proj(tx + u0, ty + v0, heightAt(w, tx + u0, ty + v0)), b = this.proj(tx + u1, ty + v0, heightAt(w, tx + u1, ty + v0)), c = this.proj(tx + u1, ty + v1, heightAt(w, tx + u1, ty + v1)), d = this.proj(tx + u0, ty + v1, heightAt(w, tx + u0, ty + v1));
      g.fillStyle = groundColor(w, tx + (u0 + u1) / 2, ty + (v0 + v1) / 2);
      g.beginPath(); g.moveTo(a[0], a[1] - e); g.lineTo(b[0] + e, b[1]); g.lineTo(c[0], c[1] + e); g.lineTo(d[0] - e, d[1]); g.closePath(); g.fill();
    }
    g.restore(); this.baked++;
    return { canvas, X0, Y0, w: X1 - X0, h: Y1 - Y0 };
  }
  chunk(cx, cy, scale, budget) {
    if (Math.abs(scale - this.chunkScale) > this.chunkScale * 0.08) { this.chunks.clear(); this.chunkScale = scale; }
    const key = cy * 1000 + cx; let c = this.chunks.get(key);
    if (!c && budget.n > 0) { budget.n--; c = this.bakeChunk(cx, cy, scale); if (c) this.chunks.set(key, c); }
    return c;
  }
  // obrazek obiektu: rysowany raz w skali ekranu i potem tylko kopiowany
  sprite(key, [sw, sh, ax, ay], draw, scale) {
    if (!this.doc) return null;
    if (Math.abs(scale - this.sprScale) > this.sprScale * 0.08) { this.sprites.clear(); this.sprScale = scale; }
    let c = this.sprites.get(key);
    if (!c) { c = this.doc.createElement('canvas'); c.width = Math.ceil(sw * this.sprScale); c.height = Math.ceil(sh * this.sprScale); const g = c.getContext('2d'); g.scale(this.sprScale, this.sprScale); draw(g, ax, ay); this.sprites.set(key, c); }
    return c;
  }
  drawSprite(g, key, dim, draw, x, y, scale) {
    const c = this.sprite(key, dim, draw, scale);
    if (c) g.drawImage(c, x - dim[2], y - dim[3], dim[0], dim[1]); else { g.save(); g.translate(x, y); draw(g, 0, 0); g.restore(); }
  }
  objectDrawer(o) {
    const sd = o.seed % 7 + 1;
    if (TREE[o.k]) { const spec = genTree(sd, o.k, o.biome || 'summer'); return [`${o.k}:${sd}:${o.biome || ''}`, SPR[o.k], (gg, ax, ay) => drawTree(gg, ax, ay, spec)]; }
    if (SMALL[o.k]) { const sc = o.sc || 1; return [`${o.k}:${sd}:${o.biome || ''}:${Math.round(sc * 4)}`, SPR[o.k], (gg, ax, ay) => SMALL[o.k](gg, ax, ay, sc, sd, o)]; }
    if (PROP[o.k]) return [`${o.k}:${sd}`, SPR[o.k], (gg, ax, ay) => PROP[o.k](gg, ax, ay, sd)];
    return null;
  }
  // cały świat widoczny w oknie (cam: środek w px świata, view: {w,h} w px css, zoom)
  draw(g, cam, view, zoom, dpr, t, entities = []) {
    const w = this.w, grid = this.grid, scale = zoom * dpr;
    const hw = view.w / 2 / zoom, hh = view.h / 2 / zoom, L = cam.x - hw - 40, R = cam.x + hw + 40, T = cam.y - hh - 60, B = cam.y + hh + MAXZ * HZ + 20;
    const cs = [grid.toGrid(L, T), grid.toGrid(R, T), grid.toGrid(R, B + 320), grid.toGrid(L, B + 320)];
    const gx0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[0])))), gx1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[0])))), gy0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[1])))), gy1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[1]))));
    const ents = new Map(); for (const e of entities) { const k = Math.floor(e.y) * N + Math.floor(e.x); (ents.get(k) || ents.set(k, []).get(k)).push(e); }
    const list = []; for (let cy = Math.floor(gy0 / CS); cy <= Math.floor(gy1 / CS); cy++) for (let cx = Math.floor(gx0 / CS); cx <= Math.floor(gx1 / CS); cx++) list.push([cx, cy]);
    list.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
    const budget = { n: this.baked < 1 ? 999 : 4 };
    for (const [cx, cy] of list) {
      const ch = this.chunk(cx, cy, scale, budget);
      if (ch && ch.canvas) { if (ch.X0 > R + 100 || ch.X0 + ch.w < L - 100 || ch.Y0 > B + 340 || ch.Y0 + ch.h < T - 40) continue; g.drawImage(ch.canvas, ch.X0, ch.Y0, ch.w, ch.h); }
      const items = [];
      for (let ty = cy * CS; ty < Math.min(N, cy * CS + CS); ty++) for (let tx = cx * CS; tx < Math.min(N, cx * CS + CS); tx++) {
        const k = ty * N + tx;
        const objs = w.byTile.get(k); if (objs) for (const o of objs) items.push({ d: o.x + o.y, o });
        const bl = this.bld.get(k); if (bl) for (const b of bl) items.push({ d: b.sx + b.sy - 1, b });
        const en = this.ent.get(k); if (en) for (const i of en) items.push({ d: w.entrances[i].at[0] + w.entrances[i].at[1], en: i });
        const es = ents.get(k); if (es) for (const e of es) items.push({ d: e.x + e.y + 0.001, e });
      }
      items.sort((a, b) => a.d - b.d);
      for (const it of items) {
        if (it.o) { const o = it.o, [sx, sy] = this.pos(o.x, o.y); if (sx < L - 160 || sx > R + 160 || sy < T - 40 || sy > B + 340) continue; const dr = this.objectDrawer(o); if (dr) this.drawSprite(g, dr[0], dr[1], dr[2], sx, sy, scale); }
        else if (it.b) { const b = it.b, [sx, sy] = this.proj(b.sx, b.sy, heightAt(w, b.sx - 0.5, b.sy - 0.5)); this.drawSprite(g, `b:${b.s.seed}`, SPR.budynek, (gg, ax, ay) => { gg.save(); gg.translate(ax, ay); gg.scale(b.k, b.k); drawBuilding(gg, 0, 0, b.s); gg.restore(); }, sx, sy, scale); }
        else if (it.en !== undefined) { const i = it.en, e = w.entrances[i], [sx, sy] = this.pos(e.at[0], e.at[1]); this.drawSprite(g, `e:${i}`, SPR[e.kind], (gg, ax, ay) => drawEntrance(gg, ax, ay, this.entSpecs[i]), sx, sy, scale); }
        else it.e.draw(g, ...this.pos(it.e.x, it.e.y));
      }
    }
  }
}
