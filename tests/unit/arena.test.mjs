import test from 'node:test';
import assert from 'node:assert/strict';
import { makeArena, ARENA } from '../../src/game/arena.js';
import { composeEncounter, spawnEncounter } from '../../src/game/encounter.js';
import { createState } from '../../src/game/state.js';
import { findPath } from '../../src/game/pathfinding.js';
import { gridOf } from '../../src/game/state.js';

test('plansza: większa niż 7 x 7, deterministyczna, z przeszkodami poza polami startu i miejscami wrogów', () => {
  const a = makeArena(5), b = makeArena(5), c = makeArena(6);
  assert.ok(a.cols * a.rows > 7 * 7 * 1.8); assert.deepEqual(a.blocked, b.blocked); assert.notDeepEqual(a.blocked, c.blocked);
  for (let seed = 1; seed <= 60; seed++) { const ar = makeArena(seed); assert.ok(ar.blocked.length >= 8, `seed ${seed}: ${ar.blocked.length}`); for (const bl of ar.blocked) assert.ok(bl.x >= ARENA.startCols && bl.x <= ar.cols - 4 && bl.y >= 0 && bl.y < ar.rows, 'poza strefami'); assert.equal(new Set(ar.blocked.map((q) => `${q.x},${q.y}`)).size, ar.blocked.length); }
});

test('plansza: drużyny zawsze mogą do siebie dojść, a wrogowie mieszczą się w prawych kolumnach', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const ar = makeArena(seed), spec = composeEncounter(seed, 5, 2), foes = spawnEncounter(spec, ar);
    const hero = { id: 'h', team: 'gracz', name: 'T', classId: 'zalobnik', x: 1, y: Math.floor(ar.rows / 2), initiative: 99, maxHp: 50 };
    const s = createState({ cols: ar.cols, rows: ar.rows, seed, blocked: ar.blocked, units: [hero, ...foes] });
    for (const f of foes) assert.ok(f.x >= ar.cols - 3 && !ar.blocked.some((q) => q.x === f.x && q.y === f.y), 'wróg w strefie');
    for (const f of foes) { const g = gridOf(s); assert.ok(findPath(g, { x: 1, y: hero.y }, { x: f.x - 1 < 0 ? f.x : f.x, y: f.y }), `seed ${seed}: droga do ${f.id}`); }
  }
});
