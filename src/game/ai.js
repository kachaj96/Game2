// Prosta sztuczna inteligencja przeciwnika: podchodzi do najbliższego bohatera, a gdy nie może się zbliżyć, kończy turę.
// Zwraca komendę, więc działa przez ten sam kanał co gracz (i da się ją odtworzyć z zapisu).
import { findPath } from './pathfinding.js';
import { gridOf, currentUnit, occupied, alive } from './state.js';
import { legalMoves } from './commands.js';
import { castProblem, spellData, damageRangeVs, elementOfSpell } from './spells.js';

// najmocniejszy czar obrażeń, który da się teraz rzucić w któregoś wroga
function bestCast(state, u, foes) {
  let best = null;
  for (const sp of u.spells) { const sd = spellData(u, sp.id); if (!sd || !sd.data.dmg) continue;
    for (const f of foes) { if (castProblem(state, u.id, sp.id, { x: f.x, y: f.y }) !== null) continue; const [lo, hi] = damageRangeVs(u, sd.data, elementOfSpell(u, sp.id), f), v = (lo + hi) / 2; if (!best || v > best.v) best = { v, cmd: { type: 'cast', unit: u.id, spell: sp.id, to: { x: f.x, y: f.y } } }; } }
  return best ? best.cmd : null;
}

export function chooseCommand(state) {
  const u = currentUnit(state), g = gridOf(state), occ = occupied(state, u.id);
  const foes = alive(state, u.team === 'gracz' ? 'wrog' : 'gracz');
  if (!foes.length) return { type: 'endTurn', unit: u.id };
  const cast = bestCast(state, u, foes); if (cast) return cast;
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
