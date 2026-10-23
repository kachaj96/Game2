// Rysowanie figur 3D na canvasie w grze: sprite jest renderowany raz dla (wygląd, kierunek, klatka chodu) i trzymany w pamięci podręcznej.
import { renderGrabarz } from './grabarz3d.js';
const CACHE = new Map(), PPU = 2, W = 220 * PPU, H = 260 * PPU, FEET = 24 * PPU, WORLD_PER_CM = 0.5;   // 1 cm modelu = 0,46 jednostki świata (bohater ma około 95 j)
const lookKey = (sp) => [sp.skin, sp.hair, sp.hairStyle, sp.beard, sp.female ? 1 : 0, sp.face && sp.face.shape, sp.outfit && sp.outfit.base, sp.outfit && sp.outfit.trim, JSON.stringify(sp.beltLantern)].join('|');
export function figureSprite(sp, dir, t) {
  const frame = t === undefined ? -1 : Math.floor(((t % 1) + 1) % 1 * 8) % 8, key = lookKey(sp) + '#' + dir + '#' + frame; let c = CACHE.get(key);
  if (!c) { const r = renderGrabarz(sp, { dir, t: frame < 0 ? undefined : frame / 8, ppu: PPU, w: W, h: H }); c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(new ImageData(r.data, W, H), 0, 0); CACHE.set(key, c); if (CACHE.size > 600) CACHE.delete(CACHE.keys().next().value); }
  return c;
}
// g: kontekst, (x, y): punkt pod stopami; o.ring: kolor kręgu drużyny jak w drawCharacter
export function drawFigure(g, x, y, sp, o = {}) {
  const c = figureSprite(sp, o.dir || 'SE', o.t), k = WORLD_PER_CM / PPU * (sp.sc || 1);
  if (o.ring) { g.save(); g.translate(x, y); g.scale(1, 0.5); g.beginPath(); g.arc(0, 4, 22 * (sp.sc || 1), 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = o.ring; g.stroke(); g.fillStyle = o.ring.replace('rgb', 'rgba').replace(')', ',.22)'); g.fill(); g.restore(); }
  g.save(); g.translate(x, y); g.scale(k, k); g.drawImage(c, -W / 2, -(H - FEET)); g.restore();
}
