// Bohater referencyjny do strojenia i symulacji: wszystkie punkty cech w główny żywioł klasy, wszystkie punkty czarów w pierwszy czar obrażeń.
import { CLASSES } from './classdata.js';
import { newCharacter, setLevel, canRaise, raise, upgradeSpell } from './progression.js';
import { castProblem, spellData } from './spells.js';
import { gridOf, currentUnit, alive } from './state.js';
import { legalMoves } from './commands.js';
import { hasLineOfSight } from './los.js';
import { sightBlockers } from './spells.js';

export function referenceHero(level, classId = 'zalobnik') {
  let ch = setLevel(newCharacter({ classId }), level);
  const main = CLASSES[classId].stats.main;
  while (canRaise(ch.level, ch.alloc, main)) ch = { ...ch, alloc: raise(ch.level, ch.alloc, main) };
  const dmg = CLASSES[classId].spells.find((s) => s.tags.includes('damage')).id;
  for (let i = 0; i < 6; i++) ch = upgradeSpell(ch, dmg);
  return ch;
}
// strategia bohatera: bij najsłabszego w zasięgu głównym czarem, inaczej ustaw się w zasięgu poza dystansem ataku wrogów, inaczej podejdź
export function heroCommand(state, spellId = 'zar') {
  const u = currentUnit(state), foes = alive(state, 'wrog');
  const d = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  for (const f of [...foes].sort((a, b) => a.hp - b.hp || (a.id < b.id ? -1 : 1))) if (castProblem(state, u.id, spellId, { x: f.x, y: f.y }) === null) return { type: 'cast', unit: u.id, spell: spellId, to: { x: f.x, y: f.y } };
  const sd = spellData(u, spellId).data, g = gridOf(state), sb = sightBlockers(state), cells = [...legalMoves(state, u.id).values()].sort((a, b) => a.y - b.y || a.x - b.x);
  let pick = null;
  for (const m of cells) { const reach = foes.filter((f) => d(f, m) >= sd.min && d(f, m) <= sd.max && hasLineOfSight(g, sb, m, f)); if (!reach.length) continue; const s = Math.min(...foes.map((f) => d(f, m))); if (!pick || s > pick.s) pick = { m, s }; }
  if (pick && (pick.m.x !== u.x || pick.m.y !== u.y)) return { type: 'move', unit: u.id, to: { x: pick.m.x, y: pick.m.y } };
  let step = null; const near = (p) => Math.min(...foes.map((f) => d(f, p)));
  for (const m of cells) { const v = near(m); if (!step || v < step.v) step = { m, v }; }
  if (step && step.v < near(u)) return { type: 'move', unit: u.id, to: { x: step.m.x, y: step.m.y } };
  return { type: 'endTurn', unit: u.id };
}
