// Mały renderer figur 3D: postać składa się z brył (elipsoidy, pudełka, walce), a sprite powstaje przez prześwietlenie promieniami z kamery
// ortogonalnej (izometria 30 stopni) z oświetleniem, cieniem własnym i cienkim konturem. Dowolny kierunek patrzenia to po prostu inny obrót kamery,
// więc 4 kierunki i chód są spójne, bez lustra i bez ręcznie rysowanych klatek. Czysta logika (tablice pikseli), bez DOM: render do RGBA.
const { sin, cos, sqrt, PI, min, max, abs } = Math;
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]), norm(a) { const l = v3.len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

// kamera: yaw obraca model (0 = twarzą do widza), elev to kąt patrzenia z góry. V: od modelu do kamery, R: prawo ekranu, U: góra ekranu
export function camera(yawDeg, elevDeg = 30) {
  const y = yawDeg * PI / 180, e = elevDeg * PI / 180, V = [sin(y) * cos(e), sin(e), cos(y) * cos(e)];
  return { V, D: [-V[0], -V[1], -V[2]], R: [cos(y), 0, -sin(y)], U: [-sin(y) * sin(e), cos(e), -cos(y) * sin(e)] };
}

// ---- bryły: środek c, osie (kolumny macierzy) ax, ay, az, połówki rozmiarów h ----
const basisFrom = (yAxis) => { const y = v3.norm(yAxis), helper = abs(y[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1], x = v3.norm(v3.cross(helper, y)); return [x, y, v3.cross(x, y)]; };
const std = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
// type: 'ell' | 'box' | 'cyl' (cyl: promień h[0] i h[2], połowa wysokości h[1] wzdłuż osi y)
export const part = (type, c, h, mat, axes = std, id = '') => ({ type, c, h, mat, axes, id });
export const ell = (c, h, mat, axes, id) => part('ell', c, h, mat, axes, id);
export const box = (c, h, mat, axes, id) => part('box', c, h, mat, axes, id);
export const cyl = (c, h, mat, axes, id) => part('cyl', c, h, mat, axes, id);
// elipsoida rozciągnięta wzdłuż kości od a do b (kończyna), promień r
export const bone = (a, b, r, mat, id, ry = 0.5, rz = 1) => ell(v3.lerp(a, b, 0.5), [r, v3.len(v3.sub(b, a)) * ry, r * rz], mat, basisFrom(v3.sub(b, a)), id);
export const rod = (a, b, r, mat, id) => cyl(v3.lerp(a, b, 0.5), [r, v3.len(v3.sub(b, a)) / 2, r], mat, basisFrom(v3.sub(b, a)), id);

const radius = (p) => (p.type === 'ell' ? max(...p.h) : p.type === 'box' ? v3.len(p.h) : sqrt(max(p.h[0], p.h[2]) ** 2 + p.h[1] ** 2));
const toLocal = (p, o) => { const q = [o[0] - p.c[0], o[1] - p.c[1], o[2] - p.c[2]]; return [v3.dot(p.axes[0], q), v3.dot(p.axes[1], q), v3.dot(p.axes[2], q)]; };
const dirLocal = (p, d) => [v3.dot(p.axes[0], d), v3.dot(p.axes[1], d), v3.dot(p.axes[2], d)];
const toWorldN = (p, n) => v3.norm([p.axes[0][0] * n[0] + p.axes[1][0] * n[1] + p.axes[2][0] * n[2], p.axes[0][1] * n[0] + p.axes[1][1] * n[1] + p.axes[2][1] * n[2], p.axes[0][2] * n[0] + p.axes[1][2] * n[1] + p.axes[2][2] * n[2]]);

// przecięcie promienia o + t d z bryłą: zwraca { t, n (świat), lp (punkt lokalny) } albo null
export function hit(p, o, d) {
  const ol = toLocal(p, o), dl = dirLocal(p, d), h = p.h;
  if (p.type === 'ell') {
    const os = [ol[0] / h[0], ol[1] / h[1], ol[2] / h[2]], ds = [dl[0] / h[0], dl[1] / h[1], dl[2] / h[2]];
    const a = ds[0] * ds[0] + ds[1] * ds[1] + ds[2] * ds[2], b = os[0] * ds[0] + os[1] * ds[1] + os[2] * ds[2], c = os[0] * os[0] + os[1] * os[1] + os[2] * os[2] - 1, disc = b * b - a * c;
    if (disc < 0) return null; const t = (-b - sqrt(disc)) / a, lp = [ol[0] + dl[0] * t, ol[1] + dl[1] * t, ol[2] + dl[2] * t];
    return { t, lp, n: toWorldN(p, [lp[0] / (h[0] * h[0]), lp[1] / (h[1] * h[1]), lp[2] / (h[2] * h[2])]) };
  }
  if (p.type === 'box') {
    let t0 = -Infinity, t1 = Infinity, ax = 0, sg = 1;
    for (let i = 0; i < 3; i++) {
      if (abs(dl[i]) < 1e-9) { if (abs(ol[i]) > h[i]) return null; continue; }
      let a = (-h[i] - ol[i]) / dl[i], b = (h[i] - ol[i]) / dl[i]; const s = dl[i] > 0 ? -1 : 1;   // ściana wejścia: przy ruchu w + wchodzimy przez ścianę -h
      if (a > b) [a, b] = [b, a]; if (a > t0) { t0 = a; ax = i; sg = s; } if (b < t1) t1 = b; if (t0 > t1) return null;
    }
    const lp = [ol[0] + dl[0] * t0, ol[1] + dl[1] * t0, ol[2] + dl[2] * t0], n = [0, 0, 0]; n[ax] = sg; return { t: t0, lp, n: toWorldN(p, n) };
  }
  // walec
  let best = null; const rx = h[0], rz = h[2], hy = h[1];
  const a = (dl[0] / rx) ** 2 + (dl[2] / rz) ** 2, b = (ol[0] * dl[0] / (rx * rx)) + (ol[2] * dl[2] / (rz * rz)), c = (ol[0] / rx) ** 2 + (ol[2] / rz) ** 2 - 1;
  if (a > 1e-12) { const disc = b * b - a * c; if (disc >= 0) { const t = (-b - sqrt(disc)) / a, y = ol[1] + dl[1] * t; if (y >= -hy && y <= hy) { const lp = [ol[0] + dl[0] * t, y, ol[2] + dl[2] * t]; best = { t, lp, n: toWorldN(p, [lp[0] / (rx * rx), 0, lp[2] / (rz * rz)]) }; } } }
  if (abs(dl[1]) > 1e-9) for (const s of [-1, 1]) { const t = (s * hy - ol[1]) / dl[1], x = ol[0] + dl[0] * t, z = ol[2] + dl[2] * t; if ((x / rx) ** 2 + (z / rz) ** 2 <= 1 && (!best || t < best.t)) best = { t, lp: [x, s * hy, z], n: toWorldN(p, [0, s, 0]) }; }
  return best;
}

// szum wartościowy do lekkiej faktury materiałów (deterministyczny)
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const grain = (p, s = 0.35) => { const x = Math.floor(p[0] * s), y = Math.floor(p[1] * s), z = Math.floor(p[2] * s); return hash(x, y, z); };
// gładki szum wartościowy 0..1 (interpolacja trójliniowa): faktura tkanin i skóry bez widocznych kwadratów
export const vnoise = (p, s = 0.3) => {
  const x = p[0] * s, y = p[1] * s, z = p[2] * s, xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v), L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
};

// materiał: { col: [r,g,b] 0..255, spec, shine, emit: [r,g,b], tex: (lp, wp) => mnożnik koloru lub [r,g,b] }
// opts: { w, h, ppu (px na jednostkę), feet: [x, y] położenie stóp w pikselach, yaw, elev, light: [prawo, góra, ku widzowi] w układzie kamery, outline: [r,g,b] }
export function renderRGBA(parts, o) {
  const { w, h, ppu = 1, feet = [w / 2, h - 20], yaw = 0, elev = 30 } = o, cam = camera(yaw, elev), N = w * h;
  const light = v3.norm(v3.add(v3.add(v3.mul(cam.R, (o.light || [-0.55, 0.65, 0.55])[0]), v3.mul(cam.U, (o.light || [-0.55, 0.65, 0.55])[1])), v3.mul(cam.V, (o.light || [-0.55, 0.65, 0.55])[2])));
  const depth = new Float32Array(N).fill(Infinity), pid = new Int16Array(N).fill(-1), nrm = new Float32Array(N * 3), lpt = new Float32Array(N * 3), wpt = new Float32Array(N * 3);
  parts.forEach((p, k) => {
    const sx = v3.dot(p.c, cam.R) * ppu + feet[0], sy = feet[1] - v3.dot(p.c, cam.U) * ppu, r = radius(p) * ppu + 1;
    const x0 = max(0, Math.floor(sx - r)), x1 = min(w - 1, Math.ceil(sx + r)), y0 = max(0, Math.floor(sy - r)), y1 = min(h - 1, Math.ceil(sy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const a = (x + 0.5 - feet[0]) / ppu, b = (feet[1] - (y + 0.5)) / ppu, origin = v3.add(v3.add(v3.mul(cam.R, a), v3.mul(cam.U, b)), v3.mul(cam.V, 600));
      const q = hit(p, origin, cam.D); if (!q) continue; const i = y * w + x; if (q.t >= depth[i]) continue;
      depth[i] = q.t; pid[i] = k; nrm.set(q.n, i * 3); lpt.set(q.lp, i * 3); wpt.set([origin[0] + cam.D[0] * q.t, origin[1] + cam.D[1] * q.t, origin[2] + cam.D[2] * q.t], i * 3);
    }
  });
  const out = new Uint8ClampedArray(N * 4), sky = [0.62, 0.66, 0.78], gnd = [0.42, 0.34, 0.26], clamp = (x) => (x < 0 ? 0 : x > 255 ? 255 : x);
  const ol = o.outline || [26, 16, 10];
  for (let i = 0; i < N; i++) {
    const k = pid[i]; if (k < 0) continue; const m = parts[k].mat, n = [nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]], lp = [lpt[i * 3], lpt[i * 3 + 1], lpt[i * 3 + 2]], wp = [wpt[i * 3], wpt[i * 3 + 1], wpt[i * 3 + 2]];
    let col = m.col, tx = m.tex ? m.tex(lp, wp) : null; if (tx) col = typeof tx === 'number' ? [col[0] * tx, col[1] * tx, col[2] * tx] : tx;
    const ndl = v3.dot(n, light), diff = max(0, ndl * 0.85 + 0.15), hemi = n[1] * 0.5 + 0.5, amb = [gnd[0] + (sky[0] - gnd[0]) * hemi, gnd[1] + (sky[1] - gnd[1]) * hemi, gnd[2] + (sky[2] - gnd[2]) * hemi];
    const rim = max(0, 1 - max(0, v3.dot(n, cam.V))) ** 3 * (o.rim ?? 0.18), half = v3.norm(v3.add(light, cam.V)), sp = (m.spec || 0) * max(0, v3.dot(n, half)) ** (m.shine || 24);
    // przyziemienie: dolne partie ciemniejsze (ambient occlusion od podłoża), cień własny pod okapami przez mnożnik wysokości
    const ao = 0.78 + 0.22 * min(1, max(0, wp[1] + 4) / 40);
    let r = 0, g = 0, b = 0;
    for (let c = 0; c < 3; c++) { const base = col[c] * (amb[c] * 0.62 * ao + diff * (0.72 + 0.28 * (c === 0 ? 1 : 0.92)) * (c === 2 ? 0.94 : 1)) + 255 * sp + 255 * rim * 0.5 + (m.emit ? m.emit[c] : 0); if (c === 0) r = base; else if (c === 1) g = base; else b = base; }
    const gn = o.gain || 1; out[i * 4] = clamp(r * gn); out[i * 4 + 1] = clamp(g * gn); out[i * 4 + 2] = clamp(b * gn); out[i * 4 + 3] = 255;
  }
  // kontur: sylwetka (sąsiad bez bryły) i krawędzie między bryłami, gdy sąsiad jest wyraźnie bliżej kamery
  const mark = new Uint8Array(N), ow = o.outlineW || 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (pid[i] < 0) continue;
    for (let dy = -ow; dy <= ow; dy++) for (let dx = -ow; dx <= ow; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || pid[yy * w + xx] < 0) mark[i] = 2; }
    if (mark[i] === 2) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (y + dy) * w + x + dx; if (pid[j] !== pid[i] && depth[j] < depth[i] - 4 / ppu) mark[i] = max(mark[i], 1); }
  }
  for (let i = 0; i < N; i++) {
    if (!mark[i]) continue; const k = 0.82 * (mark[i] === 2 ? 1 : 0.55); for (let c = 0; c < 3; c++) out[i * 4 + c] = out[i * 4 + c] * (1 - k) + ol[c] * k;
  }
  return { data: out, w, h, pid, depth };
}
