// Świat map v3: przejścia na krawędzi między mapami i sprawdzanie spójności całego zestawu. Czysta logika (bez DOM).
import { buildMap } from './mapdata.js';
import { validateMap } from './walidacja.js';

// Cel przejścia: { map, x, y } = kafel startu w mapie docelowej. Zwraca { def, pos } albo { error }.
export function resolveExit(maps, to, sprites) {
  const def = maps[to && to.map]; if (!def) return { error: `Nie ma mapy "${to && to.map}".` };
  const M = buildMap({ ...def, sprites });
  if (!M.inMap(to.x, to.y)) return { error: `Kafel (${to.x}, ${to.y}) leży poza mapą "${to.map}".` };
  if (M.blocked(to.x, to.y)) return { error: `Kafel (${to.x}, ${to.y}) w mapie "${to.map}" jest zablokowany.` };
  return { def, pos: [to.x + 0.5, to.y + 0.5] };
}

// Spójność świata: każde przejście ma istniejący, wolny cel; cel nie leży w strefie przejścia (inaczej bohater od razu wracałby),
// a w mapie docelowej jest przejście z powrotem; każda mapa jest osiągalna ze startowej.
export function validateWorld(maps, sprites, startId) {
  const out = [], add = (level, id, msg) => out.push({ level, map: id, msg });
  const links = new Map();
  for (const [id, def] of Object.entries(maps)) {
    for (const r of validateMap(def, sprites)) if (r.level !== 'ok') out.push({ ...r, map: id });
    (def.exits || []).forEach((e, i) => {
      const t = e.to || {}, res = resolveExit(maps, t, sprites), name = `Mapa "${id}", przejście ${i + 1}`;
      if (res.error) { add('fail', id, `${name}: ${res.error}`); return; }
      (links.get(id) || links.set(id, new Set()).get(id)).add(t.map);
      const M = buildMap({ ...res.def, sprites });
      if (M.exitAt(t.x, t.y)) add('warn', id, `${name}: kafel docelowy leży w strefie przejścia mapy "${t.map}". Bohater pojawi się na niej (po wyjściu z niej wróci mechanika przejść).`);
      if (!(res.def.exits || []).some((x) => x.to && x.to.map === id)) add('warn', id, `${name}: mapa "${t.map}" nie ma przejścia z powrotem do "${id}".`);
    });
  }
  if (startId && maps[startId]) {
    const seen = new Set([startId]), q = [startId];
    while (q.length) for (const n of links.get(q.shift()) || []) if (!seen.has(n)) { seen.add(n); q.push(n); }
    for (const id of Object.keys(maps)) if (!seen.has(id)) add('warn', id, `Mapa "${id}" nie jest osiągalna z mapy startowej "${startId}".`);
  }
  if (!out.length) add('ok', null, 'Świat jest spójny.');
  return out;
}
