// Rysowanie świata: teren z wysokościami (kafel po kaflu, od tyłu do przodu), obiekty z podręcznych obrazków, postacie w kolejności głębokości.
// Rzut jest ten sam co w walce (IsoGrid, 2:1, kafel 72x36), wysokość to przesunięcie w górę o HZ pikseli na poziom.
import { IsoGrid } from '../grid.js';
import { N, HZ, CLIFF, WATER } from '../world/kraina.js';
import { heightAt } from '../world/nav.js';
import { hsl } from './color.js';
import { hash2 } from '../world/noise.js';
import { drawBuilding } from './buildings.js';
import { drawEntrance, genEntrance } from './entrances.js';
import * as NA from './nature.js';
import { lampPost, bench, barrel, crate, cart, sack } from './props.js';

export const MAXZ = 12;
export const makeGrid = () => new IsoGrid(N, N, { x: N * 36, y: MAXZ * HZ + 40 });
// kolory gruntu: [odcień, nasycenie, jasność] na rodzaj
const BASE = [[98, 0.5, 0.5], [88, 0.55, 0.56], [128, 0.34, 0.32], [62, 0.4, 0.46], [32, 0.08, 0.44], [38, 0.42, 0.62], [40, 0.1, 0.55], [48, 0.45, 0.68], [205, 0.5, 0.42], [30, 0.3, 0.3]];

const NATURE = { oak: NA.oak, pine: NA.pine, birch: NA.birch, dead: NA.deadTree, bush: NA.bush, rock: NA.rock, flowers: NA.flowers, mushrooms: NA.mushrooms, stump: NA.stump };
const PROP = { lamp: (g, x, y) => lampPost(g, x, y, 1), bench: (g, x, y) => bench(g, x, y, 1), barrel: (g, x, y, s) => barrel(g, x, y, 1, s), crate: (g, x, y, s) => crate(g, x, y, 1, s), cart: (g, x, y, s) => cart(g, x, y, 1, s), sack: (g, x, y) => sack(g, x, y, 1) };
// rozmiar obrazka i punkt zaczepienia (podstawa obiektu) w jednostkach świata
const SPR = { default: [150, 170, 75, 140], oak: [150, 170, 75, 140], pine: [130, 170, 65, 150], birch: [120, 170, 60, 150], dead: [120, 160, 60, 135], rock: [90, 70, 45, 52], bush: [90, 70, 45, 52], flowers: [70, 50, 35, 38], mushrooms: [70, 50, 35, 38], stump: [60, 50, 30, 40], lamp: [60, 130, 30, 118], bench: [90, 60, 45, 48], barrel: [60, 60, 30, 50], crate: [60, 60, 30, 50], cart: [140, 100, 70, 80], sack: [60, 50, 30, 42], krypta: [300, 240, 150, 180], jama: [330, 330, 165, 290], budynek: [420, 460, 210, 380] };

export class WorldView {
  constructor(world, deps = {}) {
    this.w = world; this.grid = makeGrid(); this.sprites = new Map(); this.sprScale = 0; this.colors = new Map(); this.doc = deps.document || (typeof document !== 'undefined' ? document : null);
    this.entSpecs = world.entrances.map((e, i) => genEntrance(i + 3, e.kind));
    this.bld = new Map(); world.buildings.forEach((b, i) => { const k = (b.sy - 1) * N + (b.sx - 1); (this.bld.get(k) || this.bld.set(k, []).get(k)).push(b); });
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
  tileColor(x, y) {
    const k = y * N + x, hit = this.colors.get(k); if (hit) return hit;
    const w = this.w, H = w.heights, W1 = N + 1, c = [H[y * W1 + x], H[y * W1 + x + 1], H[(y + 1) * W1 + x + 1], H[(y + 1) * W1 + x]];
    const mn = Math.min(...c), mx = Math.max(...c), dx = (c[1] + c[2] - c[0] - c[3]) / 2, dy = (c[3] + c[2] - c[0] - c[1]) / 2, kind = w.cellKind[k];
    const b = BASE[kind] || BASE[0], v = hash2(7, x, y), v2 = hash2(8, x >> 1, y >> 1);
    let l = b[2] + (v - 0.5) * 0.05 + (v2 - 0.5) * 0.04 + (0.2 * dx - 0.07 * dy) * 0.9, s = b[1], h = b[0] + (v2 - 0.5) * 8;
    if (kind === 8) { l -= 0.12; }
    const fill = hsl(h, s, Math.max(0.12, Math.min(0.85, l))), rec = { fill, dark: hsl(h + 6, Math.min(0.7, s + 0.1), Math.max(0.1, l - 0.16)), tufts: (kind <= 2 && v < 0.4 && mx - mn < CLIFF * 0.75) ? 0.8 + v : 0, rock: kind === 4, steep: mx - mn > CLIFF * 0.75, water: mn < WATER && kind === 8, wl: 0, mn };
    this.colors.set(k, rec); return rec;
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
    if (c) g.drawImage(c, x - dim[2], y - dim[3], dim[0], dim[1]); else { g.save(); g.translate(x - dim[2] + dim[2], y - dim[3] + dim[3]); draw(g, 0, 0); g.restore(); }
  }
  // cały świat widoczny w oknie (cam: środek w px świata, view: {w,h} w px css, zoom)
  draw(g, cam, view, zoom, dpr, t, entities = []) {
    const w = this.w, W1 = N + 1, H = w.heights, grid = this.grid, scale = zoom * dpr;
    const hw = view.w / 2 / zoom, hh = view.h / 2 / zoom, L = cam.x - hw - 40, R = cam.x + hw + 40, T = cam.y - hh - 60, B = cam.y + hh + MAXZ * HZ + 20;
    const cs = [grid.toGrid(L, T), grid.toGrid(R, T), grid.toGrid(R, B), grid.toGrid(L, B)];
    const x0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[0])))), x1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[0])))), y0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[1])))), y1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[1]))));
    const ents = new Map(); for (const e of entities) { const k = Math.floor(e.y) * N + Math.floor(e.x); (ents.get(k) || ents.set(k, []).get(k)).push(e); }
    const lineW = 1.1 / zoom;
    for (let d = x0 + y0; d <= x1 + y1; d++) {
      for (let x = Math.max(x0, d - y1); x <= Math.min(x1, d - y0); x++) {
        const y = d - x, k = y * N + x, col = this.tileColor(x, y);
        const h0 = H[y * W1 + x], h1 = H[y * W1 + x + 1], h2 = H[(y + 1) * W1 + x + 1], h3 = H[(y + 1) * W1 + x];
        const p0 = this.proj(x, y, h0), p1 = this.proj(x + 1, y, h1), p2 = this.proj(x + 1, y + 1, h2), p3 = this.proj(x, y + 1, h3);
        if (Math.max(p1[1], p2[1], p3[1]) < T - 40 || Math.min(p0[1], p1[1], p3[1]) > B + 280 || p1[0] < L - 130 || p3[0] > R + 130) continue;   // poza ekranem (obiekty wystają w górę, więc dół ma zapas)
        { const e = 0.7 / zoom, cx = (p0[0] + p2[0]) / 2, cy = (p0[1] + p2[1]) / 2; g.beginPath(); g.moveTo(p0[0], p0[1] - e); g.lineTo(p1[0] + e, p1[1]); g.lineTo(p2[0], p2[1] + e); g.lineTo(p3[0] - e, p3[1]); g.closePath(); g.fillStyle = col.fill; g.fill(); }
        if (col.tufts) { const cx = (p0[0] + p2[0]) / 2, cy = (p0[1] + p2[1]) / 2, v = col.tufts; g.strokeStyle = col.dark; g.lineWidth = 1.3 / zoom; g.beginPath(); for (let i = 0; i < 2; i++) { const ox = (hash2(11 + i, x, y) - 0.5) * 36, oy = (hash2(14 + i, x, y) - 0.5) * 12; g.moveTo(cx + ox - 2, cy + oy); g.lineTo(cx + ox - 3, cy + oy - 6 * v); g.moveTo(cx + ox, cy + oy); g.lineTo(cx + ox, cy + oy - 7 * v); g.moveTo(cx + ox + 2, cy + oy); g.lineTo(cx + ox + 3.5, cy + oy - 6 * v); } g.stroke(); }
        if (col.steep) { g.strokeStyle = 'rgba(30,22,16,.35)'; g.lineWidth = 1 / zoom; for (let i = 1; i < 4; i++) { const f = i / 4; g.beginPath(); g.moveTo(p0[0] + (p3[0] - p0[0]) * f, p0[1] + (p3[1] - p0[1]) * f); g.lineTo(p1[0] + (p2[0] - p1[0]) * f, p1[1] + (p2[1] - p1[1]) * f); g.stroke(); } }
        if (col.water) {
          const q0 = this.proj(x, y, WATER), q1 = this.proj(x + 1, y, WATER), q2 = this.proj(x + 1, y + 1, WATER), q3 = this.proj(x, y + 1, WATER), depth = Math.min(1, (WATER - col.mn) / 1.3);
          g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.lineTo(q2[0], q2[1]); g.lineTo(q3[0], q3[1]); g.closePath(); g.fillStyle = `rgba(${52 - depth * 22},${120 - depth * 40},${170 - depth * 40},${0.62 + depth * 0.3})`; g.fill();
          if (hash2(3, x, y) < 0.35) { const ph = (t * 0.6 + hash2(4, x, y) * 6) % 1, cx = (q0[0] + q2[0]) / 2, cy = (q0[1] + q2[1]) / 2; g.strokeStyle = `rgba(255,255,255,${0.28 * Math.sin(ph * Math.PI)})`; g.lineWidth = 1.4 / zoom; g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx + 8, cy); g.stroke(); }
        }
        // obiekty na kaflu
        const objs = w.byTile.get(k);
        if (objs) for (const o of objs) {
          const [sx, sy] = this.pos(o.x, o.y), key = `${o.k}:${o.seed % 6}:${o.biome || ''}`;
          if (sx < L - 100 || sx > R + 100) continue;
          const f = NATURE[o.k] ? (gg, ax, ay) => NATURE[o.k](gg, ax, ay, o.seed % 6 + 1, { biome: o.biome }) : PROP[o.k] ? (gg, ax, ay) => PROP[o.k](gg, ax, ay, o.seed % 6 + 1) : null;
          if (f) this.drawSprite(g, key, SPR[o.k] || SPR.default, f, sx, sy, scale);
        }
        const bl = this.bld.get(k); if (bl) for (const b of bl) { const [sx, sy] = this.proj(b.sx, b.sy, heightAt(w, b.sx - 0.5, b.sy - 0.5)); this.drawSprite(g, `b:${b.s.seed}`, SPR.budynek, (gg, ax, ay) => drawBuilding(gg, ax, ay, b.s), sx, sy, scale); }
        const en = this.ent.get(k); if (en) for (const i of en) { const e = w.entrances[i], [sx, sy] = this.pos(e.at[0], e.at[1]); this.drawSprite(g, `e:${i}`, SPR[e.kind], (gg, ax, ay) => drawEntrance(gg, ax, ay, this.entSpecs[i]), sx, sy, scale); }
        const es = ents.get(k); if (es) for (const e of es) e.draw(g, ...this.pos(e.x, e.y));
      }
    }
  }
}
