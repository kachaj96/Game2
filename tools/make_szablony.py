# Szablony geometrii dla generatora obrazów (mapy/SPEC.md): szara bryła w izometrii 30 stopni, odcisk, sylwetka bohatera dla skali.
from PIL import Image, ImageDraw
import math, os
SS = 2; N = 1024
OUT = os.path.join(os.path.dirname(__file__), '..', 'mapy', 'szablony')
BG = (150, 150, 150)

def mk(name, f):
    im = Image.new('RGB', (N * SS, N * SS), BG); d = ImageDraw.Draw(im)
    f(d); im = im.resize((N, N), Image.LANCZOS); im.save(os.path.join(OUT, name + '.png')); print(name)

def frame(w, d_, hpx, sc):
    """punkt S odcisku w x d kafli tak, by całość (podstawa + wysokość + bohater) mieściła się w kadrze"""
    base_w = (w + d_) * 72 * sc; top = (hpx + (w + d_) * 36) * sc
    return (N * SS / 2 + (w - d_) * 36 * sc * SS * 0 , N * SS / 2 + top * SS / 2 - (w + d_) * 18 * sc * SS)

def P(s, sc, ox, oy):
    return lambda x, y, z=0: ((ox + (x * 72 - y * 72) * sc) * SS, (oy + (x * 42 + y * 42) * sc - z * sc) * SS)

def poly(d, pts, fill, line=None):
    d.polygon(pts, fill=fill, outline=line)

def diamond(d, p, w, dd):
    pts = [p(0, 0), p(-w, 0), p(-w, -dd), p(0, -dd)]
    d.line(pts + [pts[0]], fill=(90, 90, 90), width=3 * SS)

def hero(d, p, x, y, sc):
    cx, cy = p(x, y); h = 128 * sc * SS; w = 40 * sc * SS
    d.ellipse([cx - w * .28, cy - h, cx + w * .28, cy - h + w * .56], fill=(60, 60, 60))
    d.rounded_rectangle([cx - w / 2, cy - h + w * .5, cx + w / 2, cy - h * .38], 10, fill=(60, 60, 60))
    d.rectangle([cx - w * .4, cy - h * .38, cx + w * .4, cy], fill=(60, 60, 60))

LEFT, RIGHT, TOP = (95, 95, 100), (190, 190, 195), (225, 225, 228)

def box(d, p, x0, y0, x1, y1, z0, z1):
    # kafle: x rośnie w prawo-dół, y w lewo-dół, punkty w układzie odcisku (S w (0,0), odcisk to [-w,0] x [-dd,0])
    S0, L0, R0 = (x1, y1), (x0, y1), (x1, y0)
    poly(d, [p(*S0, z0), p(*L0, z0), p(*L0, z1), p(*S0, z1)], LEFT)
    poly(d, [p(*S0, z0), p(*R0, z0), p(*R0, z1), p(*S0, z1)], RIGHT)
    poly(d, [p(*S0, z1), p(*L0, z1), p(x0, y0, z1), p(*R0, z1)], TOP)

def cyl(d, p, cx, cy, r, z0, z1):
    def ell(z):
        pts = [p(cx + r * math.cos(a), cy + r * math.sin(a), z) for a in [i * math.pi / 30 for i in range(60)]]
        return pts
    b, t = ell(z0), ell(z1)
    xs = [q[0] for q in b]; lo, hi = min(xs), max(xs)
    d.rectangle([lo, min(q[1] for q in t) + (max(q[1] for q in t) - min(q[1] for q in t)) / 2, hi, min(q[1] for q in b) + (max(q[1] for q in b) - min(q[1] for q in b)) / 2], fill=(118, 118, 124))
    d.polygon(b, fill=(118, 118, 124)); d.polygon(t, fill=TOP)

def ellipsoid(d, p, cx, cy, z, rx, rz, fill):
    c = p(cx, cy, z); d.ellipse([c[0] - rx * SS, c[1] - rz * SS, c[0] + rx * SS, c[1] + rz * SS], fill=fill)

def scene(w, dd, hpx, build, sc, hero_xy=None):
    def f(d):
        p = P(None, sc, N / 2 + 100, N / 2 + (hpx + 0) * sc / 2 + (w + dd) * 9 * sc)
        diamond(d, p, w, dd)
        build(d, p)
        hero(d, p, *(hero_xy or (0.9, 0.2)), sc)
    return f

# 1 chata 3x3, ściana 72 j, szczyt dachu 140 j (px w pliku = j * 2)
def chata(d, p):
    box(d, p, -3, -3, 0, 0, 0, 144)
    a = p(-1.5, -1.5, 280)
    for pts, c in (([p(0, 0, 144), p(-3, 0, 144), a], LEFT), ([p(0, 0, 144), p(0, -3, 144), a], RIGHT)):
        poly(d, pts, tuple(int(v * .92) for v in c))
    box(d, p, -1.7, -0.02, -0.9, 0, 0, 100)  # drzwi jako wnęka-plama
# 2 drzewo
def drzewo(d, p):
    cyl(d, p, -0.5, -0.5, 0.2, 0, 330)
    ellipsoid(d, p, -0.5, -0.5, 300, 190, 130, (110, 110, 116))
    ellipsoid(d, p, -0.3, -0.45, 330, 90, 70, (118, 118, 124))
# 3 studnia
def studnia(d, p):
    cyl(d, p, -0.5, -0.5, 0.42, 0, 52)
    for x in (-0.9, -0.1): box(d, p, x - .04, -0.54, x + .04, -0.46, 52, 88)
    box(d, p, -1.0, -0.65, 0.0, -0.35, 88, 100)
# 4 skrzynia
def skrzynia(d, p):
    box(d, p, -0.82, -0.82, -0.18, -0.18, 0, 56)
# 5 lampa
def lampa(d, p):
    cyl(d, p, -0.5, -0.5, 0.05, 0, 220)
    box(d, p, -0.62, -0.62, -0.38, -0.38, 220, 250)

mk('szablon_chata_3x3', scene(3, 3, 280, chata, 1.05, (1.6, 0.4)))
mk('szablon_drzewo_1x1', scene(1, 1, 440, drzewo, 1.0, (1.6, 0.4)))
mk('szablon_studnia_1x1', scene(1, 1, 100, studnia, 2.0, (1.7, 0.4)))
mk('szablon_skrzynia_1x1', scene(1, 1, 56, skrzynia, 2.6, (1.7, 0.4)))
mk('szablon_lampa_1x1', scene(1, 1, 250, lampa, 1.7, (1.7, 0.4)))
