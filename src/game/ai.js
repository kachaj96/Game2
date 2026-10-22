// Prosta sztuczna inteligencja przeciwnika: podchodzi do najbliższego bohatera, a gdy nie może się zbliżyć, kończy turę.
// Zwraca komendę, więc działa przez ten sam kanał co gracz (i da się ją odtworzyć z zapisu).
import { findPath } from './pathfinding.js';
import { gridOf, currentUnit, occupied, alive } from './state.js';
import { legalMoves } from './commands.js';

export function chooseCommand(state) {
  const u = currentUnit(state), g = gridOf(state), occ = occupied(state, u.id);
  const foes = alive(state, u.team === 'gracz' ? 'wrog' : 'gracz');
  if (!foes.length) return { type: 'endTurn', unit: u.id };
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  // cel: wróg o najkrótszej drodze (po ścieżce, nie w linii prostej), remis rozstrzyga id
  let best = null;
  for (const f of foes) {
    const adj = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy })).filter((c) => g.walkable(c.x, c.y) && !occ.has(g.key(c.x, c.y)));
    for (const c of adj) { const p = findPath(g, u, c, occ); if (p && (!best || p.length < best.len || (p.length === best.len && f.id < best.foe.id))) best = { foe: f, len: p.length, goal: c }; }
  }
  const moves = legalMoves(state, u.id);
  if (!best || !moves.size) return { type: 'endTurn', unit: u.id };
  let pick = null;
  for (const m of [...moves.values()].sort((a, b) => a.y - b.y || a.x - b.x)) { const d = dist(m, best.goal); if (!pick || d < pick.d) pick = { m, d }; }
  if (!pick || pick.d >= dist(u, best.goal)) return { type: 'endTurn', unit: u.id };
  return { type: 'move', unit: u.id, to: { x: pick.m.x, y: pick.m.y } };
}

// cała tura przeciwnika: lista komend aż do endTurn
export function playTurn(state, applyCommand) {
  const cmds = []; let s = state;
  for (let i = 0; i < 20; i++) { const c = chooseCommand(s), r = applyCommand(s, c); if (!r.ok) break; cmds.push(c); s = r.state; if (c.type === 'endTurn') break; }
  return { state: s, commands: cmds };
}
