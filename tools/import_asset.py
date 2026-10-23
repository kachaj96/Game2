#!/usr/bin/env python3
"""Import wygenerowanego obrazu do gry: czyści półprzezroczyste tło i poświatę, przycina do obiektu, skaluje i zapisuje do www/img/.
Użycie: python3 tools/import_asset.py surowy.png klucz --world-w 28 [--foot 3] [--px-per-unit 7] [--out www/img]
  klucz     nazwa pliku i wpisu w src/art/assets.js (np. beczka)
  world-w   szerokość obiektu w grze (piksele świata; postać ma około 62 px wysokości)
  foot      ile pikseli świata od dołu obrazu leży punkt podstawy (domyślnie 3% wysokości)
  px-per-unit ile pikseli pliku na piksel świata (domyślnie 7: ostrość do przybliżenia 1.6 na ekranie 2x)
Wypisuje gotowy wpis do ASSETS."""
import argparse, os, sys
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('key'); ap.add_argument('--world-w', type=float, required=True)
ap.add_argument('--foot', type=float, default=None); ap.add_argument('--px-per-unit', type=float, default=7); ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'www', 'img'))
ap.add_argument('--lo', type=float, default=70, help='alfa poniżej tego znika (poświata)'); ap.add_argument('--span', type=float, default=60)
a = ap.parse_args()
im = Image.open(a.src).convert('RGBA'); arr = np.array(im).astype(np.float32)
if arr[:, :, 3].min() > 250:   # brak przezroczystości: tło wycinamy po kolorze rogów (flood-fill zastępczo: odległość od koloru w rogach)
    corner = np.median(np.concatenate([arr[:6, :6, :3].reshape(-1, 3), arr[-6:, -6:, :3].reshape(-1, 3), arr[:6, -6:, :3].reshape(-1, 3), arr[-6:, :6, :3].reshape(-1, 3)]), axis=0)
    d = np.linalg.norm(arr[:, :, :3] - corner, axis=2); arr[:, :, 3] = np.clip((d - 18) / 22, 0, 1) * 255
    print('UWAGA: obraz bez przezroczystości, tło wycięto po kolorze. Lepiej generować z przezroczystym tłem.', file=sys.stderr)
arr[:, :, 3] = np.clip((arr[:, :, 3] - a.lo) / a.span, 0, 1) * 255
ys, xs = np.where(arr[:, :, 3] > 20)
if not len(xs): sys.exit('pusty obraz po czyszczeniu')
im2 = Image.fromarray(arr.astype(np.uint8)).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); w, h = im2.size
tw = min(w, max(16, round(a.world_w * a.px_per_unit)))   # nie powiększamy ponad oryginał
th = round(h * tw / w); im2 = im2.resize((tw, th), Image.LANCZOS)
os.makedirs(a.out, exist_ok=True); path = os.path.join(a.out, a.key + '.png'); im2.save(path, optimize=True)
wh = round(a.world_w * h / w); foot = a.foot if a.foot is not None else round(wh * 0.03)
print(f'zapisano {path} ({tw}x{th}, {os.path.getsize(path)//1024} KB)')
print(f"  {a.key}: {{ src: 'img/{a.key}.png', w: {a.world_w:g}, h: {wh}, foot: {foot:g} }},")
