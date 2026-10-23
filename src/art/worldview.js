// Rysowanie świata. Teren jest pieczony w bloki 6 x 6 kafli z gładkim, ciągłym kolorowaniem (bez kafli i schodków), a obiekty, budynki
// i postacie rysujemy po kolei od tyłu do przodu, blok po bloku. Rzut jest ten sam co w walce (IsoGrid, 2:1, kafel 72x36),
// wysokość to przesunięcie w górę o HZ pikseli na poziom.
import { IsoGrid } from '../grid.js';
import { N, HZ } from '../world/kraina.js';
import { heightAt, tileZ } from '../world/nav.js';
import { groundRGB, hslRgb, rgbStr } from './groundcolor.js';
import { hash2 } from '../world/noise.js';
import { buildOccluders, sunShadow, canopyShade } from '../world/shadowmap.js';
import { drawBuilding } from './buildings.js';
import { drawEntrance, genEntrance } from './entrances.js';
import { genTree, drawTree } from './trees.js';
import * as NA from './nature.js';
import { ASSETS, loadAssets, drawAsset, assetDim } from './assets.js';
import { lampPost, bench, barrel, crate, cart, sack, logs, well, fence } from './props.js';

export const MAXZ = 8, CS = 6, SUB = 8, SHS = 12, SHB = 2, LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

export const makeGrid = () => new IsoGrid(N, N, { x: N * 36, y: MAXZ * HZ + 60 });

const TREE = { oak: 1, pine: 1, birch: 1, dead: 1, swamp: 1 };
const SMALL = { bush: (g, x, y, sc, s, o) => NA.bush(g, x, y, s, { biome: o.biome, sc: sc * 0.62 }), rock: (g, x, y, sc, s) => NA.rock(g, x, y, s, { sc: sc * 1.15 }), flowers: (g, x, y, sc, s) => NA.flowers(g, x, y, s, { sc: 0.8 }), mushrooms: (g, x, y, sc, s) => NA.mushrooms(g, x, y, s, { sc: 1.1 }), stump: (g, x, y, sc, s) => NA.stump(g, x, y, s, { sc: 1.1 }) };
const PROP = { lamp: (g, x, y) => lampPost(g, x, y, 1.35), bench: (g, x, y) => bench(g, x, y, 1.25), barrel: (g, x, y, s) => barrel(g, x, y, 1.1, s), crate: (g, x, y, s) => crate(g, x, y, 1.1, s), cart: (g, x, y, s) => cart(g, x, y, 1.2, s), sack: (g, x, y) => sack(g, x, y, 1.1), logs: (g, x, y) => logs(g, x, y, 1.2), well: (g, x, y, s) => well(g, x, y, 1.2, s), fence: (g, x, y, s, o) => fence(g, x, y, 1.2, s, o && o.dir) };
// rozmiar obrazka i punkt zaczepienia (podstawa obiektu) w jednostkach świata
const SPR = { oak: [290, 300, 145, 268], swamp: [320, 320, 160, 282], pine: [210, 310, 105, 282], birch: [220, 300, 110, 272], dead: [220, 240, 110, 214], bush: [110, 80, 55, 62], rock: [170, 120, 85, 96], flowers: [80, 60, 40, 46], mushrooms: [80, 60, 40, 46], stump: [80, 70, 40, 56], lamp: [90, 190, 45, 176], bench: [130, 90, 65, 70], barrel: [90, 90, 45, 74], crate: [90, 90, 45, 74], cart: [190, 140, 95, 108], sack: [80, 70, 40, 54], logs: [140, 90, 70, 70], well: [150, 170, 75, 136], fence: [100, 70, 50, 56], krypta: [800, 600, 400, 440], jama: [420, 470, 210, 380], budynek: [700, 700, 350, 560] };

export class WorldView {
  constructor(world, deps = {}) {
    this.w = world; this.grid = makeGrid(); this.sprLv = new Map(); this.chunkLv = new Map(); this.lvCur = 0; this.lvPrev = 0; this.sprBudget = 99; this.shadeCache = new Map(); this.quality = { shadowRes: SHS, decals: true }; this.doc = deps.document || (typeof document !== 'undefined' ? document : null);
    this.entSpecs = world.entrances.map((e, i) => genEntrance(i + 3, e.kind)); this.baked = 0; this.occ = buildOccluders(world); this.imgs = loadAssets(this.doc, () => { this._lamps = null; }); this.t = 0; this.masks = new Map(); world.buildings.forEach((b) => { b.s.noSmoke = true; }); this._lamps = null;
    this.bld = new Map(); world.buildings.forEach((b) => { const k = (b.sy - 1) * N + (b.sx - 1); (this.bld.get(k) || this.bld.set(k, []).get(k)).push(b); });
    this.ent = new Map(); world.entrances.forEach((e, i) => { const k = Math.floor(e.at[1]) * N + Math.floor(e.at[0]); (this.ent.get(k) || this.ent.set(k, []).get(k)).push(i); });
  }
  // ekran (px świata) punktu siatki na wysokości z
  proj(x, y, z = 0) { const p = this.grid.toScreen(x, y); p[1] -= z * HZ; return p; }
  pos(x, y) { return this.proj(x, y, heightAt(this.w, x, y)); }
  // punkt ekranu na punkt gruntu: szukamy od najwyższego poziomu w dół pierwszej powierzchni, która leży na linii patrzenia
  unproject(wx, wy) {
    let gx = 0, gy = 0;
    for (let z = 8; z >= -5; z -= 0.125) { [gx, gy] = this.grid.toGrid(wx, wy + z * HZ); if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue; if (heightAt(this.w, gx, gy) >= z - 0.01) return [gx, gy]; }
    return this.grid.toGrid(wx, wy);
  }
  // narożniki kafla (z) w kolejności (x,y), (x+1,y), (x+1,y+1), (x,y+1)
  cornersZ(tx, ty) { const w = this.w; return [tileZ(w, tx, ty, 0, 0), tileZ(w, tx, ty, 1, 0), tileZ(w, tx, ty, 1, 1), tileZ(w, tx, ty, 0, 1)]; }
  // blok terenu: powierzchnie płaskie i pochylnie, ściany skalne z trawiastą krawędzią, woda; jeden obraz na blok
  bakeChunk(cx, cy, scale, ctx2d) {
    const w = this.w, x0 = cx * CS, y0 = cy * CS, x1 = Math.min(N, x0 + CS), y1 = Math.min(N, y0 + CS);
    let zmin = 99, zmax = -99; for (let y = y0; y <= Math.min(N - 1, y1); y++) for (let x = x0; x <= Math.min(N - 1, x1); x++) { const L = w.lvl[y * N + x]; zmin = Math.min(zmin, L); zmax = Math.max(zmax, L + 1); }
    const gr = this.grid, X0 = gr.ox + (x0 - y1) * 36 - 8, X1 = gr.ox + (x1 - y0) * 36 + 8, Y0 = gr.oy + (x0 + y0) * 18 - zmax * HZ - 10, Y1 = gr.oy + (x1 + y1) * 18 - zmin * HZ + 10;
    let g = ctx2d, canvas = null;
    if (!g && this.doc) { canvas = this.doc.createElement('canvas'); canvas.width = Math.ceil((X1 - X0) * scale); canvas.height = Math.ceil((Y1 - Y0) * scale); g = canvas.getContext('2d'); }
    if (!g) return null;
    g.save(); g.scale(scale, scale); g.translate(-X0, -Y0);
    { const ck = cy * 1000 + cx + ':' + this.quality.shadowRes; this.sg = this.shadeCache.get(ck) || this.shadeGrid(x0, y0); this.shadeCache.set(ck, this.sg); }
    const tiles = []; for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) tiles.push([tx, ty]); tiles.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
    for (const [tx, ty] of tiles) this.drawTile(g, tx, ty);
    g.restore(); this.baked++;
    return { canvas, X0, Y0, w: X1 - X0, h: Y1 - Y0 };
  }
  // mapa cieni bloku: próbki 4 x 4 na kafel (z ramką 1), liczone raz przy pieczeniu; cień rzucają teren, drzewa, budynki, a pod koronami jest półcień
  shadeGrid(x0, y0) {
    const S = this.quality.shadowRes, B = SHB, n = CS * S + 2 * B, arr = new Float32Array(n * n), w = this.w;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const px = x0 + (i - B + 0.5) / S, py = y0 + (j - B + 0.5) / S; if (px < 0 || py < 0 || px >= N || py >= N) continue;
      const kind = w.cellKind[Math.floor(py) * N + Math.floor(px)]; if (kind === w.KIND.water || kind === w.KIND.chasm) continue;
      const z = heightAt(w, px, py), sun = sunShadow(w, this.occ, px, py, z), can = canopyShade(w, this.occ, px, py, 5);
      arr[j * n + i] = Math.min(0.58, 0.5 * sun + 0.4 * can);
    }
    // rozmycie 5 x 5 (trójkątne wagi 1 2 3 2 1): miękki półcień zamiast schodków
    const K = [1, 2, 3, 2, 1], tmp = new Float32Array(n * n), bl = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 2; i < n - 2; i++) { let v = 0; for (let d = -2; d <= 2; d++) v += arr[j * n + i + d] * K[d + 2]; tmp[j * n + i] = v / 9; }
    for (let j = 2; j < n - 2; j++) for (let i = 0; i < n; i++) { let v = 0; for (let d = -2; d <= 2; d++) v += tmp[(j + d) * n + i] * K[d + 2]; bl[j * n + i] = v / 9; }
    return { x0, y0, n, arr, bl, S };
  }
  // detale gruntu: kocie łby na placu, kamienie i koleiny na drogach, kwiaty, koniczyna, paprocie, kamyki i źdźbła na brzegach ścieżek
  drawDecals(g, tx, ty, z0, kind, ts, TINT) {
    const w = this.w, K = w.KIND, P = (u, v) => this.proj(tx + u, ty + v, z0), h = (a, b = 0) => hash2(a * 7 + 3, tx * 13 + b, ty * 17 + b * 5);
    const dk = (c) => rgbStr(ts > 0.02 ? [c[0] + (TINT[0] - c[0]) * ts, c[1] + (TINT[1] - c[1]) * ts, c[2] + (TINT[2] - c[2]) * ts] : c);
    const stone = (u, v, r, col, hi, sd) => {
      const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = r * (0.82 + 0.36 * hash2(sd + i, tx * 5 + Math.round(u * 100), ty * 3 + Math.round(v * 100))); pts.push(P(u + Math.cos(a) * rr, v + Math.sin(a) * rr)); }
      const path = (dy) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1] + dy); for (let i = 1; i < 8; i++) g.lineTo(pts[i][0], pts[i][1] + dy); g.closePath(); };
      path(1.6); g.fillStyle = dk([col[0] * 0.55, col[1] * 0.52, col[2] * 0.5]); g.fill();   // bok kamienia
      path(0); g.fillStyle = dk(col); g.fill();
      if (hi) { path(-0.1); g.strokeStyle = dk([Math.min(255, col[0] + 38), Math.min(255, col[1] + 36), Math.min(255, col[2] + 30)]); g.lineWidth = 0.9; g.stroke(); }
    };
    const near = (dx, dy) => { const nx = tx + dx, ny = ty + dy; return nx < 0 || ny < 0 || nx >= N || ny >= N ? -1 : w.cellKind[ny * N + nx]; };
    if (kind === K.shallow || kind === K.water) {
      // kamyki na dnie widoczne przez wodę: w brodzie gęściej, w głębokiej wodzie tylko przy brzegu
      let shore = kind === K.shallow; if (!shore) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = near(dx, dy); if (nk >= 0 && nk !== K.water && nk !== K.shallow && nk !== K.chasm) shore = true; }
      if (shore && this.quality.decals) { g.save(); g.globalAlpha = kind === K.shallow ? 0.42 : 0.28; const n = kind === K.shallow ? 3 : 2; for (let q = 0; q < n; q++) stone(0.12 + 0.76 * h(300 + q), 0.12 + 0.76 * h(310 + q), 0.05 + 0.06 * h(320 + q), [132 + 30 * h(330 + q), 150 + 24 * h(330 + q), 150 + 24 * h(330 + q)], false, 340 + q); g.restore(); }
      return;
    }
    if (kind === K.plaza) {
      // kocie łby: zaprawa jest już w tle, na niej 3 x 3 kamienie o różnych odcieniach
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const sd = i * 3 + j, u = (i + 0.5 + (h(sd, 1) - 0.5) * 0.3) / 3, v = (j + 0.5 + (h(sd, 2) - 0.5) * 0.3) / 3, t = h(sd, 3), c = [150 + 46 * t + 10 * h(sd, 4), 142 + 42 * t, 124 + 36 * t - 8 * h(sd, 5)]; stone(u, v, 0.15 + 0.035 * h(sd, 6), c, true, 50 + sd); }
      return;
    }
    if (kind === K.road) {
      for (let q = 0; q < 3; q++) if (h(10 + q) < 0.7) stone(0.14 + 0.72 * h(20 + q), 0.14 + 0.72 * h(30 + q), 0.05 + 0.05 * h(40 + q), [176 + 40 * h(50 + q), 156 + 34 * h(50 + q), 120 + 26 * h(50 + q)], true, 70 + q);
      for (let q = 0; q < 6; q++) { const p = P(0.08 + 0.84 * h(60 + q), 0.08 + 0.84 * h(70 + q)); g.fillStyle = dk([120 + 50 * h(80 + q), 98 + 40 * h(80 + q), 70 + 30 * h(80 + q)]); g.beginPath(); g.ellipse(p[0], p[1], 1.6, 0.9, 0, 0, 7); g.fill(); }
      // koleiny: dwie ciemniejsze smugi wzdłuż drogi
      if (h(90) < 0.55) { const u = 0.3 + 0.4 * h(91), a = P(u, 0.05), b = P(u + 0.08, 0.95); g.strokeStyle = dk([100, 80, 56]); g.globalAlpha = 0.35; g.lineWidth = 2.2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.globalAlpha = 1; }
      // brzeg: trawa wchodzi na drogę
      for (const [dx, dy, ed] of [[1, 0, 1], [-1, 0, 0], [0, 1, 1], [0, -1, 0]]) { const nk = near(dx, dy); if (nk < 0 || nk > K.moss) continue; g.lineCap = 'round'; g.lineWidth = 1.5; for (let q = 0; q < 4; q++) { const t = 0.1 + 0.8 * h(100 + q + (dx ? 0 : 10)), p = dx ? P(ed, t) : P(t, ed), bh = 4 + 4 * h(110 + q); g.strokeStyle = q % 2 ? '#5a9a3a' : '#8ac04a'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (h(120 + q) - 0.5) * 5, p[1] - bh); g.stroke(); } }
      return;
    }
    if (!this.quality.decals) return;
    if (kind <= K.moss || kind === K.dry) {
      const moss = kind === K.moss;
      // kępki liści (koniczyna i paproć) w dwóch odcieniach, żeby trawa nie była jednolitym dywanem
      for (let q = 0; q < 2; q++) if (h(130 + q) < 0.45) { const p = P(0.15 + 0.7 * h(140 + q), 0.15 + 0.7 * h(150 + q)), fern = h(160 + q) < 0.4, cols = moss ? ['#2c5a30', '#4a8a46'] : ['#3a8a30', '#7ac04a'];
        if (fern) { g.lineWidth = 1.3; g.lineCap = 'round'; for (let k = -3; k <= 3; k++) { g.strokeStyle = k % 2 ? cols[0] : cols[1]; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + k * 3, p[1] - 8, p[0] + k * 5.4, p[1] - 5 + Math.abs(k)); g.stroke(); } }
        else for (let k = 0; k < 3; k++) { g.fillStyle = dk(k % 2 ? [74, 140, 60] : [110, 176, 70]); g.beginPath(); g.ellipse(p[0] + (k - 1) * 3.2, p[1] - (k === 1 ? 2.6 : 0), 3, 2, 0, 0, 7); g.fill(); } }
      // kwiaty (tylko na łąkach, rzadziej w lesie)
      if (!moss && h(170) < 0.3) { const n = 1 + Math.floor(h(171) * 3), base = ['#fff6d0', '#ffd84a', '#f58ab0', '#b79af0', '#ffffff'][Math.floor(h(172) * 5)]; for (let k = 0; k < n; k++) { const p = P(0.15 + 0.7 * h(173 + k), 0.15 + 0.7 * h(180 + k)); g.fillStyle = dk([60, 110, 50]); g.fillRect(p[0] - 0.4, p[1] - 4, 0.8, 4); g.fillStyle = base; g.beginPath(); g.arc(p[0], p[1] - 5, 2, 0, 7); g.fill(); g.fillStyle = '#f0a820'; g.beginPath(); g.arc(p[0], p[1] - 5, 0.8, 0, 7); g.fill(); } }
      // kamyki
      if (h(190) < 0.16) stone(0.2 + 0.6 * h(191), 0.2 + 0.6 * h(192), 0.04 + 0.04 * h(193), [150 + 30 * h(194), 148 + 28 * h(194), 138 + 24 * h(194)], true, 200);
      // brzeg trawy przy drodze i placu: drobne źdźbła i kamyki wchodzą na ścieżkę
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = near(dx, dy); if (nk !== K.road && nk !== K.plaza && nk !== K.sand) continue; for (let q = 0; q < 3; q++) { const t = 0.12 + 0.76 * h(210 + q + (dx ? 0 : 7)), e = dx > 0 || dy > 0 ? 0.94 : 0.06, p = dx ? P(e, t) : P(t, e); if (h(220 + q) < 0.35) stone(dx ? e : t, dx ? t : e, 0.03, [168, 160, 140], false, 230 + q); else { g.strokeStyle = q % 2 ? '#4a8a30' : '#9ac84a'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (h(240 + q) - 0.5) * 4, p[1] - 5 - 3 * h(250 + q)); g.stroke(); } } }
    }
  }
  drawTile(g, tx, ty) {
    const w = this.w, k = ty * N + tx, z = this.cornersZ(tx, ty), P = (fx, fy, zz) => this.proj(tx + fx, ty + fy, zz), K = w.KIND, kind = w.cellKind[k];
    if (w.ramp[k]) return this.drawRamp(g, tx, ty, z);
    const e = 0.7, SUBN = SUB - 2, R = Math.max(1, Math.round(this.sg.S / SUBN)), sg = this.sg, sn = sg.n, six = (tx - sg.x0) * sg.S + SHB, siy = (ty - sg.y0) * sg.S + SHB, TINT = [22, 12, 52]; let tileShade = 0;
    const mix = (col, sh) => (sh > 0.01 ? rgbStr([col[0] + (TINT[0] - col[0]) * sh, col[1] + (TINT[1] - col[1]) * sh, col[2] + (TINT[2] - col[2]) * sh]) : rgbStr(col));
    const quad = (u0, v0, u1, v1, zz) => { const a = P(u0, v0, zz), b = P(u1, v0, zz), c = P(u1, v1, zz), d = P(u0, v1, zz); g.beginPath(); g.moveTo(a[0], a[1] - e); g.lineTo(b[0] + e, b[1]); g.lineTo(c[0], c[1] + e); g.lineTo(d[0] - e, d[1]); g.closePath(); g.fill(); };
    for (let j = 0; j < SUBN; j++) for (let i = 0; i < SUBN; i++) {
      const u0 = i / SUBN, u1 = (i + 1) / SUBN, v0 = j / SUBN, v1 = (j + 1) / SUBN, zz = z[0], col = groundRGB(w, tx + (u0 + u1) / 2, ty + (v0 + v1) / 2);
      // R x R próbek cienia na jeden kolorowy romb; gdy cień w nim niemal stały, jeden romb, a w półcieniu dzielimy dalej
      const sv = []; let lo = 9, hi = -9, sum = 0;
      for (let q = 0; q < R * R; q++) { const v = sg.bl[(siy + j * R + Math.floor(q / R)) * sn + six + i * R + (q % R)]; sv.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v; }
      tileShade += sum / (R * R);
      // granice rodzajów gruntu: gdy kolor wyraźnie się zmienia w obrębie rombu, dzielimy go na 4 (gładsze krawędzie dróg, trawy i piasku)
      const um = (u0 + u1) / 2, vm = (v0 + v1) / 2, cc = [groundRGB(w, tx + (u0 + um) / 2, ty + (v0 + vm) / 2), groundRGB(w, tx + (um + u1) / 2, ty + (v0 + vm) / 2), groundRGB(w, tx + (u0 + um) / 2, ty + (vm + v1) / 2), groundRGB(w, tx + (um + u1) / 2, ty + (vm + v1) / 2)];
      let dc = 0; for (const c4 of cc) dc = Math.max(dc, Math.abs(c4[0] - col[0]), Math.abs(c4[1] - col[1]), Math.abs(c4[2] - col[2]));
      if (dc > 14) { for (let q = 0; q < 4; q++) { const qi = q & 1, qj = q >> 1, shq = sg.bl[(siy + j * R + qj * (R >> 1) + (R >> 2)) * sn + six + i * R + qi * (R >> 1) + (R >> 2)]; g.fillStyle = mix(cc[q], shq); quad(qi ? um : u0, qj ? vm : v0, qi ? u1 : um, qj ? v1 : vm, zz); } continue; }
      if (hi - lo < 0.025) { g.fillStyle = mix(col, sum / (R * R)); quad(u0, v0, u1, v1, zz); continue; }
      for (let q = 0; q < R * R; q++) { const qi = q % R, qj = Math.floor(q / R); g.fillStyle = mix(col, sv[q]); quad(u0 + qi / (R * SUBN), v0 + qj / (R * SUBN), u0 + (qi + 1) / (R * SUBN), v0 + (qj + 1) / (R * SUBN), zz); }
    }
    tileShade /= SUBN * SUBN;
    // trawiaste kępki malarsko pokrywają równe powierzchnie
    if (kind <= K.moss || kind === K.dry) { let gc = kind === K.moss ? ['#2a4a2a', '#4a7a3a'] : ['#3a7a2a', '#8ab84a']; if (tileShade > 0.02) gc = gc.map((hx) => { const r = parseInt(hx.slice(1, 3), 16), gg2 = parseInt(hx.slice(3, 5), 16), bb = parseInt(hx.slice(5, 7), 16); return rgbStr([r + (TINT[0] - r) * tileShade, gg2 + (TINT[1] - gg2) * tileShade, bb + (TINT[2] - bb) * tileShade]); }); g.lineWidth = 1.4; g.lineCap = 'round';
      for (let t = 0; t < 5; t++) { const fx = 0.12 + 0.76 * hash2(21 + t, tx, ty), fy = 0.12 + 0.76 * hash2(31 + t, tx, ty), p = P(fx, fy, z[0]), h = 5 + 4 * hash2(41 + t, tx, ty); g.strokeStyle = t % 2 ? gc[0] : gc[1]; g.beginPath(); g.moveTo(p[0] - 2, p[1]); g.lineTo(p[0] - 3.5, p[1] - h); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - h - 2); g.moveTo(p[0] + 2, p[1]); g.lineTo(p[0] + 3.5, p[1] - h); g.stroke(); } }
    this.drawDecals(g, tx, ty, z[0], kind, tileShade, TINT);
    // ściany skalne po stronie widocznej (+x i +y), tam gdzie sąsiad jest niżej
    for (const [dx, dy, side] of [[1, 0, 'R'], [0, 1, 'L']]) {
      const nx = tx + dx, ny = ty + dy; if (nx >= N || ny >= N) continue;
      const nz = this.cornersZ(nx, ny);
      // wspólna krawędź: dla +x narożniki (1,0)-(1,1) kafla i (0,0)-(0,1) sąsiada; dla +y narożniki (0,1)-(1,1) i (0,0)-(1,0)
      const tA = dx ? z[1] : z[3], tB = dx ? z[2] : z[2], nA = dx ? nz[0] : nz[0], nB = dx ? nz[3] : nz[1];
      const ta = dx ? z[1] : z[3], tb = z[2], na = dx ? nz[0] : nz[0], nb = dx ? nz[3] : nz[1];
      if (ta - na < 0.15 && tb - nb < 0.15) continue;
      const A = dx ? P(1, 0, ta) : P(0, 1, ta), B = P(1, 1, tb);
      this.drawWall(g, A, B, Math.max(0, (ta - na)) * HZ, Math.max(0, (tb - nb)) * HZ, tx * 131 + ty * 17 + (dx ? 1 : 2), side, k, w.cellKind[ty * N + tx]);
    }
  }
  // pochylnia jako schody: kamienne stopnie z podstopniami, cieniem pod każdym i bocznymi policzkami (murkami)
  drawRamp(g, tx, ty, z) {
    const w = this.w, k = ty * N + tx, r = w.ramp[k], P = (fx, fy, zz) => this.proj(tx + fx, ty + fy, zz), L = w.lvl[k], S = 5, CH = 0.34, along = r <= 2;   // along: schody biegną wzdłuż osi x
    const pt = (t, c, zz) => (r === 1 ? P(t, c, zz) : r === 2 ? P(1 - t, c, zz) : r === 3 ? P(c, t, zz) : P(c, 1 - t, zz));
    const fill = (pts, col, stroke) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.2; g.stroke(); } };
    const stone = (l, sat = 0.2) => rgbStr(hslRgb(36, sat, l)), faceLit = along ? 0.6 : 0.46;
    // policzek: ściana wzdłuż schodów na krawędzi c (0 lub 1), jej wierzch idzie w górę razem ze stopniami
    const cheek = (c) => {
      const nx = along ? tx : tx + (c ? 1 : -1), ny = along ? ty + (c ? 1 : -1) : ty;   // sąsiedni kafel tych samych schodów: bez murku w środku
      if (nx >= 0 && ny >= 0 && nx < N && ny < N && w.ramp[ny * N + nx] === r && w.lvl[ny * N + nx] === L) return;
      const near = c === 1, out = near ? 1 : 0, inn = near ? 0.9 : 0.1;
      for (let i = 0; i < S; i++) {
        const t0 = i / S, t1 = (i + 1) / S, zb0 = L + t0, zb1 = L + t1, a = pt(t0, out, zb0), b = pt(t1, out, zb1), a2 = pt(t0, out, zb0 + CH), b2 = pt(t1, out, zb1 + CH);
        fill([a, b, b2, a2], stone(faceLit - 0.04 * (i % 2)), 'rgba(40,26,14,.55)');
        const c1 = pt(t0, inn, zb0 + CH), c2 = pt(t1, inn, zb1 + CH); fill([a2, b2, c2, c1], stone(0.72), 'rgba(40,26,14,.5)');
      }
    };
    cheek(0);
    const order = r === 2 || r === 4 ? [...Array(S).keys()].reverse() : [...Array(S).keys()];
    for (const i of order) {
      const t0 = i / S, t1 = (i + 1) / S, zt = L + t1, zb = L + t0;
      // podstopień (widoczny, gdy stopnie rosną od widza, czyli przy r = 2 i 4)
      if (r === 2 || r === 4) { fill([pt(t0, 0, zb), pt(t0, 1, zb), pt(t0, 1, zt), pt(t0, 0, zt)], stone(along ? 0.5 : 0.4, 0.22), 'rgba(40,26,14,.6)'); }
      // płaszczyzna stopnia
      const q = [pt(t0, 0.1, zt), pt(t0, 0.9, zt), pt(t1, 0.9, zt), pt(t1, 0.1, zt)];
      const g2 = g.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]); const vv = (hash2(71 + i, tx, ty) - 0.5) * 0.09; g2.addColorStop(0, stone(0.7 - 0.02 * i + vv)); g2.addColorStop(1, stone(0.6 - 0.02 * i + vv));
      fill([pt(t0, 0, zt), pt(t0, 1, zt), pt(t1, 1, zt), pt(t1, 0, zt)], g2, 'rgba(40,26,14,.5)');
      // jasny nos stopnia na krawędzi od strony niższej i ciemna szczelina na styku z wyższym
      const nose = r === 2 || r === 4 ? t0 : t1; g.strokeStyle = 'rgba(255,244,214,.6)'; g.lineWidth = 1.6; g.beginPath(); const n0 = pt(nose, 0.04, zt), n1 = pt(nose, 0.96, zt); g.moveTo(n0[0], n0[1]); g.lineTo(n1[0], n1[1]); g.stroke();
      const gap = pt(r === 2 || r === 4 ? t1 : t0, 0.5, zt), gp0 = pt(r === 2 || r === 4 ? t1 : t0, 0.02, zt), gp1 = pt(r === 2 || r === 4 ? t1 : t0, 0.98, zt); g.strokeStyle = 'rgba(30,18,8,.55)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(gp0[0], gp0[1]); g.lineTo(gp1[0], gp1[1]); g.stroke(); void gap;
    }
    // zużycie: pęknięcia i mech na stopniach, różne na każdym kaflu
    for (let q = 0; q < 3; q++) { const i = Math.floor(hash2(81 + q, tx, ty) * S), c = 0.15 + 0.7 * hash2(91 + q, tx, ty), zt = L + (i + 1) / S, p0 = pt(i / S + 0.03, c, zt), p1 = pt(i / S + 0.1 + 0.08 * hash2(95 + q, tx, ty), c + (hash2(97 + q, tx, ty) - 0.5) * 0.25, zt);
      if (hash2(99 + q, tx, ty) < 0.6) { g.strokeStyle = 'rgba(40,26,14,.5)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo((p0[0] + p1[0]) / 2 + 2, (p0[1] + p1[1]) / 2 + 1.5); g.lineTo(p1[0], p1[1]); g.stroke(); } else { g.fillStyle = 'rgba(70,112,40,.5)'; g.beginPath(); g.ellipse(p0[0], p0[1], 7, 2.6, 0, 0, 7); g.fill(); } }
    cheek(1);
    // boczne ściany pochylni
    for (const [dx, dy, side] of [[1, 0, 'R'], [0, 1, 'L']]) {
      const nx = tx + dx, ny = ty + dy; if (nx >= N || ny >= N) continue;
      const nz = this.cornersZ(nx, ny), ta = dx ? z[1] : z[3], tb = z[2], na = nz[0], nb = dx ? nz[3] : nz[1];
      if (ta - na < 0.15 && tb - nb < 0.15) continue;
      this.drawWall(g, dx ? P(1, 0, ta) : P(0, 1, ta), P(1, 1, tb), Math.max(0, ta - na) * HZ, Math.max(0, tb - nb) * HZ, tx * 131 + ty * 17 + (dx ? 1 : 2), side, k, 0);
    }
  }
  // ściana skalna: kolumny o różnym odcieniu, warstwy, pęknięcia, mech, trawiasta krawędź. A i B to górne końce krawędzi, hA i hB wysokości w px.
  drawWall(g, A, B, hA, hB, seed, side, k, topKind) {
    const w = this.w, reg = w.cellRegion[k], M = 7, jit = Array.from({ length: M + 1 }, (_, i) => (hash2(seed, i, 7) - 0.5) * 7), at = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, hA + (hB - hA) * t];
    const base = side === 'L' ? [0.54, 0.3] : [0.4, 0.26], hue = reg === 2 ? 36 : 30, sat = base[1] + (reg === 2 ? 0.06 : 0), maxH = Math.max(hA, hB);
    for (let i = 0; i < M; i++) {
      const t0 = i / M, t1 = (i + 1) / M, p0 = at(t0), p1 = at(t1), v = (hash2(seed + 3, i, 1) - 0.5) * 0.09;
      g.fillStyle = rgbStr(hslRgb(hue, sat, base[0] + v)); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p1[0], p1[1] + p1[2] + jit[i + 1]); g.lineTo(p0[0], p0[1] + p0[2] + jit[i]); g.closePath(); g.fill();
      // jasna ściana fasety po lewej, ciemna po prawej
      g.strokeStyle = 'rgba(255,235,190,.16)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p0[0] + 1, p0[1] + 3); g.lineTo(p0[0] + 1, p0[1] + p0[2] * (0.5 + 0.4 * hash2(seed, i, 2)) + jit[i]); g.stroke();
      g.strokeStyle = 'rgba(30,18,8,.2)'; g.beginPath(); g.moveTo(p1[0] - 1, p1[1] + 3); g.lineTo(p1[0] - 1, p1[1] + p1[2] + jit[i + 1]); g.stroke();
    }
    // warstwy skalne
    g.lineWidth = 1.1; g.strokeStyle = 'rgba(40,24,10,.3)';
    for (let q = 1; q * 15 < maxH; q++) { g.beginPath(); for (let i = 0; i <= M; i++) { const p = at(i / M), yy = p[1] + q * 15 + (hash2(seed + 9, i, q) - 0.5) * 5; if (q * 15 > p[2] - 3) continue; i ? g.lineTo(p[0], yy) : g.moveTo(p[0], yy); } g.stroke(); }
    // cień u podstawy i na górze (zagłębienie pod trawą)
    const gr = g.createLinearGradient(0, Math.min(A[1], B[1]), 0, Math.min(A[1], B[1]) + maxH + 4); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.15, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,2,.38)');
    g.fillStyle = gr; g.beginPath(); const pa = at(0), pb = at(1); g.moveTo(pa[0], pa[1]); g.lineTo(pb[0], pb[1]); g.lineTo(pb[0], pb[1] + pb[2] + 2); g.lineTo(pa[0], pa[1] + pa[2] + 2); g.closePath(); g.fill();
    // pęknięcia i mech
    g.strokeStyle = 'rgba(25,14,6,.4)'; g.lineWidth = 1;
    for (let c = 0; c < 3; c++) { const t = 0.1 + 0.8 * hash2(seed + 11, c, 3), p = at(t), len = 8 + 14 * hash2(seed + 12, c, 4); g.beginPath(); g.moveTo(p[0], p[1] + 6); g.lineTo(p[0] + (hash2(seed + 13, c, 5) - 0.5) * 8, p[1] + 6 + len * 0.5); g.lineTo(p[0] + (hash2(seed + 14, c, 6) - 0.5) * 10, p[1] + 6 + len); g.stroke(); }
    for (let m = 0; m < 3; m++) if (hash2(seed + 15, m, 8) < 0.55) { const t = hash2(seed + 16, m, 9), p = at(t); g.fillStyle = 'rgba(120,158,64,.38)'; g.beginPath(); g.ellipse(p[0], p[1] + p[2] * (0.25 + 0.4 * hash2(seed + 17, m, 1)), 6 + 8 * hash2(seed + 18, m, 2), 3 + 3 * hash2(seed + 19, m, 3), 0, 0, 7); g.fill(); }
    // trawiasta krawędź zwisająca nad ścianą i kępki na górze
    const gcol = topKind === w.KIND.moss ? '#2f5a2c' : '#4a8a30';
    g.fillStyle = gcol; g.beginPath(); g.moveTo(A[0], A[1] - 1); for (let i = 0; i <= 12; i++) { const p = at(i / 12); g.lineTo(p[0], p[1] + 3 + 4 * hash2(seed + 21, i, 4)); } for (let i = 12; i >= 0; i--) { const p = at(i / 12); g.lineTo(p[0], p[1] - 2); } g.closePath(); g.fill();
    g.strokeStyle = topKind === w.KIND.moss ? '#4a7a3a' : '#9ac85a'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 16; i++) { const p = at(i / 15 * 0.98 + 0.01), hh = 4 + 5 * hash2(seed + 22, i, 5); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (hash2(seed + 23, i, 6) - 0.5) * 4, p[1] - hh); } g.stroke();
  }
  // Skala pieczenia jest kwantowana do kilku poziomów, więc przybliżanie i oddalanie nie wyrzuca całego cache: stare obrazy rysują się przeskalowane,
  // dopóki w tle (po kilka na klatkę) nie dopiekają się nowe. Trzymamy bieżący i poprzedni poziom.
  level(scale) { let best = LEVELS[0]; for (const l of LEVELS) if (Math.abs(Math.log(l / scale)) < Math.abs(Math.log(best / scale))) best = l; return best; }
  levelMap(store, lvl) {
    if (this.lvCur !== lvl) { this.lvPrev = this.lvCur; this.lvCur = lvl; for (const k of [...store.keys()]) if (k !== lvl && k !== this.lvPrev) store.delete(k); }
    let m = store.get(lvl); if (!m) store.set(lvl, m = new Map()); return m;
  }
  chunk(cx, cy, scale, budget) {
    const lvl = this.level(scale), m = this.levelMap(this.chunkLv, lvl), key = cy * 1000 + cx; let c = m.get(key);
    if (!c && budget.n > 0) { budget.n--; c = this.bakeChunk(cx, cy, lvl); if (c) m.set(key, c); }
    if (!c && this.lvPrev) { const pm = this.chunkLv.get(this.lvPrev); if (pm) c = pm.get(key); }
    return c;
  }
  // obrazek obiektu: rysowany raz w skali poziomu i potem tylko kopiowany
  sprite(key, [sw, sh, ax, ay], draw, scale) {
    if (!this.doc) return null;
    const lvl = this.level(scale), m = this.levelMap(this.sprLv, lvl); let c = m.get(key);
    if (!c) {
      if (this.sprBudget <= 0 && this.lvPrev) { const pm = this.sprLv.get(this.lvPrev); if (pm && pm.get(key)) return pm.get(key); }
      this.sprBudget--; c = this.doc.createElement('canvas'); c.width = Math.ceil(sw * lvl); c.height = Math.ceil(sh * lvl); const g = c.getContext('2d'); g.scale(lvl, lvl); draw(g, ax, ay); m.set(key, c);
    }
    return c;
  }
  drawSprite(g, key, dim, draw, x, y, scale) {
    const c = this.sprite(key, dim, draw, scale);
    if (c) g.drawImage(c, x - dim[2], y - dim[3], dim[0], dim[1]); else { g.save(); g.translate(x, y); draw(g, 0, 0); g.restore(); }
  }
  objectDrawer(o) {
    const sd = o.seed % 7 + 1;
    if (o.k === 'oak' && this.imgs.dab) { const flip = sd % 2 === 1, sc = 0.88 + 0.12 * (sd % 3); return [`img:dab:${flip ? 1 : 0}:${sd % 3}`, assetDim('dab', sc), (gg, ax, ay) => drawAsset(gg, this.imgs.dab, 'dab', ax, ay, { flip, sc })]; }
    if (o.k === 'barrel' && this.imgs.beczka) return ['img:beczka', assetDim('beczka'), (gg, ax, ay) => drawAsset(gg, this.imgs.beczka, 'beczka', ax, ay)];
    if (TREE[o.k]) { const spec = genTree(sd, o.k, o.biome || 'summer'); return [`${o.k}:${sd}:${o.biome || ''}`, SPR[o.k], (gg, ax, ay) => drawTree(gg, ax, ay, spec)]; }
    if (SMALL[o.k]) { const sc = o.sc || 1; return [`${o.k}:${sd}:${o.biome || ''}:${Math.round(sc * 4)}`, SPR[o.k], (gg, ax, ay) => SMALL[o.k](gg, ax, ay, sc, sd, o)]; }
    if (PROP[o.k]) return [`${o.k}:${sd}:${o.dir || ''}`, SPR[o.k], (gg, ax, ay) => PROP[o.k](gg, ax, ay, sd, o)];
    return null;
  }
  get lamps() { return this._lamps || (this._lamps = this.collectLights()); }
  // źródła światła w świecie (lampy, pochodnie przy wejściach) w pikselach świata: używane w nocy i do migotania
  collectLights() {
    const out = [], w = this.w;
    for (const o of w.objects) if (o.k === 'lamp') { const p = this.pos(o.x, o.y); out.push({ x: p[0], y: p[1] - 50, r: 130, a: 0.9, ph: o.x * 7.3 + o.y }); }
    // wejścia: światło wychodzi z pochodni (płomienie na słupach przy portyku krypty) albo z dziupli jamy, a nie z całej bryły
    w.entrances.forEach((e, i) => { const p = this.pos(e.at[0], e.at[1]), sc = this.entSpecs[i].scale || 1;
      const A = ASSETS.krypta; if (e.kind === 'krypta' && this.imgs.krypta) for (const [fx, fy] of A.lights) out.push({ x: p[0] + (fx - 0.5) * A.w, y: p[1] + fy * A.h - (A.h - A.foot), r: 95, a: 0.95, ph: i + fx * 7 });
      else if (e.kind === 'krypta') for (const sd of [-1, 1]) { const X = 0.894 * ((sd * 73) - 96), Y = 0.447 * ((sd * 73) + 96) - 82; out.push({ x: p[0] + X * sc, y: p[1] + Y * sc, r: 95, a: 0.95, ph: i + sd * 3.1 }); }
      else out.push({ x: p[0], y: p[1] - 18 * sc, r: 70, a: 0.7, ph: i }); });
    return out;
  }
  // jakość: przy zmianie czyścimy cache (bloki, obrazki, mapy cieni), bo zależą od rozdzielczości cieni i dekoracji
  setQuality(q) {
    const same = this.quality.shadowRes === q.shadowRes && this.quality.decals === q.decals; this.quality = { ...this.quality, ...q };
    if (!same) { this.masks.clear(); this.chunkLv.clear(); this.sprLv.clear(); this.shadeCache.clear(); this.lvCur = 0; this.lvPrev = 0; }
  }
  // animowana woda: przesuwające się refleksy i zmarszczki na kaflach wody i brodu (rysowane na wierzchu terenu, pod obiektami)
  drawWater(g, gx0, gx1, gy0, gy1, t) {
    const mode = this.quality.water; if (mode === 'static') return; const w = this.w, K = w.KIND, full = mode === 'full';
    g.save(); g.lineCap = 'round';
    for (let ty = gy0; ty <= gy1; ty++) for (let tx = gx0; tx <= gx1; tx++) {
      const kind = w.cellKind[ty * N + tx]; if (kind !== K.water && kind !== K.shallow) continue;
      const hh = hash2(11, tx, ty), shallow = kind === K.shallow, n = full ? (shallow ? 3 : 2) : (hh < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const ph = (t * (shallow ? 0.32 : 0.18) + hash2(21 + i, tx, ty)) % 1, u = (hash2(31 + i, tx, ty) * 0.6 + 0.2 + ph * 0.5) % 1, v = (hash2(41 + i, tx, ty) * 0.6 + 0.2 + ph * 0.25) % 1, a = Math.sin(ph * Math.PI), p = this.proj(tx + u, ty + v, 0);
        g.strokeStyle = `rgba(255,255,255,${(0.1 + 0.34 * a).toFixed(3)})`; g.lineWidth = 1.2 + a; g.beginPath(); g.ellipse(p[0], p[1], 5 + 5 * a, 2 + 2 * a, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      }
      if (full && hash2(51, tx, ty) < 0.22) { const s = Math.sin(t * 2.2 + hh * 40), p = this.proj(tx + 0.5, ty + 0.5, 0); if (s > 0.6) { g.fillStyle = `rgba(255,255,255,${((s - 0.6) * 1.4).toFixed(3)})`; g.fillRect(p[0] - 1, p[1] - 1, 2.4, 2.4); } }
    }
    g.restore();
  }
  // dym z komina: kilka puszków unoszących się i rozrastających, znoszonych lekko wiatrem
  drawSmoke(g, b, sx, sy, t) {
    const c = b.s._chim; if (!c || !b.s.smoke) return; const x = sx + c[0] * b.k, y = sy + c[1] * b.k, sd = b.s.seed * 0.37;
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.28 + i / 6 + sd) % 1, px = x + ph * 22 + Math.sin(t * 0.9 + i * 1.7 + sd) * (2 + ph * 4), py = y - ph * 86, r = 3.5 + ph * 11, a = Math.min(1, ph * 7) * (1 - ph) * 0.5;
      g.fillStyle = `rgba(236,236,242,${a.toFixed(3)})`; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    }
  }
  // maska krycia sprite'a (1/8 rozdzielczości, liczona raz): pozwala sprawdzić, czy w danym punkcie obiekt naprawdę coś zasłania
  coverAt(key, rect, px, py) {
    const [rx, ry, rw, rh] = rect; if (px < rx || px >= rx + rw || py < ry || py >= ry + rh) return false;
    let m = this.masks.get(key);
    if (!m) { const c = (this.sprLv.get(this.lvCur) || new Map()).get(key); if (!c || !this.doc) return false; const w = Math.max(1, Math.ceil(c.width / 8)), h = Math.max(1, Math.ceil(c.height / 8)), q = this.doc.createElement('canvas'); q.width = w; q.height = h; const qg = q.getContext('2d', { willReadFrequently: true }); qg.drawImage(c, 0, 0, w, h); m = { w, h, d: qg.getImageData(0, 0, w, h).data }; this.masks.set(key, m); }
    const x = Math.min(m.w - 1, Math.floor((px - rx) / rw * m.w)), y = Math.min(m.h - 1, Math.floor((py - ry) / rh * m.h)); return m.d[(y * m.w + x) * 4 + 3] > 70;
  }
  // przezroczystość przedmiotu stojącego przed graczem: gdy jego sylwetka naprawdę zasłania gracza (stopy, tors lub głowę), obiekt płynnie blednie
  fadeAlpha(o, key, rect, d, player) {
    let target = 1;
    if (player && d > player.d) for (const dy of [0, -16, -32]) if (this.coverAt(key, rect, player.sx, player.sy + dy)) { target = 0.3; break; }
    const cur = o._fa === undefined ? 1 : o._fa; o._fa = cur + (target - cur) * 0.2; return o._fa;
  }
  // kafle wyższe od gruntu przedmiotu i leżące przed nim (większa głębokość) w zasięgu jego obrazu: tylko one mogą go naprawdę zasłonić
  occluderTiles(x, y, z) {
    const out = [], d0 = x + y, e0 = x - y, w = this.w, fx = Math.floor(x), fy = Math.floor(y);
    for (let ty = Math.max(0, fy - 6); ty < Math.min(N, fy + 15); ty++) for (let tx = Math.max(0, fx - 6); tx < Math.min(N, fx + 15); tx++) {
      const dd = tx + ty + 1 - d0; if (dd < 0.5 || dd > 15 || Math.abs(tx - ty - e0) > 6) continue;
      const k = ty * N + tx, top = w.lvl[k] + (w.ramp[k] ? 1 : 0);
      if (top > z + 0.5 && dd <= 2 * top + 3 && w.cellKind[k] !== w.KIND.water) out.push(k);
    }
    return out;
  }
  // dorysowuje z gotowych bloków terenu powierzchnię i ściany kafla k (zasłania przedmiot leżący za nim)
  redrawTile(g, k, scale) {
    const w = this.w, tx = k % N, ty = (k - tx) / N, ch = ((this.chunkLv.get(this.lvCur) || new Map()).get(Math.floor(ty / CS) * 1000 + Math.floor(tx / CS))) || ((this.chunkLv.get(this.lvPrev) || new Map()).get(Math.floor(ty / CS) * 1000 + Math.floor(tx / CS))); if (!ch || !ch.canvas) return;
    const z = this.cornersZ(tx, ty), P = (fx, fy, zz) => this.proj(tx + fx, ty + fy, zz), polys = [[P(0, 0, z[0]), P(1, 0, z[1]), P(1, 1, z[2]), P(0, 1, z[3])]];
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const nx = tx + dx, ny = ty + dy; if (nx >= N || ny >= N) continue; const nz = this.cornersZ(nx, ny), ta = dx ? z[1] : z[3], tb = z[2], na = nz[0], nb = dx ? nz[3] : nz[1]; if (ta - na < 0.15 && tb - nb < 0.15) continue; const A = dx ? P(1, 0, ta) : P(0, 1, ta), B = P(1, 1, tb); polys.push([A, B, [B[0], B[1] + Math.max(0, tb - nb) * HZ], [A[0], A[1] + Math.max(0, ta - na) * HZ]]); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const pl of polys) for (const p of pl) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    x0 -= 3; y0 -= 6; x1 += 3; y1 += 6; const sc = ch.canvas.width / ch.w;
    g.save(); g.beginPath(); for (const pl of polys) { g.moveTo(pl[0][0], pl[0][1]); for (let i = 1; i < pl.length; i++) g.lineTo(pl[i][0], pl[i][1]); g.closePath(); } g.clip();
    g.drawImage(ch.canvas, (x0 - ch.X0) * sc, (y0 - ch.Y0) * sc, (x1 - x0) * sc, (y1 - y0) * sc, x0, y0, x1 - x0, y1 - y0); g.restore();
  }
  // przedmiot (drzewo, budynek, postać) i zasłaniające go fragmenty wyższego terenu
  drawWithOcclusion(g, occ, scale, drawFn) {
    drawFn(); if (occ && occ.length) for (const k of occ) this.redrawTile(g, k, scale);
  }
  // rysunek wejścia: gotowy obraz (krypta), gdy się wczytał, inaczej generator
  entDraw(i) { const e = this.w.entrances[i]; if (e.kind === 'krypta' && this.imgs.krypta) return [`ei:${i}`, assetDim('krypta'), (gg, ax, ay) => drawAsset(gg, this.imgs.krypta, 'krypta', ax, ay)]; return [`e:${i}`, SPR[e.kind], (gg, ax, ay) => drawEntrance(gg, ax, ay, this.entSpecs[i])]; }
  // cały świat widoczny w oknie (cam: środek w px świata, view: {w,h} w px css, zoom). Najpierw cały teren (niezależna warstwa), potem wszystkie
  // przedmioty i postacie od tyłu do przodu; wyższy teren zasłania tylko te przedmioty, które faktycznie leżą za nim.
  draw(g, cam, view, zoom, dpr, t, entities = []) {
    const w = this.w, grid = this.grid, scale = zoom * dpr;
    const hw = view.w / 2 / zoom, hh = view.h / 2 / zoom, L = cam.x - hw - 40, R = cam.x + hw + 40, T = cam.y - hh - 60, B = cam.y + hh + MAXZ * HZ + 20;
    const cs = [grid.toGrid(L, T), grid.toGrid(R, T), grid.toGrid(R, B + 320), grid.toGrid(L, B + 320)];
    const gx0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[0])))), gx1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[0])))), gy0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[1])))), gy1 = Math.min(N - 1, Math.ceil(Math.max(...cs.map((c) => c[1]))));
    const ents = new Map(); for (const e of entities) { const k = Math.floor(e.y) * N + Math.floor(e.x); (ents.get(k) || ents.set(k, []).get(k)).push(e); }
    const list = []; for (let cy = Math.floor(gy0 / CS); cy <= Math.floor(gy1 / CS); cy++) for (let cx = Math.floor(gx0 / CS); cx <= Math.floor(gx1 / CS); cx++) list.push([cx, cy]);
    list.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
    this.t = t; const pl = entities.find((e) => e.player), player = pl ? { d: pl.x + pl.y + 0.0005, sx: this.pos(pl.x, pl.y)[0], sy: this.pos(pl.x, pl.y)[1] } : null;
    this.sprBudget = this.baked < 1 ? 999 : 14; const budget = { n: this.baked < 1 ? 999 : 3 }, items = [];
    for (const [cx, cy] of list) {
      const ch = this.chunk(cx, cy, scale, budget);
      if (ch && ch.canvas && !(ch.X0 > R + 100 || ch.X0 + ch.w < L - 100 || ch.Y0 > B + 340 || ch.Y0 + ch.h < T - 40)) g.drawImage(ch.canvas, ch.X0, ch.Y0, ch.w, ch.h);
      for (let ty = cy * CS; ty < Math.min(N, cy * CS + CS); ty++) for (let tx = cx * CS; tx < Math.min(N, cx * CS + CS); tx++) {
        const k = ty * N + tx;
        const objs = w.byTile.get(k); if (objs) for (const o of objs) items.push({ d: o.x + o.y, o });
        const bl = this.bld.get(k); if (bl) for (const b of bl) items.push({ d: b.sx + b.sy - 1, b });
        const en = this.ent.get(k); if (en) for (const i of en) items.push({ d: w.entrances[i].at[0] + w.entrances[i].at[1] + 1.5, en: i });
        const es = ents.get(k); if (es) for (const e of es) items.push({ d: e.x + e.y + 0.001, e });
      }
    }
    this.drawWater(g, gx0, gx1, gy0, gy1, t);
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.o) { const o = it.o, [sx, sy] = this.pos(o.x, o.y); if (sx < L - 160 || sx > R + 160 || sy < T - 40 || sy > B + 340) continue; const dr = this.objectDrawer(o); if (!dr) continue; if (o._occ === undefined) o._occ = this.occluderTiles(o.x, o.y, heightAt(w, o.x, o.y));
        const fa = TREE[o.k] ? this.fadeAlpha(o, dr[0], [sx - dr[1][2], sy - dr[1][3], dr[1][0], dr[1][1]], it.d, player) : 1; g.globalAlpha = fa; this.drawWithOcclusion(g, o._occ, scale, () => this.drawSprite(g, dr[0], dr[1], dr[2], sx, sy, scale)); g.globalAlpha = 1; }
      else if (it.b) { const b = it.b, z = heightAt(w, b.sx - 0.5, b.sy - 0.5), [sx, sy] = this.proj(b.sx, b.sy, z); if (b._occ === undefined) b._occ = this.occluderTiles(b.sx, b.sy, z);
        g.globalAlpha = this.fadeAlpha(b, `b:${b.s.seed}`, [sx - SPR.budynek[2], sy - SPR.budynek[3], SPR.budynek[0], SPR.budynek[1]], it.d - 1.2, player); this.drawWithOcclusion(g, b._occ, scale, () => this.drawSprite(g, `b:${b.s.seed}`, SPR.budynek, (gg, ax, ay) => { gg.save(); gg.translate(ax, ay); gg.scale(b.k, b.k); drawBuilding(gg, 0, 0, b.s); gg.restore(); }, sx, sy, scale)); g.globalAlpha = 1;
        if (this.quality.smoke) this.drawSmoke(g, b, sx, sy, t); }
      else if (it.en !== undefined) { const i = it.en, e = w.entrances[i], [sx, sy] = this.pos(e.at[0], e.at[1]), ed = this.entDraw(i); if (e._occ === undefined) e._occ = this.occluderTiles(e.at[0], e.at[1], heightAt(w, e.at[0], e.at[1]));
        g.globalAlpha = this.fadeAlpha(e, ed[0], [sx - ed[1][2], sy - ed[1][3], ed[1][0], ed[1][1]], it.d - 1.5 - 1.2, player); this.drawWithOcclusion(g, e._occ, scale, () => this.drawSprite(g, ed[0], ed[1], ed[2], sx, sy, scale)); g.globalAlpha = 1; }
      else { const e = it.e, occ = this.occluderTiles(e.x, e.y, heightAt(w, e.x, e.y)); this.drawWithOcclusion(g, occ, scale, () => e.draw(g, ...this.pos(e.x, e.y))); }
    }
  }
}
