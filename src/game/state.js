// Stan gry to zwykły obiekt JSON. Cała logika jest czystą funkcją: stan + komenda => nowy stan. Bez canvasa, DOM i Math.random().
import { IsoGrid } from '../grid.js';
import { CLASSES } from './classdata.js';

export function createState({ cols, rows, blocked = [], units, seed = 1 }) {
  const grid = new IsoGrid(cols, rows); grid.blockCells(blocked);
  const us = units.map((u) => {
    const cls = CLASSES[u.classId], maxHp = u.maxHp ?? cls?.stats.hp ?? 20;
    const out = { maxHp, maxPm: 3, maxPa: 6, initiative: cls?.stats.initiative ?? 0, stats: { strength: 0, agility: 0, power: 0, endurance: 0 }, cooldowns: {}, casts: {}, ...u };
    out.spells = u.spells ?? cls?.spells.map((s) => ({ id: s.id, level: 1 })) ?? [];
    out.hp = u.hp ?? out.maxHp; out.pm = out.maxPm; out.pa = out.maxPa; return out;
  });
  const order = [...us].sort((a, b) => b.initiative - a.initiative || (a.id < b.id ? -1 : 1)).map((u) => u.id);
  return { cols, rows, blocked: [...grid.blocked].sort((a, b) => a - b), units: us, order, turn: { index: 0, round: 1 }, seed, rolls: 0, graves: [], result: null, log: [] };
}
export const gridOf = (state) => { const g = new IsoGrid(state.cols, state.rows); for (const k of state.blocked) g.blocked.add(k); return g; };
export const unitById = (state, id) => state.units.find((u) => u.id === id) || null;
export const currentUnit = (state) => unitById(state, state.order[state.turn.index]);
export const occupied = (state, exceptId) => { const g = gridOf(state), s = new Set(); for (const u of state.units) if (u.hp > 0 && u.id !== exceptId) s.add(g.key(u.x, u.y)); for (const gr of state.graves || []) s.add(g.key(gr.x, gr.y)); return s; };
export const alive = (state, team) => state.units.filter((u) => u.hp > 0 && (!team || u.team === team));
