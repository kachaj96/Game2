// Postęp postaci: poziom, punkty cech (Witalność i moce żywiołów), punkty czarów, wyliczanie statystyk bojowych.
// Wartości z docs/PLAN_ZYWIOLY.md: 5 punktów cech za poziom, koszt punktu rośnie z wartością cechy, 1 punkt czaru za poziom.
import { CLASSES, ORIGINS, TRAITS, MAX_SPELL_LEVEL, spellUpgradeCost, startStats, findSpellDef, DEV_SPELLS } from './classdata.js';

export const MAX_LEVEL = 30, POINTS_PER_LEVEL = 5, MAX_EQUIPPED = 24;
export const STATS = ['vitality', 'earth', 'fire', 'water', 'air'];
export const STAT_NAMES = { vitality: 'Witalność', earth: 'Moc Ziemi', fire: 'Moc Ognia', water: 'Moc Wody', air: 'Moc Powietrza' };
export const pointsAtLevel = (level) => Math.max(0, (level - 1) * POINTS_PER_LEVEL);
// koszt podniesienia cechy z wartości v na v+1: 1 do 50, 2 do 100, 3 powyżej
export const stepCost = (v) => (v < 50 ? 1 : v < 100 ? 2 : 3);
export const costTo = (n) => { let c = 0; for (let v = 0; v < n; v++) c += stepCost(v); return c; };
export const maxStat = (points) => { let n = 0; while (costTo(n + 1) <= points) n++; return n; };
export const emptyAlloc = () => ({ vitality: 0, earth: 0, fire: 0, water: 0, air: 0 });
export const spent = (alloc) => STATS.reduce((a, k) => a + costTo(alloc[k] || 0), 0);
export const pointsLeft = (level, alloc) => pointsAtLevel(level) - spent(alloc);
export const canRaise = (level, alloc, stat) => STATS.includes(stat) && pointsLeft(level, alloc) >= stepCost(alloc[stat] || 0);
export const raise = (level, alloc, stat) => (canRaise(level, alloc, stat) ? { ...alloc, [stat]: (alloc[stat] || 0) + 1 } : alloc);
export const lower = (alloc, stat) => ((alloc[stat] || 0) > 0 ? { ...alloc, [stat]: alloc[stat] - 1 } : alloc);

// ---- postać ----
export function newCharacter({ name = 'Bezimienny', classId, origin = ORIGINS[0].id, traits = [], look = {}, level = 1 }) {
  if (!CLASSES[classId]) throw new Error(`Nieznana klasa: ${classId}`);
  const spellLevels = Object.fromEntries(CLASSES[classId].spells.map((s) => [s.id, 1]));
  return { v: 1, name, classId, level, alloc: emptyAlloc(), spellLevels, equipped: CLASSES[classId].spells.map((s) => s.id), origin, traits: traits.slice(0, 2), look };
}
export const spellPointsTotal = (ch) => Math.max(0, ch.level - 1) + (ORIGINS.find((o) => o.id === ch.origin)?.bonus.spellPoints || 0);
export const spellPointsSpent = (ch) => { let n = 0; for (const lvl of Object.values(ch.spellLevels)) for (let l = 1; l < lvl; l++) n += spellUpgradeCost(l); return n; };
export const spellPointsLeft = (ch) => spellPointsTotal(ch) - spellPointsSpent(ch);
export function upgradeSpell(ch, id) {
  const lvl = ch.spellLevels[id]; if (lvl === undefined || lvl >= MAX_SPELL_LEVEL || spellPointsLeft(ch) < spellUpgradeCost(lvl)) return ch;
  return { ...ch, spellLevels: { ...ch.spellLevels, [id]: lvl + 1 } };
}
export function downgradeSpell(ch, id) { const lvl = ch.spellLevels[id]; return lvl > 1 ? { ...ch, spellLevels: { ...ch.spellLevels, [id]: lvl - 1 } } : ch; }
export function toggleEquipped(ch, id) {
  if (ch.equipped.includes(id)) return ch.equipped.length > 1 ? { ...ch, equipped: ch.equipped.filter((x) => x !== id) } : ch;
  return ch.equipped.length < MAX_EQUIPPED && ch.spellLevels[id] !== undefined ? { ...ch, equipped: [...ch.equipped, id] } : ch;
}
// dodanie czaru do księgi postaci (np. zdobytego, albo testowego)
export function learnSpell(ch, id) { return ch.spellLevels[id] !== undefined || !findSpellDef(ch.classId, id) ? ch : { ...ch, spellLevels: { ...ch.spellLevels, [id]: 1 } }; }
// zmiana poziomu: jeśli wydane punkty przekraczają nowy limit, cechy i czary wracają do stanu początkowego (zwrot punktów)
export function setLevel(ch, level) {
  const lv = Math.max(1, Math.min(MAX_LEVEL, Math.round(level))), next = { ...ch, level: lv };
  if (pointsLeft(lv, next.alloc) < 0) next.alloc = emptyAlloc();
  if (spellPointsLeft(next) < 0) next.spellLevels = Object.fromEntries(Object.keys(next.spellLevels).map((k) => [k, 1]));
  return next;
}

// statystyki bojowe: klasa + poziom + przeszłość + cechy + wydane punkty
export function deriveStats(ch) {
  const base = startStats(ch.classId, ch.origin, ch.traits), cls = CLASSES[ch.classId], a = ch.alloc;
  return { ...base, hp: base.hp + cls.stats.hpPerLevel * (ch.level - 1) + (a.vitality || 0), earth: base.earth + (a.earth || 0), fire: base.fire + (a.fire || 0), water: base.water + (a.water || 0), air: base.air + (a.air || 0) };
}
// jednostka do createState: z wyposażonych czarów (testowe tylko gdy allowDev)
export function unitFromCharacter(ch, extra = {}, { allowDev = false } = {}) {
  const d = deriveStats(ch), devIds = new Set(DEV_SPELLS.map((s) => s.id));
  const spells = ch.equipped.filter((id) => allowDev || !devIds.has(id)).slice(0, MAX_EQUIPPED).map((id) => ({ id, level: ch.spellLevels[id] || 1 }));
  return { id: 'h', team: 'gracz', name: ch.name, classId: ch.classId, maxHp: d.hp, initiative: d.initiative, stats: { earth: d.earth, fire: d.fire, water: d.water, air: d.air, power: d.power, flat: d.flat }, resist: d.resist, spells, ...extra };
}

// ---- walidacja zapisu: uszkodzony lub zmanipulowany zapis nie może zepsuć gry ----
export function validateCharacter(ch) {
  if (!ch || typeof ch !== 'object' || ch.v !== 1) return false;
  if (!CLASSES[ch.classId] || typeof ch.name !== 'string' || ch.name.length > 24) return false;
  if (!Number.isInteger(ch.level) || ch.level < 1 || ch.level > MAX_LEVEL) return false;
  if (ch.xp !== undefined && (!Number.isInteger(ch.xp) || ch.xp < 0 || ch.xp > 1e8)) return false;
  if (!ch.alloc || STATS.some((k) => !Number.isInteger(ch.alloc[k]) || ch.alloc[k] < 0 || ch.alloc[k] > 300)) return false;
  if (pointsLeft(ch.level, ch.alloc) < 0) return false;
  if (!ch.spellLevels || typeof ch.spellLevels !== 'object') return false;
  for (const [id, l] of Object.entries(ch.spellLevels)) if (!findSpellDef(ch.classId, id) || !Number.isInteger(l) || l < 1 || l > MAX_SPELL_LEVEL) return false;
  if (spellPointsLeft(ch) < 0) return false;
  if (!Array.isArray(ch.equipped) || ch.equipped.length < 1 || ch.equipped.length > MAX_EQUIPPED || new Set(ch.equipped).size !== ch.equipped.length || ch.equipped.some((id) => ch.spellLevels[id] === undefined)) return false;
  if (!ORIGINS.some((o) => o.id === ch.origin) || !Array.isArray(ch.traits) || ch.traits.length > 2 || ch.traits.some((t) => !TRAITS.some((x) => x.id === t))) return false;
  return true;
}
