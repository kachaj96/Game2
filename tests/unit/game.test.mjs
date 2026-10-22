import test from 'node:test';
import assert from 'node:assert/strict';
import { IsoGrid } from '../../src/grid.js';
import { rng } from '../../src/art/rng.js';
import { findPath, reachable } from '../../src/game/pathfinding.js';
import { createState, currentUnit, unitById, gridOf, occupied } from '../../src/game/state.js';
import { applyCommand, legalMoves } from '../../src/game/commands.js';
import { chooseCommand, playTurn } from '../../src/game/ai.js';

const mkGrid = (rows) => { const g = new IsoGrid(rows[0].length, rows.length); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') g.block(x, y); })); return g; };
// niezależny wzorzec: BFS po odległościach, bez wspólnego kodu z testowanym A*
const bfsDist = (g, from, blocked = new Set()) => { const d = new Map([[g.key(from.x, from.y), 0]]), q = [from]; while (q.length) { const c = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c.x + dx, y = c.y + dy, k = g.key(x, y); if (!g.walkable(x, y) || blocked.has(k) || d.has(k)) continue; d.set(k, d.get(g.key(c.x, c.y)) + 1); q.push({ x, y }); } } return d; };

test('A*: ścieżka omija przeszkody i ma długość najkrótszej', () => {
  const g = mkGrid(['.....', '.###.', '.....', '.#...', '.....']);
  const p = findPath(g, { x: 0, y: 0 }, { x: 4, y: 4 });
  assert.equal(p.length, 8);
  assert.deepEqual(p.at(-1), { x: 4, y: 4 });
  let c = { x: 0, y: 0 }; for (const s of p) { assert.equal(Math.abs(s.x - c.x) + Math.abs(s.y - c.y), 1, 'tylko kroki w 4 kierunkach'); assert.ok(g.walkable(s.x, s.y)); c = s; }
});

test('A*: brak drogi, cel zablokowany lub zajęty, start równy celowi', () => {
  const g = mkGrid(['..#..', '..#..', '..#..']);
  assert.equal(findPath(g, { x: 0, y: 0 }, { x: 4, y: 0 }), null, 'mur odcina połowę');
  assert.equal(findPath(g, { x: 0, y: 0 }, { x: 2, y: 1 }), null, 'cel w ścianie');
  assert.equal(findPath(g, { x: 0, y: 0 }, { x: 1, y: 1 }, new Set([g.key(1, 1)])), null, 'cel zajęty przez jednostkę');
  assert.deepEqual(findPath(g, { x: 0, y: 0 }, { x: 0, y: 0 }), []);
});

test('A* zgadza się z niezależnym BFS na 300 losowych planszach', () => {
  const r = rng(11);
  for (let i = 0; i < 300; i++) {
    const g = new IsoGrid(8, 8); for (let k = 0; k < r.int(0, 18); k++) g.block(r.int(0, 7), r.int(0, 7));
    const from = { x: r.int(0, 7), y: r.int(0, 7) }, to = { x: r.int(0, 7), y: r.int(0, 7) };
    if (g.isBlocked(from.x, from.y)) continue;
    const want = bfsDist(g, from).get(g.key(to.x, to.y)), got = findPath(g, from, to);
    if (g.isBlocked(to.x, to.y)) { assert.equal(got, null); continue; }
    if (want === undefined) assert.equal(got, null, `plansza ${i}`); else assert.equal(got.length, want, `plansza ${i}`);
  }
});

test('zasięg ruchu: dokładnie komórki w odległości <= PM (zgodnie z BFS), z kosztem', () => {
  const r = rng(5);
  for (let i = 0; i < 100; i++) {
    const g = new IsoGrid(9, 9); for (let k = 0; k < r.int(0, 20); k++) g.block(r.int(0, 8), r.int(0, 8));
    const from = { x: r.int(0, 8), y: r.int(0, 8) }; if (g.isBlocked(from.x, from.y)) continue;
    const pm = r.int(1, 6), got = reachable(g, from, pm), d = bfsDist(g, from);
    const want = [...d].filter(([k, v]) => v >= 1 && v <= pm);
    assert.equal(got.size, want.length);
    for (const [k, v] of want) assert.equal(got.get(k).cost, v);
  }
});

const mk = (extra = {}) => createState({ cols: 8, rows: 8, blocked: [{ x: 3, y: 3 }, { x: 4, y: 3 }], seed: 7, units: [
  { id: 'h', team: 'gracz', x: 1, y: 6, maxPm: 4, initiative: 10 },
  { id: 'a', team: 'wrog', x: 6, y: 1, maxPm: 3, initiative: 5 },
  { id: 'b', team: 'wrog', x: 6, y: 2, maxPm: 3, initiative: 2 }], ...extra });

test('komenda ruchu: zmienia pozycję i odejmuje PM, nie mutuje starego stanu', () => {
  const s = mk(), snap = JSON.stringify(s);
  const r = applyCommand(s, { type: 'move', unit: 'h', to: { x: 3, y: 6 } });
  assert.ok(r.ok); assert.equal(JSON.stringify(s), snap, 'wejściowy stan nietknięty');
  const h = unitById(r.state, 'h'); assert.deepEqual([h.x, h.y, h.pm], [3, 6, 2]);
  assert.equal(r.events[0].type, 'moved'); assert.equal(r.events[0].cost, 2);
});

test('komenda ruchu: odrzuca ruchy nielegalne z właściwym kodem', () => {
  const s = mk(), mv = (unit, x, y) => applyCommand(s, { type: 'move', unit, to: { x, y } });
  assert.equal(mv('a', 5, 1).error, 'not_your_turn', 'nie jego tura');
  assert.equal(mv('zz', 1, 1).error, 'no_unit');
  assert.equal(mv('h', 9, 9).error, 'out_of_bounds');
  assert.equal(mv('h', 3, 3).error, 'blocked');
  assert.equal(mv('h', 1, 6).error, 'same_cell');
  assert.equal(mv('h', 7, 7).error, 'too_far', '4 PM nie wystarczy na 7 kroków');
  assert.equal(applyCommand(s, { type: 'dance', unit: 'h' }).error, 'unknown_command');
  assert.equal(applyCommand(s, null).error, 'unknown_command');
});

test('jednostki blokują się nawzajem: nie wejdziesz na zajęty kafel ani nie przejdziesz przez wąskie przejście', () => {
  const s = createState({ cols: 5, rows: 1, units: [{ id: 'h', team: 'gracz', x: 0, y: 0, maxPm: 4, initiative: 9 }, { id: 'e', team: 'wrog', x: 2, y: 0, maxPm: 3 }] });
  assert.equal(applyCommand(s, { type: 'move', unit: 'h', to: { x: 2, y: 0 } }).error, 'occupied');
  assert.equal(applyCommand(s, { type: 'move', unit: 'h', to: { x: 4, y: 0 } }).error, 'no_path', 'korytarz zablokowany przeciwnikiem');
  assert.ok(applyCommand(s, { type: 'move', unit: 'h', to: { x: 1, y: 0 } }).ok);
});

test('tury: kolejka wg inicjatywy, rundy rosną, PM odnawiają się na starcie tury', () => {
  let s = mk(); assert.deepEqual(s.order, ['h', 'a', 'b']);
  s = applyCommand(s, { type: 'move', unit: 'h', to: { x: 3, y: 6 } }).state;
  assert.equal(unitById(s, 'h').pm, 2);
  s = applyCommand(s, { type: 'endTurn', unit: 'h' }).state; assert.equal(currentUnit(s).id, 'a');
  s = applyCommand(s, { type: 'endTurn', unit: 'a' }).state; s = applyCommand(s, { type: 'endTurn', unit: 'b' }).state;
  assert.equal(currentUnit(s).id, 'h'); assert.equal(s.turn.round, 2);
  assert.equal(unitById(s, 'h').pm, 4, 'PM odnowione');
});

test('martwe jednostki są pomijane w kolejce', () => {
  let s = mk(); unitById(s, 'a').hp = 0;
  s = applyCommand(s, { type: 'endTurn', unit: 'h' }).state;
  assert.equal(currentUnit(s).id, 'b');
});

test('sztuczna inteligencja: zbliża się do bohatera, nie wchodzi w ścianę ani w jednostkę, kończy turę', () => {
  let s = mk(); s = applyCommand(s, { type: 'endTurn', unit: 'h' }).state;
  const before = unitById(s, 'a'), dist = (u, v) => Math.abs(u.x - v.x) + Math.abs(u.y - v.y), d0 = dist(before, unitById(s, 'h'));
  const { state, commands } = playTurn(s, applyCommand);
  assert.equal(commands.at(-1).type, 'endTurn');
  assert.ok(dist(unitById(state, 'a'), unitById(state, 'h')) < d0, 'podszedł bliżej');
  assert.equal(currentUnit(state).id, 'b');
});

test('determinizm: ten sam stan i lista komend zawsze dają ten sam wynik, inne ziarno inne', () => {
  const run = (seed) => { let s = mk({ seed }); const r = rng(seed); for (let i = 0; i < 40; i++) { const u = currentUnit(s), mv = [...legalMoves(s, u.id).values()]; const cmd = mv.length && r() < 0.8 ? { type: 'move', unit: u.id, to: (() => { const m = r.pick(mv); return { x: m.x, y: m.y }; })() } : { type: 'endTurn', unit: u.id }; const res = applyCommand(s, cmd); assert.ok(res.ok); s = res.state; } return s; };
  assert.equal(JSON.stringify(run(3)), JSON.stringify(run(3)));
  assert.notEqual(JSON.stringify(run(3)), JSON.stringify(run(4)));
  // odtworzenie z zapisu komend
  const a = run(5); let s = mk({ seed: 5 }); for (const c of a.log) s = applyCommand(s, c).state;
  assert.equal(JSON.stringify(s), JSON.stringify(a));
});

test('niezmienniki na 300 losowych sekwencjach: jednostki nie nachodzą na siebie ani na ściany, PM nigdy ujemne', () => {
  for (let seed = 1; seed <= 300; seed++) {
    let s = mk({ seed }); const r = rng(seed * 13);
    for (let i = 0; i < 25; i++) {
      const u = currentUnit(s), mv = [...legalMoves(s, u.id).values()];
      const cmd = r() < 0.15 ? { type: 'endTurn', unit: u.id } : r() < 0.7 && mv.length ? { type: 'move', unit: u.id, to: (({ x, y }) => ({ x, y }))(r.pick(mv)) } : { type: 'move', unit: u.id, to: { x: r.int(-1, 9), y: r.int(-1, 9) } };
      const res = applyCommand(s, cmd); if (res.ok) s = res.state;
      const g = gridOf(s), seen = new Set();
      for (const un of s.units) { assert.ok(g.inBounds(un.x, un.y) && !g.isBlocked(un.x, un.y), `seed ${seed}: w ścianie`); const k = g.key(un.x, un.y); assert.ok(!seen.has(k), `seed ${seed}: dwie jednostki na jednym kaflu`); seen.add(k); assert.ok(un.pm >= 0 && un.pm <= un.maxPm); }
    }
  }
});
