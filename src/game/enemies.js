// Wrogowie: rodzina Kopaczy i boss Król Kopców. Dane z docs/PLAN_PRZECIWNIKOW.md.
// Skalowanie z poziomem L: HP = baza + przyrost x (L-1), moc = 3,5% x (L-1) (w planie było 4%, obniżone po symulacji), poziom czarów = min(5, 1 + (L-1)/4). PA i PM nie rosną.
import { ENEMY_SPELLS } from './enemyspells.js';

export const DAMAGE_SCALE = 0.62, POWER_PER_LEVEL = 3.5;
export const KOPACZE = ['kopacz', 'pancerny', 'szperacz', 'pluja', 'zerca'];
const R = (earth, fire, water, air) => ({ earth, fire, water, air, neutral: 0 });
export const ENEMIES = {
  kopacz: { id: 'kopacz', name: 'Kopacz', family: 'kopacze', ai: 'bijatyk', pa: 6, pm: 4, init: 12, hp: [36, 7], resist: R(25, -25, 0, 0), spells: ['pazury', 'wyrzut'], weight: 3 },
  pancerny: { id: 'pancerny', name: 'Pancerny', family: 'kopacze', ai: 'blokujacy', pa: 5, pm: 2, init: 6, hp: [72, 12], resist: R(40, -10, -25, 0), spells: ['pancerz', 'taran'], weight: 2 },
  szperacz: { id: 'szperacz', name: 'Szperacz', family: 'kopacze', ai: 'zwiadowca', pa: 4, pm: 5, init: 16, hp: [29, 5], resist: R(0, 0, 0, 30), spells: ['zryw', 'bloto'], weight: 2 },
  pluja: { id: 'pluja', name: 'Pluja', family: 'kopacze', ai: 'strzelec', pa: 7, pm: 3, init: 10, hp: [31, 5], resist: R(-10, 30, -25, 0), spells: ['pocisk', 'kurz'], weight: 2 },
  zerca: { id: 'zerca', name: 'Żerca', family: 'kopacze', ai: 'padlinozerca', pa: 6, pm: 3, init: 8, hp: [36, 6], resist: R(0, -25, 25, 0), spells: ['ugryzienie', 'pozarcie'], weight: 1 },
  krol: { id: 'krol', name: 'Król Kopców', family: 'kopacze', boss: true, ai: 'boss', pa: 8, pm: 2, init: 7, hp: [160, 24], resist: R(30, 0, -30, 0), spells: ['kopniecie', 'taran_krola', 'wezwanie'], weight: 0 },
};
export const spellLevelFor = (level) => Math.min(5, 1 + Math.floor((Math.max(1, level) - 1) / 4));
export const enemyHp = (kind, level) => ENEMIES[kind].hp[0] + ENEMIES[kind].hp[1] * (Math.max(1, level) - 1);

export function enemyForLevel(kind, level, id, x, y, extra = {}) {
  const e = ENEMIES[kind]; if (!e) throw new Error(`Nieznany wróg: ${kind}`);
  const L = Math.max(1, Math.round(level)), sl = spellLevelFor(L);
  return {
    id, team: 'wrog', kind, name: e.name, classId: 'wrog', level: L, ai: e.ai, boss: !!e.boss, seed: extra.seed ?? 1,
    maxHp: enemyHp(kind, L), maxPa: e.pa, maxPm: e.pm, initiative: e.init, damageScale: DAMAGE_SCALE, stats: { power: Math.round(POWER_PER_LEVEL * (L - 1)) },
    resist: { ...e.resist }, spells: e.spells.map((s) => ({ id: s, level: sl })), x, y, ...extra,
  };
}
export const allEnemySpellsKnown = () => Object.values(ENEMIES).every((e) => e.spells.every((s) => ENEMY_SPELLS[s]));
