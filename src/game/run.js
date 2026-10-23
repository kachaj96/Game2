// Pętla gry: wejście do lochu to seria komnat (po jednej walce), za każdą wygraną są punkty doświadczenia, a po poziomie punkty do rozdania na karcie postaci.
// Czysta logika, bez DOM. Stan podejścia do lochu leży w pamięci przeglądarki, żeby przeładowanie strony nie gubiło komnaty.
import { MAX_LEVEL, setLevel } from './progression.js';

export const RUN_KEY = 'arena.run.v1';
export const xpToNext = (level) => 60 * level;          // ile XP brakuje od początku poziomu do następnego
export const totalXpForLevel = (level) => { let t = 0; for (let l = 1; l < level; l++) t += xpToNext(l); return t; };
// nagroda za wygraną komnatę: rośnie z poziomem wrogów, boss daje trzy razy tyle, a nadmiar poziomu bohatera ponad pasmo lochu tnie ją o połowę
export function chamberReward(enemyLevel, heroLevel, band, boss = false) {
  const base = 20 + 10 * enemyLevel, over = heroLevel > band[1] ? 0.5 : 1;
  return Math.max(1, Math.round(base * (boss ? 3 : 1) * over));
}
// XP leży w postaci (pole opcjonalne, brak = 0). Zwraca nową postać i liczbę zdobytych poziomów.
export const xpOf = (ch) => (Number.isInteger(ch.xp) && ch.xp > 0 ? ch.xp : 0);
export function levelFromXp(xp) { let l = 1, left = xp; while (l < MAX_LEVEL && left >= xpToNext(l)) { left -= xpToNext(l); l++; } return { level: l, into: left, need: l >= MAX_LEVEL ? 0 : xpToNext(l) }; }
export function addXp(ch, amount) {
  const xp = xpOf(ch) + Math.max(0, Math.round(amount)), { level } = levelFromXp(xp), next = setLevel({ ...ch, xp }, Math.max(ch.level, level));
  return { ch: next, gained: next.level - ch.level };
}
// podejście do lochu
export const newRun = (dungeonId, seed) => ({ v: 1, dungeon: dungeonId, room: 1, seed: Math.abs(Math.round(seed)) % 100000 + 1, xp: 0 });
export const roomSeed = (run) => run.seed * 10 + run.room;
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };
export function saveRun(run, storage = store()) { if (!storage) return false; try { storage.setItem(RUN_KEY, JSON.stringify(run)); return true; } catch { return false; } }
export function loadRun(storage = store()) {
  if (!storage) return null;
  try { const r = JSON.parse(storage.getItem(RUN_KEY)); return r && r.v === 1 && typeof r.dungeon === 'string' && Number.isInteger(r.room) && r.room >= 1 && Number.isInteger(r.seed) ? r : null; } catch { return null; }
}
export function clearRun(storage = store()) { try { storage?.removeItem(RUN_KEY); } catch { /* ignoruj */ } }
