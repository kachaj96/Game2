# Przygotowanie grafik do gry: przycięcie do obiektu, skalowanie do tabeli (mapy/SPEC.md), kotwice, klatki chodu.
# Wejście: mapy/biblioteka/*.png (surowe z generatora). Wyjście: mapy/gra/*.png + mapy/gra/biblioteka.json (rozmiary w px pliku 2x).
import json, os
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..', 'mapy'); B = os.path.join(R, 'biblioteka'); G = os.path.join(R, 'gra')
os.makedirs(G, exist_ok=True)
HERO_PX = 160   # bohater 80 j = 160 px w pliku 2x

def crop(im, thr=16):
    a = np.asarray(im)[..., 3] >= thr; ys = np.where(a.any(1))[0]; xs = np.where(a.any(0))[0]
    return im.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))

def save(im, name, scale):
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS); im.save(os.path.join(G, name + '.png'), optimize=True); return im

# sprite: plik, skala względem oryginału, odcisk w kaflach, wysokość w j, podstawa (corner = róg S, center = środek odcisku), zanikanie
SPR = {
    'chata':    dict(f='dom_chata_01.png',     k=0.60, w=3, d=3, h=140, base='corner', fade=True),
    'dab':      dict(f='drzewo_dab_01.png',    k=0.40, w=1, d=1, h=200, base='center', fade=True),
    'studnia':  dict(f='studnia_01.png',       k=0.18, w=1, d=1, h=100, base='center', fade=False),
    'lampa':    dict(f='lampa_zelazna_01.png', k=0.23, w=1, d=1, h=135, base='center', fade=False),
    'skrzynia': dict(f='skrzynia_01.png',      k=0.09, w=1, d=1, h=45,  base='corner', fade=False),
}
lib = {'sprites': {}, 'hero': {}}
for n, s in SPR.items():
    im = crop(Image.open(os.path.join(B, s['f'])).convert('RGBA')); out = save(im, n, s['k'])
    lib['sprites'][n] = dict(file=n + '.png', w=out.width, h=out.height, footprint=dict(w=s['w'], d=s['d']), height=s['h'], base=s['base'], fade=s['fade'])

# bohater: dwa widoki spoczynkowe z arkusza (SW przodem, NE tyłem), kotwica pod stopami
sheet = Image.open(os.path.join(B, 'postac_grabarz_01.png')).convert('RGBA'); a = np.asarray(sheet)[..., 3] >= 16
cut = 776   # przerwa między postaciami
def feet_x(im):
    m = np.asarray(im)[..., 3] >= 16; ys = np.where(m.any(1))[0]; h = ys[-1] - ys[0] + 1; foot = m[ys[-1] - int(h * .08):ys[-1] + 1]; X = np.arange(m.shape[1]); return float((foot.sum(0) * X).sum() / foot.sum())
for name, box in (('idle_sw', (0, 0, cut, 1024)), ('idle_ne', (cut, 0, 1536, 1024))):
    c = crop(sheet.crop(box)); k = HERO_PX / c.height; fx = feet_x(c) * k; out = save(c, 'bohater_' + name, k)
    lib['hero'][name] = dict(file='bohater_' + name + '.png', w=out.width, h=out.height, ax=round(fx, 1))

# chód W: 6 klatek z paska, cięcie w dolinach zajętości kolumn
strip = Image.open(os.path.join(B, 'postac_grabarz_chod_W_01.png')).convert('RGBA'); m = np.asarray(strip)[..., 3] >= 16
col = np.convolve(m.sum(0).astype(float), np.ones(9) / 9, mode='same'); bounds = [0]
for i in range(1, 6):
    c0 = int(i * 1536 / 6); lo, hi = c0 - 45, c0 + 45; bounds.append(lo + int(np.argmin(col[lo:hi])))
bounds.append(1536); ys = np.where(m.any(1))[0]; y0, y1 = ys[0], ys[-1] + 1
frames = []; k = HERO_PX / (y1 - y0)
for i in range(6):
    fr = strip.crop((bounds[i], y0, bounds[i + 1], y1)); ar = np.asarray(fr)[..., 3] >= 16; xs = np.where(ar.any(0))[0]; fr = fr.crop((xs[0], 0, xs[-1] + 1, fr.height))
    fx = feet_x(fr) * k; out = save(fr, f'bohater_chod_w{i}', k); frames.append(dict(file=f'bohater_chod_w{i}.png', w=out.width, h=out.height, ax=round(fx, 1)))
lib['hero']['walk_w'] = frames
# podłoże jako JPEG (pełny obraz, bez alfy)
Image.open(os.path.join(B, 'podloze_droga_01.png')).convert('RGB').save(os.path.join(G, 'podloze_droga_01.jpg'), quality=90)
lib['ground'] = dict(file='podloze_droga_01.jpg', w=1536, h=1024)
json.dump(lib, open(os.path.join(G, 'biblioteka.json'), 'w'), indent=1, ensure_ascii=False)
print('OK', {k: (v['w'], v['h']) for k, v in lib['sprites'].items()}, [f['w'] for f in frames])
