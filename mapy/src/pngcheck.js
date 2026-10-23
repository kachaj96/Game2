// Sprawdzanie PNG pod specyfikację mapy v3 (mapy/SPEC.md, sekcje 8 i 10). Czysta logika na surowych pikselach RGBA,
// bez DOM. Działa w przeglądarce jako zwykły skrypt (globalThis.PngCheck), więc strona sprawdz.html działa też otwarta z pliku,
// a w node wystarczy `import` dla efektu ubocznego i odczyt globalThis.PngCheck.
(function () {
  const TW = 72, TH = 36, S = 2;                  // kafel w j; pliki są w skali 2x
  const MARGIN = 8, MAXSIDE = 1024, ALPHA_ON = 16;

  const isKey = (r, g, b) => r > 200 && b > 200 && g < 90;            // tło #FF00FF (z tolerancją)
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  // opts: { kind: 'bryla' | 'okragly' | 'podloze', w, d (odcisk w kaflach), hj (wysokość obiektu w j, opcjonalnie) }
  function analyze(rgba, W, H, opts = {}) {
    const kind = opts.kind || 'bryla', w = opts.w || 1, d = opts.d || 1, hj = opts.hj;
    const checks = [], add = (id, level, msg) => checks.push({ id, level, msg });
    const N = W * H, A = (i) => rgba[i * 4 + 3];

    if (Math.max(W, H) > MAXSIDE) add('rozmiar', 'fail', `Za duży plik: ${W}x${H}, dłuższy bok ma mieć najwyżej ${MAXSIDE} px.`);
    else add('rozmiar', 'ok', `Rozmiar ${W}x${H} px.`);

    // --- przezroczystość ---
    let transparent = 0, opaqueAll = true;
    for (let i = 0; i < N; i++) { const a = A(i); if (a < 250) opaqueAll = false; if (a < ALPHA_ON) transparent++; }
    let keyed = false;                                // czy obiekt trzeba najpierw wyciąć z jednolitego tła
    const eff = new Uint8Array(N);                    // efektywna alfa po ewentualnym usunięciu tła
    for (let i = 0; i < N; i++) eff[i] = A(i);

    if (kind === 'podloze') {
      add('alfa', opaqueAll ? 'ok' : 'warn', opaqueAll ? 'Podłoże jest pełnym obrazem (bez przezroczystości), jak trzeba.' : 'Podłoże ma przezroczyste dziury. Zwykle ma być pełne.');
    } else if (opaqueAll) {
      const ring = borderPixels(rgba, W, H);
      const checker = looksLikeChecker(rgba, W, H);
      const keyFrac = ring.filter(([r, g, b]) => isKey(r, g, b)).length / ring.length;
      if (checker) add('alfa', 'fail', 'Fałszywa przezroczystość: w tle jest namalowana szachownica. Wygeneruj na tle #FF00FF albo z prawdziwą alfą.');
      else if (keyFrac > 0.9) {
        keyed = true; add('alfa', 'warn', 'Brak alfy, ale tło to #FF00FF. Do użycia po wycięciu tła narzędziem (reszta testów liczona po wycięciu).');
        for (let i = 0; i < N; i++) if (isKey(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2])) eff[i] = 0;
      } else add('alfa', 'fail', 'Brak przezroczystości i tło nie jest jednolitym #FF00FF. Nie da się go automatycznie wyciąć.');
    } else add('alfa', 'ok', `Prawdziwa przezroczystość (${(100 * transparent / N).toFixed(0)}% pikseli przezroczystych).`);

    if (kind === 'podloze') return podloze(rgba, W, H, checks, add);

    // --- obwiednia i margines ---
    let x0 = W, y0 = H, x1 = -1, y1 = -1, cnt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (eff[y * W + x] >= ALPHA_ON) { cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (!cnt) { add('obiekt', 'fail', 'Nie ma żadnego widocznego piksela.'); return result(checks, { W, H }); }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, ml = x0, mr = W - 1 - x1, mt = y0, mb = H - 1 - y1, mm = Math.min(ml, mr, mt, mb);
    add('margines', mm >= MARGIN ? 'ok' : mm === 0 ? 'fail' : 'warn',
      mm >= MARGIN ? `Margines co najmniej ${MARGIN} px (najmniejszy ${mm}).` : mm === 0 ? 'Obiekt dotyka krawędzi pliku, możliwe że jest ucięty.' : `Margines za mały: najmniejszy ${mm} px, ma być ${MARGIN}.`);
    const stats = { W, H, bbox: [x0, y0, x1, y1], bw, bh };

    // --- krawędź: obwódka z tła i rozmycie ---
    let edge = 0, magenta = 0, soft = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; if (eff[i] < ALPHA_ON) continue;
      if (eff[i - 1] >= ALPHA_ON && eff[i + 1] >= ALPHA_ON && eff[i - W] >= ALPHA_ON && eff[i + W] >= ALPHA_ON) continue;
      edge++; const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
      if (r > 150 && b > 150 && g < 110 && r - g > 70 && b - g > 70) magenta++;
      if (eff[i] < 230) soft++;
    }
    if (edge) {
      const mf = magenta / edge, sf = soft / edge;
      add('obwodka', mf > 0.05 ? 'fail' : mf > 0.01 ? 'warn' : 'ok', mf > 0.01 ? `Różowa obwódka z tła na ${(mf * 100).toFixed(0)}% krawędzi. Wytnij tło ostrzej.` : 'Brak obwódki z tła.');
      if (!keyed) add('krawedz', sf > 0.6 ? 'warn' : 'ok', sf > 0.6 ? `Krawędź jest rozmyta (${(sf * 100).toFixed(0)}% półprzezroczystych pikseli). Ma być ostra.` : 'Krawędź jest ostra.');
    }

    // --- cień pod obiektem (sprite ma być bez cienia) ---
    let shadow = 0; const by0 = y0 + Math.floor(bh * 0.66);
    for (let y = by0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x, a = A(i); if (!keyed && a >= 10 && a <= 200 && lum(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) < 90) shadow++; }
    const sh = shadow / Math.max(1, bw * (y1 - by0 + 1));
    add('cien', sh > 0.04 ? 'warn' : 'ok', sh > 0.04 ? 'Wygląda na to, że pod obiektem jest cień rzucony na ziemię. Ma go nie być, cień rysuje silnik.' : 'Brak cienia pod obiektem.');

    // --- rzut 2:1: nachylenie podstawy (tylko bryły) ---
    if (kind === 'bryla') {
      const yb = new Int32Array(W).fill(-1);
      for (let x = x0; x <= x1; x++) for (let y = y1; y >= y0; y--) if (eff[y * W + x] >= 128) { yb[x] = y; break; }
      let ymax = -1; for (let x = x0; x <= x1; x++) if (yb[x] > ymax) ymax = yb[x];
      const xs = []; for (let x = x0; x <= x1; x++) if (yb[x] >= ymax - 1) xs.push(x);
      const xl = xs[0], xr = xs[xs.length - 1], span = Math.min(Math.floor(bw * 0.3), 90);
      const sl = slope(yb, Math.max(x0, xl - span), xl - 2), sr = slope(yb, xr + 2, Math.min(x1, xr + span));
      if (sl === null || sr === null || xl - span < x0 + 10) add('rzut', 'warn', 'Za mało krawędzi podstawy, żeby zmierzyć nachylenie 2:1.');
      else {
        const L = Math.abs(sl), R = Math.abs(sr), worst = Math.max(Math.abs(L - 0.5), Math.abs(R - 0.5)), good = sl > 0 && sr < 0;
        add('rzut', !good || worst > 0.15 ? 'fail' : worst > 0.07 ? 'warn' : 'ok',
          `Nachylenie podstawy: lewa ${L.toFixed(2)}, prawa ${R.toFixed(2)} (ma być 0,50).` + (worst > 0.07 ? ' Rzut odbiega od izometrii 2:1.' : ''));
      }
      stats.slopes = [sl, sr];
    }

    // --- skala względem tabeli ---
    if (hj) {
      const expH = hj * S + (w + d) * (TH / 2) * S, expW = (w + d) * (TW / 2) * S, rh = bh / expH, rw = bw / expW;
      add('skala', rh > 0.85 && rh < 1.15 ? 'ok' : rh > 0.7 && rh < 1.3 ? 'warn' : 'fail',
        `Wysokość ${bh} px, oczekiwana około ${Math.round(expH)} px (${Math.round(rh * 100)}%).`);
      add('szerokosc', rw >= 0.8 ? 'ok' : rw >= 0.6 ? 'warn' : 'fail', `Szerokość ${bw} px, podstawa ${w}x${d} ma co najmniej ${Math.round(expW * 0.8)} px (${Math.round(rw * 100)}% wzoru).`);
    }

    // --- światło z lewej góry: lewa strona ciemniejsza od prawej ---
    if (kind === 'bryla') {
      const t = Math.floor(bw / 3); let sL = 0, nL = 0, sR = 0, nR = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (eff[i] < 200) continue; const v = lum(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]); if (x < x0 + t) { sL += v; nL++; } else if (x > x1 - t) { sR += v; nR++; } }
      if (nL > 50 && nR > 50) {
        const mL = sL / nL, mR = sR / nR, q = mL / mR;
        add('swiatlo', q < 0.97 ? 'ok' : q > 1.1 ? 'warn' : 'ok', q > 1.1 ? `Lewa strona jaśniejsza od prawej (${mL.toFixed(0)} do ${mR.toFixed(0)}). Światło ma padać z lewej, czyli lewa ciemniejsza.` : q < 0.97 ? 'Lewa strona ciemniejsza od prawej, zgodnie ze światłem z lewej góry.' : 'Światło płaskie (lewa i prawa podobne), do oceny wzrokiem.');
      }
    }
    return result(checks, stats);
  }

  function podloze(rgba, W, H, checks, add) {
    const cell = (x, y, w, h) => { let s = 0, n = 0; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const k = (j * W + i) * 4; s += lum(rgba[k], rgba[k + 1], rgba[k + 2]); n++; } return s / Math.max(1, n); };
    const cw = Math.floor(W * 0.12), ch = Math.floor(H * 0.12);
    const corners = (cell(0, 0, cw, ch) + cell(W - cw, 0, cw, ch) + cell(0, H - ch, cw, ch) + cell(W - cw, H - ch, cw, ch)) / 4, center = cell(Math.floor(W * 0.3), Math.floor(H * 0.3), Math.floor(W * 0.4), Math.floor(H * 0.4));
    const q = corners / Math.max(1, center);
    add('winieta', q < 0.75 ? 'warn' : 'ok', q < 0.75 ? `Rogi są ciemniejsze od środka (${Math.round(q * 100)}%): wygląda na winietę. Ma jej nie być, światło dodaje gra.` : 'Brak winiety.');
    // ostrość: średni moduł gradientu na próbce pikseli
    let g = 0, n = 0; for (let y = 1; y < H - 1; y += 2) for (let x = 1; x < W - 1; x += 2) { const k = (y * W + x) * 4, l = lum(rgba[k], rgba[k + 1], rgba[k + 2]), r = lum(rgba[k + 4], rgba[k + 5], rgba[k + 6]), dn = lum(rgba[k + W * 4], rgba[k + W * 4 + 1], rgba[k + W * 4 + 2]); g += Math.abs(r - l) + Math.abs(dn - l); n++; }
    const sharp = g / Math.max(1, n);
    add('ostrosc', sharp < 3 ? 'warn' : 'ok', sharp < 3 ? `Obraz wygląda na rozmyty (średni gradient ${sharp.toFixed(1)}). Orientacyjnie, oceń wzrokiem.` : `Ostrość w normie (gradient ${sharp.toFixed(1)}).`);
    add('rozmiar2', W >= 1024 || H >= 1024 ? 'ok' : 'warn', W >= 1024 || H >= 1024 ? 'Rozdzielczość wystarczająca na powiększenie.' : `Rozdzielczość ${W}x${H} jest niska. Przy zoomie na telefonie obraz będzie miękki.`);
    return result(checks, { W, H });
  }

  function borderPixels(rgba, W, H) {
    const out = [], push = (x, y) => { const k = (y * W + x) * 4; out.push([rgba[k], rgba[k + 1], rgba[k + 2]]); };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); } for (let y = 1; y < H - 1; y++) { push(0, y); push(W - 1, y); }
    return out;
  }

  // szachownica: wzdłuż górnego brzegu i w pierwszych wierszach tła powtarzają się dwa jasne szarości w stałym kroku
  function looksLikeChecker(rgba, W, H) {
    const grayish = (k) => Math.abs(rgba[k] - rgba[k + 1]) < 12 && Math.abs(rgba[k + 1] - rgba[k + 2]) < 12 && rgba[k] > 150;
    for (const y of [2, Math.floor(H / 40) + 2]) {
      let changes = 0, gray = 0, prev = -1;
      for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (!grayish(k)) continue; gray++; const v = rgba[k] > 232 ? 1 : 0; if (prev !== -1 && v !== prev) changes++; prev = v; }
      if (gray > W * 0.8 && changes >= Math.max(6, W / 64)) return true;
    }
    return false;
  }

  function slope(yb, a, b) {
    if (b - a < 8) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
    for (let x = a; x <= b; x++) { if (yb[x] < 0) continue; sx += x; sy += yb[x]; sxx += x * x; sxy += x * yb[x]; n++; }
    if (n < 8) return null; const den = n * sxx - sx * sx; return den ? (n * sxy - sx * sy) / den : null;
  }

  function result(checks, stats) { return { ok: !checks.some((c) => c.level === 'fail'), checks, stats }; }

  globalThis.PngCheck = { analyze, TW, TH, S, MARGIN, MAXSIDE };
})();
