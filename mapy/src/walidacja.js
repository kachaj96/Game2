// Sprawdzanie mapy v3 przed zapisem: start, odciski, wyjścia i dojście do nich. Czysta logika (bez DOM).
import { buildMap } from './mapdata.js';
import { footprintCells } from './iso.js';

// def: dane mapy; sprites: { id: {footprint:{w,d}, height} } z biblioteki
export function validateMap(def, sprites, groundIds) {
  const out = [], add = (level, msg) => out.push({ level, msg });
  let M; try { M = buildMap({ ...def, sprites }); } catch (e) { return [{ level: 'fail', msg: 'Mapa nie buduje się: ' + e.message }]; }
  if (groundIds && def.ground && !groundIds.includes(def.ground)) add('fail', `Podłoże "${def.ground}" nie istnieje w bibliotece.`);
  if (groundIds && !def.ground) add('warn', 'Mapa nie ma wybranego podłoża (użyje pierwszego z biblioteki).');
  const key = (x, y) => x + ',' + y, seen = new Map();
  (def.objects || []).forEach((o, i) => {
    const s = sprites[o.sprite]; if (!s) return;
    const cells = footprintCells(o.x, o.y, s.footprint.w, s.footprint.d), outside = cells.filter(([x, y]) => !M.inMap(x, y)).length;
    if (outside === cells.length) add('fail', `Obiekt ${i + 1} (${o.sprite}) leży całkiem poza mapą.`); else if (outside) add('warn', `Obiekt ${i + 1} (${o.sprite}) wystaje poza mapę (${outside} z ${cells.length} kafli odcisku).`);
    for (const [x, y] of cells) { const k = key(x, y); if (seen.has(k) && seen.get(k) !== i) { add('warn', `Obiekty ${seen.get(k) + 1} i ${i + 1} nakładają się odciskami.`); break; } seen.set(k, i); }
  });
  if (!def.start) add('fail', 'Brak punktu startu.');
  else {
    const sc = [Math.floor(def.start[0]), Math.floor(def.start[1])];
    if (!M.inMap(...sc)) add('fail', 'Start leży poza mapą.'); else if (M.blocked(...sc)) add('fail', 'Start stoi na zablokowanym kaflu.');
    else {
      (def.exits || []).forEach((e, i) => {
        const name = e.to && e.to.map ? `Przejście ${i + 1} do "${e.to.map}"` : `Przejście ${i + 1}`;
        if (!e.to || !e.to.map) add('fail', `Przejście ${i + 1} nie ma mapy docelowej.`);
        if (!e.cells || !e.cells.length) { add('fail', `${name} nie ma żadnych kafli.`); return; }
        const free = e.cells.filter(([x, y]) => !M.blocked(x, y));
        if (!free.length) { add('fail', `${name}: wszystkie kafle są zablokowane.`); return; }
        const reach = free.some(([x, y]) => M.findPath(sc, [x, y]));
        add(reach ? 'ok' : 'fail', reach ? `${name}: dojście z startu jest.` : `${name}: nie da się dojść ze startu.`);
      });
      if (!(def.exits || []).length) add('warn', 'Mapa nie ma żadnego przejścia do sąsiedniej mapy.');
    }
  }
  if (!out.some((c) => c.level !== 'ok')) add('ok', 'Mapa jest poprawna.');
  return out;
}
