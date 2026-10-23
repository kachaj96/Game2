// Sztuczna inteligencja przeciwników. Zwraca komendę, więc działa przez ten sam kanał co gracz (i da się ją odtworzyć z zapisu).
// Profil zachowania to pole `ai` jednostki; wszystkie profile są deterministyczne (remisy rozstrzyga kolejność kafli i id).
//   bijatyk: najmocniejszy czar, inaczej podchodzi do najbliższego.   blokujący: jak bijatyk, ale ceni odepchnięcia kończące się zderzeniem.
//   zwiadowca: bije najsłabszego, po ataku ucieka poza zasięg.        strzelec: trzyma dystans 2 do 5 w linii, cofa się przed bliskim wrogiem.
//   padlinożerca: leczy się zjadaniem grobów, zanim zaatakuje.         boss: wzywa pomocników, potem jak blokujący.
import { findPath } from './pathfinding.js';
import { gridOf, currentUnit, occupied, alive } from './state.js';
import { legalMoves } from './commands.js';
import { castProblem, spellData, damageRangeVs, elementOfSpell, sightBlockers } from './spells.js';
import { hasLineOfSight } from './los.js';

const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const byCell = (a, b) => a.y - b.y || a.x - b.x;
const END = (u) => ({ type: 'endTurn', unit: u.id });
const attacked = (u) => Object.values(u.casts || {}).reduce((a, b) => a + b, 0) > 0;

// ile dodatkowych obrażeń da zderzenie po odepchnięciu celu (te same reguły co w resolveCast)
function collisionBonus(state, u, data, foe) {
  if (!data.push || !data.collision) return 0;
  const g = gridOf(state), dir = { x: Math.sign(foe.x - u.x), y: Math.sign(foe.y - u.y) }, others = alive(state).filter((x) => x.id !== foe.id);
  const graves = new Set(state.graves.map((gr) => g.key(gr.x, gr.y)));
  let x = foe.x, y = foe.y;
  for (let i = 0; i < data.push; i++) {
    const nx = x + dir.x, ny = y + dir.y;
    if (!g.inBounds(nx, ny) || g.isBlocked(nx, ny) || graves.has(g.key(nx, ny)) || others.some((o) => o.x === nx && o.y === ny)) return (data.push - i) * data.collision;
    x = nx; y = ny;
  }
  return 0;
}
// najlepszy czar obrażeń, który da się teraz rzucić w któregoś wroga; opcje: pushBonus (ceni zderzenia), weakestFirst (najpierw najsłabszy cel)
function bestCast(state, u, foes, { pushBonus = false, weakestFirst = false } = {}) {
  let best = null;
  const list = weakestFirst ? [...foes].sort((a, b) => a.hp - b.hp || (a.id < b.id ? -1 : 1)) : foes;
  for (const sp of u.spells) {
    const sd = spellData(u, sp.id); if (!sd || !sd.data.dmg) continue;
    for (const f of list) {
      if (castProblem(state, u.id, sp.id, { x: f.x, y: f.y }) !== null) continue;
      const [lo, hi] = damageRangeVs(u, sd.data, elementOfSpell(u, sp.id), f); let v = (lo + hi) / 2;
      if (pushBonus) v += collisionBonus(state, u, sd.data, f);
      const key = weakestFirst ? [f.hp, -v] : [-v];
      if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key.length > 1 && key[1] < best.key[1])) best = { key, cmd: { type: 'cast', unit: u.id, spell: sp.id, to: { x: f.x, y: f.y } } };
    }
  }
  return best ? best.cmd : null;
}
// odległość po ścieżce (BFS po kaflach bez jednostek) od zbioru celów do każdego kafla: przeciwnik wybiera ruch, który faktycznie zbliża go
// do celu drogą naokoło ścian, a nie ten, który jest bliżej w linii prostej (stąd wcześniej stawał w ślepym zaułku przed murem)
function distField(g, goals) {
  const d = new Map(), q = []; for (const c of goals) { const k = g.key(c.x, c.y); if (!d.has(k)) { d.set(k, 0); q.push(c); } }
  for (let i = 0; i < q.length; i++) { const c = q[i], dc = d.get(g.key(c.x, c.y)); for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const x = c.x + dx, y = c.y + dy, k = g.key(x, y); if (!g.walkable(x, y) || d.has(k)) continue; d.set(k, dc + 1); q.push({ x, y }); } }
  return d;
}
// krok w stronę celów (lista kafli): z osiągalnych kafli wybiera ten o najmniejszej odległości drogą, tylko gdy to realne zbliżenie
function stepToward(state, u, goals) {
  if (!goals.length) return null;
  const g = gridOf(state), field = distField(g, goals), here = field.get(g.key(u.x, u.y));
  if (here === undefined) return null;
  let pick = null;
  for (const m of [...legalMoves(state, u.id).values()].sort(byCell)) { const d = field.get(g.key(m.x, m.y)); if (d !== undefined && (!pick || d < pick.d)) pick = { m, d }; }
  if (!pick || pick.d >= here) return null;
  return { type: 'move', unit: u.id, to: { x: pick.m.x, y: pick.m.y } };
}
// idzie w stronę najbliższego (po ścieżce) wroga; gdy kafle przy nim zajmują sojusznicy, celuje w sam kafel wroga
function approach(state, u, foes) {
  const g = gridOf(state), occ = occupied(state, u.id);
  let best = null;
  for (const f of foes) {
    const adj = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy })).filter((c) => g.walkable(c.x, c.y) && !occ.has(g.key(c.x, c.y)));
    for (const c of adj) { const p = findPath(g, u, c, occ); if (p && (!best || p.length < best.len || (p.length === best.len && f.id < best.foe.id))) best = { foe: f, len: p.length, goal: c }; }
  }
  if (best) return legalMoves(state, u.id).size ? stepToward(state, u, [best.goal]) : null;
  // wszystkie kafle przy wrogach są zajęte albo odcięte: podejdź jak najbliżej drogą (cel to kafle wrogów)
  return stepToward(state, u, foes.map((f) => ({ x: f.x, y: f.y })));
}
const hasSpell = (u, id) => u.spells.some((s) => s.id === id);

const PROFILES = {
  bijatyk: (state, u, foes) => bestCast(state, u, foes) || approach(state, u, foes),
  blokujacy: (state, u, foes) => bestCast(state, u, foes, { pushBonus: true }) || approach(state, u, foes),
  zwiadowca(state, u, foes) {
    const c = bestCast(state, u, foes, { weakestFirst: true }); if (c) return c;
    if (!attacked(u)) return approach(state, u, foes);
    // po ataku ucieka, ale tylko gdy ktoś stoi w zasięgu 2 (każdy krok kosztuje PM, więc nie ma pętli)
    if (Math.min(...foes.map((f) => dist(f, u))) > 2) return null;
    const near = (c2) => Math.min(...foes.map((f) => dist(f, c2)));
    let pick = null;
    for (const m of [...legalMoves(state, u.id).values()].sort(byCell)) { const d = near(m); if (!pick || d > pick.d) pick = { m, d }; }
    return pick && pick.d > near(u) ? { type: 'move', unit: u.id, to: { x: pick.m.x, y: pick.m.y } } : null;
  },
  strzelec(state, u, foes) {
    const g = gridOf(state), sb = sightBlockers(state), near = (p) => Math.min(...foes.map((f) => dist(f, p)));
    const good = (p) => foes.some((f) => (f.x === p.x || f.y === p.y) && dist(f, p) >= 2 && dist(f, p) <= 5 && hasLineOfSight(g, sb, p, f));
    const spot = (cells) => { let pick = null; for (const m of cells) { if (!good(m)) continue; const d = Math.min(...foes.filter((f) => (f.x === m.x || f.y === m.y)).map((f) => Math.abs(dist(f, m) - 3.5))); if (!pick || d < pick.d) pick = { m, d }; } return pick; };
    const cells = [...legalMoves(state, u.id).values()].sort(byCell);
    if (near(u) <= 1 && cells.length) { const r = spot(cells.filter((m) => near(m) >= 2)); if (r) return { type: 'move', unit: u.id, to: { x: r.m.x, y: r.m.y } }; }
    const c = bestCast(state, u, foes); if (c) return c;
    if (!good(u)) { const r = spot(cells); if (r) return { type: 'move', unit: u.id, to: { x: r.m.x, y: r.m.y } }; }
    return approach(state, u, foes);
  },
  padlinozerca(state, u, foes) {
    if (hasSpell(u, 'pozarcie') && u.hp < u.maxHp && state.graves.length) {
      const graves = [...state.graves].sort(byCell);
      for (const gr of graves) if (castProblem(state, u.id, 'pozarcie', { x: gr.x, y: gr.y }) === null) return { type: 'cast', unit: u.id, spell: 'pozarcie', to: { x: gr.x, y: gr.y } };
      const g = gridOf(state), occ = occupied(state, u.id), goals = [];
      for (const gr of graves) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const c = { x: gr.x + dx, y: gr.y + dy }; if (g.walkable(c.x, c.y) && !occ.has(g.key(c.x, c.y))) goals.push(c); }
      const step = stepToward(state, u, goals); if (step) return step;
    }
    return bestCast(state, u, foes) || approach(state, u, foes);
  },
  boss(state, u, foes) {
    if (hasSpell(u, 'wezwanie')) {
      const g = gridOf(state); let pick = null;
      for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
        if (castProblem(state, u.id, 'wezwanie', { x, y }) !== null) continue;
        const d = Math.min(...foes.map((f) => dist(f, { x, y }))); if (!pick || d < pick.d) pick = { x, y, d };
      }
      void g; if (pick) return { type: 'cast', unit: u.id, spell: 'wezwanie', to: { x: pick.x, y: pick.y } };
    }
    return PROFILES.blokujacy(state, u, foes);
  },
};

export function chooseCommand(state) {
  const u = currentUnit(state), foes = alive(state, u.team === 'gracz' ? 'wrog' : 'gracz');
  if (!foes.length) return END(u);
  return (PROFILES[u.ai] || PROFILES.bijatyk)(state, u, foes) || END(u);
}

// cała tura przeciwnika: lista komend aż do endTurn
export function playTurn(state, applyCommand) {
  const cmds = []; let s = state;
  for (let i = 0; i < 20; i++) { const c = chooseCommand(s), r = applyCommand(s, c); if (!r.ok) break; cmds.push(c); s = r.state; if (c.type === 'endTurn') break; }
  return { state: s, commands: cmds };
}
