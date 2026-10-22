// Komendy zmieniają stan. Interfejs, sztuczna inteligencja i (później) sieć wysyłają te same komendy.
import { findPath, reachable } from './pathfinding.js';
import { gridOf, unitById, currentUnit, occupied, alive } from './state.js';
import { castProblem, resolveCast } from './spells.js';

export const ERRORS = {
  unknown_command: 'Nieznana komenda.', no_unit: 'Nie ma takiej jednostki.', not_your_turn: 'To nie jest tura tej jednostki.',
  out_of_bounds: 'Poza planszą.', blocked: 'Ten kafel jest zablokowany.', occupied: 'Ten kafel jest zajęty.',
  no_path: 'Nie ma drogi.', too_far: 'Za daleko, brakuje punktów ruchu.', same_cell: 'Już tu stoisz.',
  spell_unknown: 'Nie znasz tego czaru.', not_implemented: 'Ten czar jeszcze nie działa.', no_pa: 'Za mało punktów akcji.', cooldown: 'Czar jeszcze się odnawia.',
  limit: 'Ten czar był już rzucony maksymalną liczbę razy w tej turze.', range: 'Poza zasięgiem czaru.', not_in_line: 'Cel musi być w jednej linii.',
  no_los: 'Nie widzisz celu (coś zasłania).', no_target: 'Brak celu na tym kaflu.', finished: 'Walka już się skończyła.',
};

// kafle, na które jednostka może teraz dojść (Map klucz -> {x,y,cost})
export function legalMoves(state, unitId) {
  const u = unitById(state, unitId);
  if (!u || u.hp <= 0) return new Map();
  return reachable(gridOf(state), u, u.pm, occupied(state, u.id));
}

export function applyCommand(state, cmd) {
  const fail = (error) => ({ ok: false, error, message: ERRORS[error] });
  if (!cmd || typeof cmd !== 'object') return fail('unknown_command');
  if (state.result) return fail('finished');
  const u = unitById(state, cmd.unit);
  if (!u || u.hp <= 0) return fail('no_unit');
  if (currentUnit(state).id !== u.id) return fail('not_your_turn');
  const next = structuredClone(state), nu = unitById(next, u.id), events = [];
  if (cmd.type === 'move') {
    const g = gridOf(state), t = cmd.to;
    if (!t || !g.inBounds(t.x, t.y)) return fail('out_of_bounds');
    if (t.x === u.x && t.y === u.y) return fail('same_cell');
    if (g.isBlocked(t.x, t.y)) return fail('blocked');
    const occ = occupied(state, u.id);
    if (occ.has(g.key(t.x, t.y))) return fail('occupied');
    const path = findPath(g, u, t, occ);
    if (!path) return fail('no_path');
    if (path.length > u.pm) return fail('too_far');
    nu.pm -= path.length; nu.x = t.x; nu.y = t.y;
    events.push({ type: 'moved', unit: u.id, path, cost: path.length });
  } else if (cmd.type === 'cast') {
    const err = castProblem(state, u.id, cmd.spell, cmd.to); if (err) return fail(err);
    resolveCast(next, nu, cmd.spell, cmd.to, events);
    const pl = alive(next, 'gracz').length, en = alive(next, 'wrog').length;
    if (!pl || !en) { next.result = pl ? 'victory' : 'defeat'; events.push({ type: 'finished', result: next.result }); }
  } else if (cmd.type === 'endTurn') {
    advanceTurn(next); events.push({ type: 'turnEnded', unit: u.id, next: currentUnit(next).id, round: next.turn.round });
  } else return fail('unknown_command');
  next.log.push(cmd);
  return { ok: true, state: next, events };
}

// następna żywa jednostka w kolejce; nowa runda, gdy kolejka się zawija; odnowienie jej punktów
function advanceTurn(s) {
  for (let i = 0; i < s.order.length; i++) {
    s.turn.index = (s.turn.index + 1) % s.order.length;
    if (s.turn.index === 0) s.turn.round++;
    const u = unitById(s, s.order[s.turn.index]);
    if (u.hp > 0) { u.pm = u.maxPm; u.pa = u.maxPa; u.casts = {}; for (const k of Object.keys(u.cooldowns || {})) { u.cooldowns[k] = Math.max(0, u.cooldowns[k] - 1); }
      s.clouds = (s.clouds || []).map((c) => (c.owner === u.id ? { ...c, turns: c.turns - 1 } : c)).filter((c) => c.turns > 0); return; }
  }
}
