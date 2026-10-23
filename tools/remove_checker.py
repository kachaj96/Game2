#!/usr/bin/env python3
"""Usuwa "szachownicę" wypieczoną w obrazie (generatory często zapisują ją zamiast prawdziwej przezroczystości).
Użycie: python3 tools/remove_checker.py wejscie.jpg wyjscie.png
Metoda: z brzegów obrazu zalewamy obszar szarych pikseli o wartościach dwóch najczęstszych odcieni szachownicy, potem czyścimy halo na obrysie
i zostawiamy tylko duże spójne obszary (drobne zabłąkane plamki znikają)."""
import sys
from collections import deque
import numpy as np
from PIL import Image

def remove(src, tol=18):
    im = Image.open(src).convert('RGB'); a = np.array(im).astype(np.int16); H, W, _ = a.shape
    neutral = (np.abs(a[:, :, 0] - a[:, :, 1]) < 9) & (np.abs(a[:, :, 1] - a[:, :, 2]) < 9); g = a.mean(axis=2)
    border = np.concatenate([g[0], g[-1], g[:, 0], g[:, -1]]); nb = np.concatenate([neutral[0], neutral[-1], neutral[:, 0], neutral[:, -1]])
    vals = np.round(border[nb]).astype(int); hist = np.bincount(vals, minlength=256).astype(float); hist = np.convolve(hist, np.ones(7), 'same')
    m1 = int(hist.argmax()); h2 = hist.copy(); h2[max(0, m1 - 20):m1 + 21] = 0; m2 = int(h2.argmax()) if h2.max() > hist.max() * 0.05 else m1
    ok = neutral & ((np.abs(g - m1) <= tol) | (np.abs(g - m2) <= tol))
    bg = np.zeros((H, W), bool); q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if ok[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if ok[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and ok[ny, nx] and not bg[ny, nx]: bg[ny, nx] = True; q.append((ny, nx))
    # kieszenie szachownicy zamknięte w obiekcie (między gałęziami, pod daszkiem): spójne obszary "szachownicowych" pikseli, w których są oba odcienie
    seen = np.zeros((H, W), bool)
    for y0 in range(H):
        for x0 in range(W):
            if ok[y0, x0] and not bg[y0, x0] and not seen[y0, x0]:
                comp = [(y0, x0)]; seen[y0, x0] = True; q = deque([(y0, x0)])
                while q:
                    y, x = q.popleft()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx < W and ok[ny, nx] and not bg[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((ny, nx)); comp.append((ny, nx))
                if len(comp) >= 6 and m1 != m2:
                    v = np.array([g[y, x] for y, x in comp]); f1 = np.mean(np.abs(v - m1) <= tol); f2 = np.mean(np.abs(v - m2) <= tol)
                    ys_, xs_ = zip(*comp); y0_, y1_, x0_, x1_ = max(0, min(ys_) - 3), min(H, max(ys_) + 4), max(0, min(xs_) - 3), min(W, max(xs_) + 4)
                    near_bg = bg[y0_:y1_, x0_:x1_].any()
                    if (min(f1, f2) >= 0.18 and len(comp) >= 12) or (near_bg and len(comp) <= 600 and max(f1, f2) >= 0.85):
                        for y, x in comp: bg[y, x] = True
    fg = ~bg
    # halo: neutralne jasne piksele tuż przy tle (anty-aliasing szachownicy) usuwamy w 2 przejściach
    for _ in range(2):
        near = np.zeros_like(bg); near[1:] |= bg[:-1]; near[:-1] |= bg[1:]; near[:, 1:] |= bg[:, :-1]; near[:, :-1] |= bg[:, 1:]
        kill = fg & near & neutral & ((np.abs(g - m1) <= tol + 22) | (np.abs(g - m2) <= tol + 22)); bg |= kill; fg = ~bg
    # tylko duże spójne obszary
    lab = np.zeros((H, W), np.int32); sizes = []; n = 0
    for y0 in range(H):
        for x0 in range(W):
            if fg[y0, x0] and not lab[y0, x0]:
                n += 1; lab[y0, x0] = n; q = deque([(y0, x0)]); c = 0
                while q:
                    y, x = q.popleft(); c += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
                sizes.append(c)
    keep = np.zeros(n + 1, bool); big = max(sizes) if sizes else 0
    for i, s in enumerate(sizes, 1): keep[i] = s >= big * 0.03
    fg = keep[lab] & fg
    alpha = fg.astype(np.float32)
    # miękka krawędź: lekkie rozmycie kanału alfa
    p = np.pad(alpha, 1, mode='edge'); soft = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] + 4 * alpha) / 8
    out = np.dstack([a.astype(np.uint8), (np.where(fg, np.clip(soft * 1.4, 0, 1), np.clip(soft - 0.3, 0, 1) * 1.4) * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA'), (m1, m2)

if __name__ == '__main__':
    im, cols = remove(sys.argv[1]); im.save(sys.argv[2]); print('tło szachownicy:', cols, '->', sys.argv[2])
