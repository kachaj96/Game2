// Gotowe obrazy (generowane poza grą) dla wybranych obiektów. Reszta świata dalej jest rysowana kodem, a każdy obiekt tutaj ma kod jako zapas:
// dopóki obraz się nie wczyta (albo gdy go brak, np. w testach), używany jest generator.
// w, h: rozmiar obrazu w pikselach świata; foot: ile pikseli od dołu obrazu leży punkt podstawy; lights: punkty światła jako ułamki obrazu [x, y].
export const ASSETS = {
  beczka: { src: 'img/beczka.png', w: 28, h: 37, foot: 3 },
  dab: { src: 'img/dab.png', w: 190, h: 221, foot: 6 },
  krypta: { src: 'img/krypta.png', w: 300, h: 362, foot: 14, lights: [[0.384, 0.633], [0.88, 0.542]] },
  sosna: { src: 'img/sosna.png', w: 130, h: 209, foot: 6 },
  brzoza: { src: 'img/brzoza.png', w: 180, h: 197, foot: 6 },
  martwe: { src: 'img/martwe.png', w: 120, h: 146, foot: 5 },
  glaz: { src: 'img/glaz.png', w: 70, h: 47, foot: 1 },
  krzew: { src: 'img/krzew.png', w: 44, h: 34, foot: 1 },
  skrzynia: { src: 'img/skrzynia.png', w: 28, h: 26, foot: 1 },
  latarnia: { src: 'img/latarnia.png', w: 22, h: 63, foot: 2, lights: [[0.3, 0.2]] },
  studnia: { src: 'img/studnia.png', w: 56, h: 74, foot: 2 },
  chata: { src: 'img/chata.png', w: 280, h: 270, foot: 32 },
  jama: { src: 'img/jama.png', w: 240, h: 160, foot: 5, lights: [[0.5, 0.55]] },
  nagrobek: { src: 'img/nagrobek.png', w: 30, h: 38, foot: 1 },
  pniak: { src: 'img/pniak.png', w: 40, h: 30, foot: 1 },
  przeszkoda1: { src: 'img/przeszkoda1.png', w: 66, h: 45, foot: 1 },
  przeszkoda2: { src: 'img/przeszkoda2.png', w: 46, h: 77, foot: 2 },
  stalagmit: { src: 'img/stalagmit.png', w: 56, h: 60, foot: 2 },
};
export function loadAssets(doc, onLoad) {
  const out = {}; if (!doc || !doc.defaultView || !doc.defaultView.Image) return out;
  for (const [k, a] of Object.entries(ASSETS)) { const im = new doc.defaultView.Image(); im.onload = () => { out[k] = im; onLoad && onLoad(k); }; im.src = a.src; }
  return out;   // klucz pojawia się dopiero po wczytaniu
}
// rysuje obraz do podstawy (0,0) w skali świata, opcjonalnie odbity w poziomie
export function drawAsset(g, im, key, ax, ay, { flip = false, sc = 1 } = {}) {
  const a = ASSETS[key], w = a.w * sc, h = a.h * sc;
  g.save(); g.translate(ax, ay + a.foot * sc); if (flip) g.scale(-1, 1); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h, w, h); g.restore();
}
export const assetDim = (key, sc = 1) => { const a = ASSETS[key], w = a.w * sc, h = a.h * sc; return [Math.ceil(w) + 4, Math.ceil(h + a.foot * sc) + 4, Math.ceil(w / 2) + 2, Math.ceil(h) + 2]; };
