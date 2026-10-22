// Czary: sprawdzanie legalności i rozstrzyganie rzutu. Czysta logika na stanie JSON, losowość tylko przez licznik rzutów w stanie.
// Warstwa 1 (jest): obrażenia, zasięg, linia, odnowienia, limity na turę, PA, linia widzenia, śmierć i groby.
// Jeszcze nie zaimplementowane (czar jest odrzucany, a nie udawany): odpychanie, pułapki, glify, skok.
import { rng } from '../art/rng.js';
import { CLASSES } from './classdata.js';
import { gridOf, unitById, alive } from './state.js';
import { hasLineOfSight } from './los.js';

export const NOT_IMPLEMENTED = ['push', 'trap', 'glyph', 'jump', 'cloud'];
export const spellData = (unit, spellId) => {
  const known = unit.spells?.find((s) => s.id === spellId); if (!known) return null;
  const def = CLASSES[unit.classId]?.spells.find((s) => s.id === spellId); if (!def) return null;
  const data = def.levels[known.level - 1]; return data ? { def, level: known.level, data } : null;
};
export const implemented = (data) => !NOT_IMPLEMENTED.some((k) => data[k] || data.trap || data.glyph || data.cloud || data.jump);
export const graveKeys = (state) => { const g = gridOf(state), s = new Set(); for (const gr of state.graves) s.add(g.key(gr.x, gr.y)); return s; };
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// licznik rzutów w stanie: ten sam stan i komendy zawsze dają te same wyniki
export function rollInt(state, lo, hi) { const v = rng(state.seed * 9973 + state.rolls * 7 + 1)(); state.rolls++; return lo + Math.floor(v * (hi - lo + 1)); }
export const damageBonus = (unit) => (1 + ((unit.stats?.[CLASSES[unit.classId]?.stats.main] || 0) / 100)) * (unit.damageScale ?? 1);
export const damageRange = (unit, data) => [Math.floor(data.dmg[0] * damageBonus(unit)), Math.floor(data.dmg[1] * damageBonus(unit))];

// kod błędu albo null, gdy czar można rzucić w ten kafel
export function castProblem(state, unitId, spellId, target) {
  const u = unitById(state, unitId), sd = u && spellData(u, spellId);
  if (!sd) return 'spell_unknown';
  const { data } = sd;
  if (!implemented(data)) return 'not_implemented';
  if (u.pa < data.pa) return 'no_pa';
  if ((u.cooldowns?.[spellId] || 0) > 0) return 'cooldown';
  if ((u.casts?.[spellId] || 0) >= data.perTurn) return 'limit';
  const g = gridOf(state);
  if (!target || !g.inBounds(target.x, target.y)) return 'out_of_bounds';
  const d = dist(u, target);
  if (d < data.min || d > data.max) return 'range';
  if (data.line && u.x !== target.x && u.y !== target.y) return 'not_in_line';
  if (data.los && !hasLineOfSight(g, graveKeys(state), u, target)) return 'no_los';
  if (data.dmg) { const t = alive(state).find((x) => x.x === target.x && x.y === target.y); if (!t || t.team === u.team) return 'no_target'; }
  return null;
}
// kafle, w które ta jednostka może teraz rzucić dany czar (do podświetlania w interfejsie)
export function validTargets(state, unitId, spellId) {
  const out = []; for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) if (castProblem(state, unitId, spellId, { x, y }) === null) out.push({ x, y }); return out;
}

// rozstrzygnięcie rzutu na sklonowanym stanie (komenda jest już zwalidowana)
export function resolveCast(next, unit, spellId, target, events) {
  const { data } = spellData(unit, spellId);
  unit.pa -= data.pa; unit.casts = { ...unit.casts, [spellId]: (unit.casts?.[spellId] || 0) + 1 };
  if (data.cd > 0) unit.cooldowns = { ...unit.cooldowns, [spellId]: data.cd + 1 };
  const hits = [];
  if (data.dmg) {
    const t = alive(next).find((x) => x.x === target.x && x.y === target.y), [lo, hi] = damageRange(unit, data), dmg = rollInt(next, lo, hi);
    t.hp = Math.max(0, t.hp - dmg); hits.push({ unit: t.id, dmg, hp: t.hp, killed: t.hp === 0 });
    if (t.hp === 0) { next.graves.push({ x: t.x, y: t.y, unit: t.id }); }
  }
  events.push({ type: 'cast', unit: unit.id, spell: spellId, to: { x: target.x, y: target.y }, hits });
  for (const h of hits) if (h.killed) events.push({ type: 'died', unit: h.unit, grave: { x: target.x, y: target.y } });
}
