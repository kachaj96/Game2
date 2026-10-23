// Scena mapy v3 (rysowanie i bohater), wspólna dla podglądu i edytora: podłoże z wypalonymi cieniami, obiekty w kolejności głębi,
// zanikanie, nachodzenie trawy, chód. Wymaga DOM (canvas). Logika mapy w mapdata.js, cienie w osadzenie.js.
import { Iso, TW, TH, LEVEL } from './iso.js';
import { buildMap } from './mapdata.js';
import { shadowCanvas, sunkCanvas, pixelsOf, flipped } from './osadzenie.js';

export const MAP_W = 768, MAP_H = 512;   // prostokąt mapy w j (obraz podłoża 1536 x 1024 px w skali 2x)

export async function loadAssets(LIB, url) {
  const load = (p) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('brak pliku ' + p)); i.src = url(p); });
  const names = Object.keys(LIB.sprites);
  const gids = Object.keys(LIB.grounds || { _: 1 }), gl = LIB.grounds || { _: LIB.ground };
  const [gimgs, rest] = await Promise.all([Promise.all(gids.map((id) => load(gl[id].file))), Promise.all([...names.map((n) => load(LIB.sprites[n].file)), load(LIB.hero.idle_sw.file), load(LIB.hero.idle_ne.file), ...LIB.hero.walk_w.map((f) => load(f.file))])]);
  const IMG = {}; names.forEach((n, i) => { IMG[n] = rest[i]; });
  const grounds = {}; gids.forEach((id, i) => { grounds[id] = normGround(gimgs[i]); });
  return { grounds, addGround: (id, img) => { grounds[id] = normGround(img); }, IMG, IDLE: { sw: rest[names.length], ne: rest[names.length + 1] }, WALK: rest.slice(names.length + 2) };
}

const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
// każde podłoże sprowadzamy do prostokąta mapy 1536 x 1024 px (skala 2x), niezależnie od rozmiaru pliku
export const normGround = (img) => { const c = mkCanvas(1536, 1024); c.getContext('2d').drawImage(img, 0, 0, 1536, 1024); return c; };
export const spriteDefs = (LIB) => Object.fromEntries(Object.entries(LIB.sprites).map(([k, s]) => [k, { footprint: s.footprint, height: s.height }]));

export function createScene(cv, LIB, A, def0, opts = {}) {
  const g = cv.getContext('2d'), SP = spriteDefs(LIB), gpCache = new Map(), baked = mkCanvas(1536, 1024), bg = baked.getContext('2d');
  const sc = { exitLock: true, onExit: null, osad: true, showGrid: false, showCol: false, play: true, view: { z: 1, ox: 0, oy: 0 }, dpr: 1, hero: { x: 0, y: 0, path: [], dir: 'SW', t: 0, walk: false }, overlay: null, toast: opts.toast || (() => {}), hideObjects: null };
  const gid = () => (sc.def.ground && A.grounds[sc.def.ground] ? sc.def.ground : Object.keys(A.grounds)[0]), gnd = () => A.grounds[gid()], gpix = () => { const c = gnd(); if (!gpCache.has(c)) gpCache.set(c, pixelsOf(c)); return gpCache.get(c); };
  let M, iso, SUNK = [], shCache = new Map(), HSH = new Map(), bakeTimer = 0, last = 0;

  const sprAlpha = {};   // maski alfa sprite'ów do trafiania w obiekty kliknięciem
  for (const [n, im] of Object.entries(A.IMG)) { const { d } = pixelsOf(im); const a = new Uint8ClampedArray(d.width * d.height); for (let i = 0; i < a.length; i++) a[i] = d.data[i * 4 + 3]; sprAlpha[n] = { a, w: d.width, h: d.height }; }
  sc.spriteAlpha = sprAlpha;

  const objPos = (o) => { const s = LIB.sprites[o.sprite], z = o.z || 0, c = s.base === 'center' ? iso.toScreen(o.x - .5, o.y - .5, z) : iso.toScreen(o.x, o.y, z); return { s, x: c[0], y: c[1], gx: Math.round(2 * c[0] - s.w / 2), gy: Math.round(2 * c[1] - s.h) }; };
  sc.objPos = objPos;

  function setDef(d, { keepHero = false, lazy = false } = {}) {
    sc.def = d; M = buildMap({ ...d, sprites: SP }); sc.M = M; iso = M.iso; sc.iso = iso;
    if (!keepHero && d.start) { sc.hero.x = d.start[0]; sc.hero.y = d.start[1]; sc.hero.path = []; }
    lazy ? scheduleBake() : rebake();
  }
  function scheduleBake() { clearTimeout(bakeTimer); bakeTimer = setTimeout(rebake, 140); }
  function rebake() {
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalCompositeOperation = 'source-over'; bg.drawImage(gnd(), 0, 0); SUNK = []; const GP = gpix();
    sc.def.objects.forEach((o, i) => {
      const P = objPos(o), fp = P.s.footprint;
      const cx = o.x - fp.w / 2, cy = o.y - fp.d / 2, k = 1.22, z = o.z || 0, pts = [[-fp.w, -fp.d], [0, -fp.d], [0, 0], [-fp.w, 0]].map(([a, b]) => iso.toScreen(cx + (a + fp.w / 2) * k, cy + (b + fp.d / 2) * k, z));
      bg.save(); bg.filter = 'blur(9px)'; bg.fillStyle = 'rgba(8,10,4,.42)'; bg.beginPath(); pts.forEach((q, j) => (j ? bg.lineTo(q[0] * 2, q[1] * 2) : bg.moveTo(q[0] * 2, q[1] * 2))); bg.closePath(); bg.fill(); bg.restore();
      let sh = shCache.get(o.sprite); if (!sh) { sh = shadowCanvas(A.IMG[o.sprite], P.s.base, 1.6, .5); shCache.set(o.sprite, sh); }
      bg.drawImage(sh, P.gx - sh.ox, P.gy);
      SUNK[i] = sunkCanvas(A.IMG[o.sprite], P.s.base, GP.d, P.gx, P.gy, { band: P.s.base === 'center' ? 16 : 12, strength: .85 });
    });
    sc.def.objects.forEach((o) => { if (o.sprite !== 'lampa') return; const P = objPos(o); bg.save(); bg.globalCompositeOperation = 'screen'; const r = bg.createRadialGradient(0, 0, 0, 0, 0, 150); r.addColorStop(0, 'rgba(255,170,60,.38)'); r.addColorStop(1, 'rgba(255,170,60,0)'); bg.translate(P.x * 2, P.y * 2); bg.scale(1, .52); bg.fillStyle = r; bg.fillRect(-150, -150, 300, 300); bg.restore(); });
  }
  const hshadow = (img, m) => { if (!HSH.has(img)) { const n = shadowCanvas(img, 'center', 1.1, .5), f = shadowCanvas(flipped(img), 'center', 1.1, .5); HSH.set(img, { n: { c: n, ax: m.ax + n.ox }, f: { c: f, ax: m.w - m.ax + f.ox } }); } return HSH.get(img); };

  function resize(left = 0) {
    sc.dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * sc.dpr); cv.height = Math.round(innerHeight * sc.dpr);
    const aw = innerWidth - left, z = Math.min(aw / MAP_W, innerHeight / MAP_H); sc.view = { z, ox: left + (aw - MAP_W * z) / 2, oy: (innerHeight - MAP_H * z) / 2 };
  }
  const S2 = (x, y, z = 0) => { const p = iso.toScreen(x, y, z); return [sc.view.ox + p[0] * sc.view.z, sc.view.oy + p[1] * sc.view.z]; };
  sc.S2 = S2;
  sc.toMap = (cx, cy) => { const wx = (cx - sc.view.ox) / sc.view.z, wy = (cy - sc.view.oy) / sc.view.z, [gx, gy] = iso.toGrid(wx, wy); return { wx, wy, gx, gy, cell: [Math.floor(gx), Math.floor(gy)] }; };

  function sector(vx, vy) { const a = Math.atan2(vy, vx) * 180 / Math.PI, A_ = Math.abs(a); if (A_ <= 22.5) return 'E'; if (A_ >= 157.5) return 'W'; const s = a > 0 ? 'S' : 'N'; return A_ < 67.5 ? s + 'E' : A_ > 112.5 ? s + 'W' : s; }
  function heroSprite() {
    const h = sc.hero, d = h.dir;
    if (h.walk && (d === 'W' || d === 'E')) { const i = Math.floor(h.t * 8) % 6; return { img: A.WALK[i], m: LIB.hero.walk_w[i], mir: d === 'E', bob: 0 }; }
    const back = d === 'N' || d === 'NE' || d === 'NW', key = back ? 'ne' : 'sw';
    return { img: A.IDLE[key], m: LIB.hero['idle_' + key], mir: back ? d === 'NW' : (d === 'SE' || d === 'E'), bob: h.walk ? Math.abs(Math.sin(h.t * 8)) * 2.2 : 0 };
  }
  function drawShadow(x, y, rx, ry, a = .35) { const p = S2(x, y), d = sc.dpr; g.save(); g.translate(p[0] * d, p[1] * d); g.scale(1, ry / rx); g.fillStyle = 'rgba(0,0,0,' + a + ')'; g.beginPath(); g.arc(0, 0, rx * sc.view.z * d, 0, 7); g.fill(); g.restore(); }
  function drawImg(img, m, x, y, { mir = false, alpha = 1, glow = false, bob = 0 } = {}) {
    const z = sc.view.z, d = sc.dpr, w = m.w / 2 * z * d, h = m.h / 2 * z * d, ax = (m.ax !== undefined ? m.ax : m.w / 2) / 2 * z * d;
    g.save(); g.globalAlpha = alpha; if (glow) { g.shadowColor = 'rgba(255,226,170,.6)'; g.shadowBlur = 7 * d; }
    g.translate(x * d, (y - bob * z) * d); if (mir) g.scale(-1, 1); g.drawImage(img, -ax, -h, w, h); g.restore();
  }
  sc.moveTo = (cx, cy) => {
    if (M.blocked(cx, cy)) { sc.toast('Tu nie wejdziesz.'); return false; }
    const p = M.findPath([Math.floor(sc.hero.x), Math.floor(sc.hero.y)], [cx, cy]); if (!p) { sc.toast('Nie da się tam dojść.'); return false; }
    sc.hero.path = p.slice(1).map(([x, y]) => [x + .5, y + .5]); if (!sc.hero.path.length) sc.hero.path = [[cx + .5, cy + .5]]; return true;
  };

  function draw(now) {
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; const z = sc.view.z, d = sc.dpr, h = sc.hero;
    h.walk = false;
    if (sc.play && h.path.length) {
      const [tx, ty] = h.path[0], dx = tx - h.x, dy = ty - h.y, dist = Math.hypot(dx, dy), sp = 2.7 * dt;
      if (dist <= sp) { h.x = tx; h.y = ty; h.path.shift(); }
      else { h.x += dx / dist * sp; h.y += dy / dist * sp; h.walk = true; h.t += dt; h.dir = sector((dx - dy) * TW / 2, (dx + dy) * TH / 2); }
    }
    // przejście na krawędzi: wejście w kafel strefy przenosi od razu; po przybyciu strefa jest zablokowana, dopóki bohater z niej nie zejdzie
    if (sc.play) { const ex = M.exitAt(Math.floor(h.x), Math.floor(h.y)); if (!ex) sc.exitLock = false; else if (!sc.exitLock) { sc.exitLock = true; h.path = []; if (sc.onExit) sc.onExit(ex); } }
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0a0908'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(sc.osad ? baked : gnd(), sc.view.ox * d, sc.view.oy * d, MAP_W * z * d, MAP_H * z * d);
    if (sc.showGrid || sc.showCol) for (const [cx, cy] of iso.cells()) {
      const c = [[cx, cy], [cx + 1, cy], [cx + 1, cy + 1], [cx, cy + 1]].map(([a, b]) => S2(a, b)), bl = M.blocked(cx, cy), ex = M.exitAt(cx, cy);
      g.beginPath(); c.forEach((p, i) => (i ? g.lineTo(p[0] * d, p[1] * d) : g.moveTo(p[0] * d, p[1] * d))); g.closePath();
      if (sc.showCol && bl) { g.fillStyle = 'rgba(255,40,40,.35)'; g.fill(); } if (sc.showCol && ex) { g.fillStyle = 'rgba(60,160,255,.35)'; g.fill(); }
      if (sc.showGrid) { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = d; g.stroke(); }
    }
    if (!sc.osad) { for (const o of sc.def.objects) { const s = LIB.sprites[o.sprite], cx = o.x - s.footprint.w / 2, cy = o.y - s.footprint.d / 2; drawShadow(cx, cy, s.footprint.w * 34 + 8, s.footprint.w * 14 + 6, .3); } drawShadow(h.x, h.y, 22, 8, .4); }
    else { const hp = heroSprite(), sh = hshadow(hp.img, hp.m), v = hp.mir ? sh.f : sh.n, p0 = S2(h.x, h.y); drawImg(v.c, { w: v.c.width, h: v.c.height, ax: v.ax }, p0[0], p0[1], { alpha: .95 }); }
    const list = sc.def.objects.map((o, i) => ({ o, i, x: o.x, y: o.y, bias: (o.bias || 0) + (LIB.sprites[o.sprite].base === 'center' ? -1 : 0), kind: 'o' })); list.push({ x: h.x, y: h.y, kind: 'h' });
    list.sort((a, b) => (a.x + a.y + (a.bias || 0)) - (b.x + b.y + (b.bias || 0)) || (a.o ? a.o.z || 0 : 0) - (b.o ? b.o.z || 0 : 0));
    const hs = S2(h.x, h.y);
    for (const it of list) {
      if (it.kind === 'h') { const hp = heroSprite(); drawImg(hp.img, hp.m, hs[0], hs[1], { mir: hp.mir, glow: true, bob: hp.bob }); continue; }
      const P = objPos(it.o), cx = sc.view.ox + P.x * z, cy = sc.view.oy + P.y * z, s = P.s, behind = (h.x + h.y) < (it.o.x + it.o.y + (it.bias || 0));
      let a = 1; if (s.fade && behind && hs[0] > cx - s.w / 4 * z && hs[0] < cx + s.w / 4 * z && hs[1] - 80 * z < cy && hs[1] > cy - s.h / 2 * z) a = .45;
      if (sc.hideObjects && sc.hideObjects(it.i)) a *= .4;
      drawImg(A.IMG[it.o.sprite], s, cx, cy, { alpha: a }); if (sc.osad && SUNK[it.i]) drawImg(SUNK[it.i], s, cx, cy, { alpha: a });
    }
    if (sc.osad) { g.save(); g.globalCompositeOperation = 'multiply'; const x0 = sc.view.ox * d, y0 = sc.view.oy * d, w = MAP_W * z * d, hh = MAP_H * z * d, gr = g.createLinearGradient(x0 + w, y0, x0, y0 + hh); gr.addColorStop(0, 'rgb(255,250,238)'); gr.addColorStop(1, 'rgb(205,210,222)'); g.globalAlpha = .55; g.fillStyle = gr; g.fillRect(x0, y0, w, hh); g.restore(); }
    if (sc.overlay) sc.overlay(g, sc);
  }
  sc.enter = (d, pos) => { sc.hero.x = pos[0]; sc.hero.y = pos[1]; sc.hero.path = []; setDef(d, { keepHero: true }); sc.exitLock = true; };
  sc.setDef = setDef; sc.scheduleBake = scheduleBake; sc.rebake = rebake; sc.resize = resize; sc.draw = draw; sc.drawImgAt = drawImg;
  setDef(def0);
  return sc;
}

// podłoża dodane w edytorze (wersje robocze w przeglądarce): JPEG-i w localStorage, lista id pod kluczem __list
export async function loadDraftGrounds(A, st = globalThis.localStorage) {
  let ids = []; try { ids = JSON.parse(st.getItem('arena.ground.v3.__list')) || []; } catch (_) { return []; }
  const ok = [];
  for (const id of ids) { try { const u = st.getItem('arena.ground.v3.' + id); if (!u) continue; const im = new Image(); await new Promise((res, no) => { im.onload = res; im.onerror = no; im.src = u; }); A.addGround(id, im); ok.push(id); } catch (_) {} }
  return ok;
}
