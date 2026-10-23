// Gotowe obrazy (generowane poza grą) dla wybranych obiektów. Reszta świata dalej jest rysowana kodem, a każdy obiekt tutaj ma kod jako zapas:
// dopóki obraz się nie wczyta (albo gdy go brak, np. w testach), używany jest generator.
// w, h: rozmiar obrazu w pikselach świata; foot: ile pikseli od dołu obrazu leży punkt podstawy; lights: punkty światła jako ułamki obrazu [x, y].
export const ASSETS = {
  beczka: { src: 'img/beczka.png', w: 28, h: 37, foot: 3 },
  dab: { src: 'img/dab.png', w: 190, h: 221, foot: 6 },
  krypta: { src: 'img/krypta.png', w: 300, h: 362, foot: 14, lights: [[0.384, 0.633], [0.88, 0.542]] },
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
