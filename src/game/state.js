// Stan gry to zwykły obiekt JSON. Cała logika jest czystą funkcją: stan + komenda => nowy stan. Bez canvasa, DOM i Math.random().
import { IsoGrid } from '../grid.js';

export function createState({ cols, rows, blocked = [], units, seed = 1 }) {
  const grid = new IsoGrid(cols, rows); grid.blockCells(blocked);
  const us = units.map((u) => ({ hp: u.maxHp ?? 20, maxHp: 20, maxPm: 3, maxPa: 6, initiative: 0, ...u }));
  for (const u of us) { u.pm = u.maxPm; u.pa = u.maxPa; if (u.hp === undefined) u.hp = u.maxHp; }
  const order = [...us].sort((a, b) => b.initiative - a.initiative || (a.id < b.id ? -1 : 1)).map((u) => u.id);
  return { cols, rows, blocked: [...grid.blocked].sort((a, b) => a - b), units: us, order, turn: { index: 0, round: 1 }, seed, log: [] };
}
export const gridOf = (state) => { const g = new IsoGrid(state.cols, state.rows); for (const k of state.blocked) g.blocked.add(k); return g; };
export const unitById = (state, id) => state.units.find((u) => u.id === id) || null;
export const currentUnit = (state) => unitById(state, state.order[state.turn.index]);
export const occupied = (state, exceptId) => { const g = gridOf(state), s = new Set(); for (const u of state.units) if (u.hp > 0 && u.id !== exceptId) s.add(g.key(u.x, u.y)); return s; };
export const alive = (state, team) => state.units.filter((u) => u.hp > 0 && (!team || u.team === team));
