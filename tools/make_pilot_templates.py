#!/usr/bin/env python3
"""Szablony do generowania obrazów: (1) siatka areny 11 x 9 w rzucie gry, (2) arkusz skali z sylwetką bohatera. Wynik w docs/pilot/."""
import os
from PIL import Image, ImageDraw, ImageFont
out = os.path.join(os.path.dirname(__file__), '..', 'docs', 'pilot'); os.makedirs(out, exist_ok=True)
K = 2; COLS, ROWS, TW, TH = 11, 9, 72, 36
W, H = (COLS + ROWS) * 36 + 40, (COLS + ROWS) * 18 + 116; OX, OY = ROWS * 36 + 20, 84
sc = lambda x, y: (K * (OX + (x - y) * TW / 2), K * (OY + (x + y) * TH / 2))
im = Image.new('RGB', (W * K, H * K), (58, 50, 44)); d = ImageDraw.Draw(im)
for y in range(ROWS):
    for x in range(COLS):
        c = [sc(x, y), sc(x + 1, y), sc(x + 1, y + 1), sc(x, y + 1)]
        fill = (70, 92, 130) if x < 3 else ((120, 56, 50) if x >= COLS - 3 else (88, 78, 68))
        d.polygon(c, fill=fill, outline=(235, 220, 190))
d.polygon([sc(0, 0), sc(COLS, 0), sc(COLS, ROWS), sc(0, ROWS)], outline=(255, 190, 90), width=4)
f = ImageFont.load_default()
d.text((20, 20), 'SZABLON AREny 11 x 9: rzut izometryczny 2:1, kafel 72 x 36 px swiata (x2 = 144 x 72 px)', fill=(255, 255, 255), font=f)
d.text((20, 38), 'niebieskie = start gracza, czerwone = wrogowie. Podloga ma wypelnic caly romb, sciany dopiero za gorna krawedzia.', fill=(255, 255, 255), font=f)
im.save(os.path.join(out, 'szablon-areny.png'))
# arkusz skali: wysokości w pikselach świata (postać 62 px), linijka co 10
S = 6; sh = Image.new('RGB', (900, 560), (240, 236, 226)); d = ImageDraw.Draw(sh); base = 520
for i in range(0, 90, 10): y = base - i * S * 0.9; d.line([(0, y), (900, y)], fill=(200, 196, 186)); d.text((6, y - 11), f'{i} px', fill=(120, 110, 100), font=f)
def person(x):
    d.ellipse([x - 15, base - 62 * S * 0.9, x + 15, base - 62 * S * 0.9 + 30], fill=(60, 60, 70)); d.rectangle([x - 14, base - 62 * S * 0.9 + 28, x + 14, base], fill=(60, 60, 70))
person(70); d.text((40, base + 8), 'bohater 62', fill=(40, 40, 40), font=f)
for name, hh, x in [('beczka 37', 37, 160), ('latarnia 56', 56, 240), ('krzew 30', 30, 330), ('drzwi chaty 50', 50, 420), ('dab 221', 221, 520)]:
    top = base - min(hh, 90) * S * 0.9; d.rectangle([x, top, x + 50, base], outline=(160, 60, 40), width=3); d.text((x - 6, base + 8), name, fill=(40, 40, 40), font=f)
sh.save(os.path.join(out, 'szablon-skali.png')); print('gotowe', out)
