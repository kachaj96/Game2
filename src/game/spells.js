// Czary: sprawdzanie legalności i rozstrzyganie rzutu. Czysta logika na stanie JSON, losowość tylko przez licznik rzutów w stanie.
// Warstwa 1: obrażenia, zasięg, linia, odnowienia, limity na turę, PA, linia widzenia, śmierć i groby.
// Warstwa 2: odpychanie z kolizją (ściana, grób, krawędź, inna jednostka) i chmury popiołu zasłaniające widok.
// Jeszcze nie zaimplementowane (czar jest odrzucany, a nie udawany): pułapki, glify, skok.
import { rng } from '../art/rng.js';
import { CLASSES, findSpellDef } from './classdata.js';
import { gridOf, unitById, alive } from './state.js';
import { hasLineOfSight } from './los.js';
import { enemyForLevel } from './enemies.js';

export const NOT_IMPLEMENTED = ['trap', 'glyph', 'jump'];
export const spellData = (unit, spellId) => {
  const known = unit.spells?.find((s) => s.id === spellId); if (!known) return null;
  const def = findSpellDef(unit.classId, spellId); if (!def) return null;
  const data = def.levels[known.level - 1]; return data ? { def, level: known.level, data } : null;
};
export const implemented = (data) => !NOT_IMPLEMENTED.some((k) => data[k]);
export const graveKeys = (state) => { const g = gridOf(state), s = new Set(); for (const gr of state.graves) s.add(g.key(gr.x, gr.y)); return s; };
// komórki zasłaniające widok poza terenem: groby i chmury popiołu
export const sightBlockers = (state) => { const g = gridOf(state), s = graveKeys(state); for (const c of state.clouds || []) s.add(g.key(c.x, c.y)); return s; };
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// licznik rzutów w stanie: ten sam stan i komendy zawsze dają te same wyniki
export function rollInt(state, lo, hi) { const v = rng(state.seed * 9973 + state.rolls * 7 + 1)(); state.rolls++; return lo + Math.floor(v * (hi - lo + 1)); }
// ---- żywioły i odporności ----
// obrażenia = floor(rzut x (1 + (cecha żywiołu + moc ogólna)/100) x skala) + obrażenia stałe; potem x (1 - odporność%/100), minimum 0.
// Zwykłe (neutralne) nie korzystają z cechy żywiołu, tylko z mocy ogólnej. Odporność: gracz do +50%, przeciwnik do +75%, słabość do -100%.
export const RESIST_CAP = { gracz: 50, wrog: 75 }, RESIST_FLOOR = -100;
export const elementOfSpell = (unit, spellId) => findSpellDef(unit.classId, spellId)?.element || 'neutral';
export const statFor = (unit, element) => (element === 'neutral' ? 0 : unit.stats?.[element] || 0) + (unit.stats?.power || 0);
export const damageRange = (unit, data, element = 'neutral') => {
  const m = Math.max(0, 1 + statFor(unit, element) / 100) * (unit.damageScale ?? 1), f = unit.stats?.flat || 0;
  return [Math.floor(data.dmg[0] * m) + f, Math.floor(data.dmg[1] * m) + f];
};
export const resistOf = (target, element) => Math.max(RESIST_FLOOR, Math.min(RESIST_CAP[target.team] ?? 75, target.resist?.[element] || 0));
export const afterResist = (target, element, v) => Math.max(0, Math.floor(v * (1 - resistOf(target, element) / 100)));
export const damageRangeVs = (unit, data, element, target) => damageRange(unit, data, element).map((v) => afterResist(target, element, v));

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
  if (data.los && !hasLineOfSight(g, sightBlockers(state), u, target)) return 'no_los';
  if (data.eatGrave && !state.graves.some((gr) => gr.x === target.x && gr.y === target.y)) return 'no_grave';
  if (data.heal) { const t = alive(state).find((x) => x.x === target.x && x.y === target.y); if (!t || t.team !== u.team) return 'no_target'; }
  if (data.summon) {
    if (g.isBlocked(target.x, target.y) || alive(state).some((x) => x.x === target.x && x.y === target.y) || state.graves.some((gr) => gr.x === target.x && gr.y === target.y)) return 'target_occupied';
    if (state.enemyCap && alive(state, u.team).length >= state.enemyCap) return 'summon_full';
  }
  if (data.dmg) { const t = alive(state).find((x) => x.x === target.x && x.y === target.y); if (!t || t.team === u.team) return 'no_target'; }
  return null;
}
// kafle, w które ta jednostka może teraz rzucić dany czar (do podświetlania w interfejsie)
export function validTargets(state, unitId, spellId) {
  const out = []; for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) if (castProblem(state, unitId, spellId, { x, y }) === null) out.push({ x, y }); return out;
}

// faza szału bossa: poniżej progu życia dostaje +PA i krótsze odnowienie wezwania (dane: ENEMIES.rage w enemies.js, tu stałe)
export const RAGE = { below: 0.5, pa: 1 };
export function checkRage(unit, events) {
  if (!unit.boss || unit.enraged || unit.hp <= 0 || unit.hp > unit.maxHp * RAGE.below) return;
  unit.enraged = true; unit.maxPa += RAGE.pa; unit.pa += RAGE.pa; events.push({ type: 'enraged', unit: unit.id });
}
// rozstrzygnięcie rzutu na sklonowanym stanie (komenda jest już zwalidowana)
function kill(next, t) { next.graves.push({ x: t.x, y: t.y, unit: t.id }); }
export function resolveCast(next, unit, spellId, target, events) {
  const { data } = spellData(unit, spellId);
  unit.pa -= data.pa; unit.casts = { ...unit.casts, [spellId]: (unit.casts?.[spellId] || 0) + 1 };
  const cdv = unit.enraged && data.rageCd !== undefined ? data.rageCd : data.cd;
  if (cdv > 0) unit.cooldowns = { ...unit.cooldowns, [spellId]: cdv + 1 };
  const hits = [], died = [];
  let victim = null;
  if (data.dmg) {
    const t = alive(next).find((x) => x.x === target.x && x.y === target.y), el = elementOfSpell(unit, spellId), [lo, hi] = damageRange(unit, data, el), raw = rollInt(next, lo, hi), dmg = afterResist(t, el, raw);
    t.hp = Math.max(0, t.hp - dmg); hits.push({ unit: t.id, dmg, raw, element: el, resist: resistOf(t, el), hp: t.hp, killed: t.hp === 0, kind: 'spell' }); victim = t;
    next.known[t.id] = { ...(next.known[t.id] || {}), [el]: resistOf(t, el) };
    if (t.hp === 0) { kill(next, t); died.push({ unit: t.id, grave: { x: t.x, y: t.y } }); }
    else { if (data.slow) { t.pm = Math.max(0, t.pm - data.slow); t.slow = Math.min(t.maxPm, (t.slow || 0) + data.slow); events.push({ type: 'slowed', unit: t.id, pm: data.slow }); } checkRage(t, events); }
  }
  if (data.heal) {
    const t = alive(next).find((x) => x.x === target.x && x.y === target.y), amt = rollInt(next, data.heal[0], data.heal[1]), before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amt); hits.push({ unit: t.id, dmg: -(t.hp - before), hp: t.hp, killed: false, kind: 'heal', element: 'neutral' }); events.push({ type: 'healed', unit: t.id, amount: t.hp - before });
  }
  if (data.eatGrave) {
    next.graves = next.graves.filter((gr) => !(gr.x === target.x && gr.y === target.y));
    const before = unit.hp; unit.hp = Math.min(unit.maxHp, unit.hp + Math.floor(unit.maxHp * data.eatGrave.healPct));
    hits.push({ unit: unit.id, dmg: -(unit.hp - before), hp: unit.hp, killed: false, kind: 'heal', element: 'neutral' });
    events.push({ type: 'graveEaten', unit: unit.id, at: { x: target.x, y: target.y }, healed: unit.hp - before });
  }
  if (data.summon) {
    next.summoned = (next.summoned || 0) + 1;
    const id = `s${next.summoned}`, nu = enemyForLevel(data.summon.kind, unit.level || 1, id, target.x, target.y, { seed: 100 + next.summoned, summonedBy: unit.id });
    nu.hp = nu.maxHp; nu.pm = nu.maxPm; nu.pa = nu.maxPa; nu.cooldowns = {}; nu.casts = {}; nu.known = undefined; delete nu.known;
    nu.stats = { earth: 0, fire: 0, water: 0, air: 0, power: 0, flat: 0, ...nu.stats }; nu.resist = { earth: 0, fire: 0, water: 0, air: 0, neutral: 0, ...nu.resist };
    next.units.push(nu); next.order.splice(next.turn.index + 1, 0, id);
    events.push({ type: 'summoned', unit: id, by: unit.id, at: { x: target.x, y: target.y }, kind: data.summon.kind });
  }
  events.push({ type: 'cast', unit: unit.id, spell: spellId, to: { x: target.x, y: target.y }, hits });
  // odpychanie: tylko żywy cel, w kierunku od rzucającego, do N kafli; przeszkoda kończy ruch i zadaje obrażenia za każdy niewykorzystany kafel
  if (data.push && victim && victim.hp > 0) {
    const dir = { x: Math.sign(victim.x - unit.x), y: Math.sign(victim.y - unit.y) }, from = { x: victim.x, y: victim.y }, g = gridOf(next), grv = graveKeys(next);
    let moved = 0, blocker = null, hitWall = false;
    for (let i = 0; i < data.push; i++) {
      const nx = victim.x + dir.x, ny = victim.y + dir.y;
      if (!g.inBounds(nx, ny) || g.isBlocked(nx, ny) || grv.has(g.key(nx, ny))) { hitWall = true; break; }
      const other = alive(next).find((x) => x.id !== victim.id && x.x === nx && x.y === ny);
      if (other) { hitWall = true; blocker = other; break; }
      victim.x = nx; victim.y = ny; moved++;
    }
    const remaining = hitWall ? data.push - moved : 0, coll = remaining * (data.collision || 0), pHits = [];
    if (coll > 0) {
      victim.hp = Math.max(0, victim.hp - coll); pHits.push({ unit: victim.id, dmg: coll, hp: victim.hp, killed: victim.hp === 0, kind: 'collision', element: 'neutral' });
      if (victim.hp === 0) { kill(next, victim); died.push({ unit: victim.id, grave: { x: victim.x, y: victim.y } }); }
      if (blocker) { blocker.hp = Math.max(0, blocker.hp - coll); pHits.push({ unit: blocker.id, dmg: coll, hp: blocker.hp, killed: blocker.hp === 0, kind: 'collision', element: 'neutral' }); if (blocker.hp === 0) { kill(next, blocker); died.push({ unit: blocker.id, grave: { x: blocker.x, y: blocker.y } }); } }
    }
    checkRage(victim, events);
    events.push({ type: 'pushed', unit: victim.id, from, to: { x: victim.x, y: victim.y }, moved, collision: coll, blocker: blocker ? blocker.id : null, hits: pHits });
    if (data.cloud) { next.clouds.push({ x: from.x, y: from.y, turns: data.cloud.turns, owner: unit.id }); events.push({ type: 'cloud', at: from, turns: data.cloud.turns }); }
  }
  for (const d of died) events.push({ type: 'died', ...d });
}
