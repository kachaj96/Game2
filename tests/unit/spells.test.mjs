import test from 'node:test';
import assert from 'node:assert/strict';
import { IsoGrid } from '../../src/grid.js';
import { rng } from '../../src/art/rng.js';
import { lineCells, hasLineOfSight } from '../../src/game/los.js';
import { createState, currentUnit, unitById, gridOf, alive } from '../../src/game/state.js';
import { applyCommand, legalMoves } from '../../src/game/commands.js';
import { castProblem, validTargets, damageRange, spellData, implemented, graveKeys, sightBlockers } from '../../src/game/spells.js';
import { CLASSES, CLASS_LIST } from '../../src/game/classdata.js';
import { chooseCommand, playTurn } from '../../src/game/ai.js';

const mk = (o = {}, units) => createState({ cols: 9, rows: 9, seed: 5, blocked: [], ...o, units: units || o.units || [
  { id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10 },
  { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 30, initiative: 5 }] });
const cast = (s, spell, x, y, unit = 'm') => applyCommand(s, { type: 'cast', unit, spell, to: { x, y } });
const ok = (r) => { assert.ok(r.ok, r.error); return r.state; };
const nextTurnOf = (s, id) => { let t = s; for (let i = 0; i < 20 && currentUnit(t).id !== id; i++) t = ok(applyCommand(t, { type: 'endTurn', unit: currentUnit(t).id })); return t; };

test('linia widzenia: czysta, zasłonięta ścianą lub grobem, symetryczna, sąsiad zawsze widoczny', () => {
  const g = new IsoGrid(9, 9), none = new Set(); g.block(3, 4);
  assert.ok(hasLineOfSight(g, none, { x: 0, y: 0 }, { x: 5, y: 0 }), 'czysta linia');
  assert.ok(!hasLineOfSight(g, none, { x: 1, y: 4 }, { x: 5, y: 4 }), 'ściana pośrodku');
  assert.ok(hasLineOfSight(g, none, { x: 1, y: 4 }, { x: 3, y: 5 }), 'omija ścianę');
  assert.ok(!hasLineOfSight(g, new Set([g.key(2, 0)]), { x: 0, y: 0 }, { x: 5, y: 0 }), 'grób zasłania');
  assert.ok(hasLineOfSight(g, none, { x: 2, y: 4 }, { x: 3, y: 4 }) , 'sąsiad, ściana jest celem a nie przeszkodą pośrodku');
  const r = rng(3);
  for (let i = 0; i < 300; i++) {
    const b = new IsoGrid(9, 9); for (let k = 0; k < r.int(0, 14); k++) b.block(r.int(0, 8), r.int(0, 8));
    const a = { x: r.int(0, 8), y: r.int(0, 8) }, c = { x: r.int(0, 8), y: r.int(0, 8) };
    assert.equal(hasLineOfSight(b, none, a, c), hasLineOfSight(b, none, c, a), `symetria ${i}`);
    const l = lineCells(a, c); assert.deepEqual([l[0], l.at(-1)].map((q) => `${q.x},${q.y}`).sort(), [`${a.x},${a.y}`, `${c.x},${c.y}`].sort());
    for (let k = 1; k < l.length; k++) assert.ok(Math.abs(l[k].x - l[k - 1].x) <= 1 && Math.abs(l[k].y - l[k - 1].y) <= 1, 'ciągła linia');
  }
});

test('czar obrażeń: koszt PA, obrażenia w widełkach, odjęcie życia, zapis zdarzenia', () => {
  let s = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 60, initiative: 5 }] });
  const r = cast(s, 'zar', 5, 4); s = ok(r);
  const hit = r.events[0].hits[0], e = unitById(s, 'e'), m = unitById(s, 'm');
  assert.ok(hit.dmg >= 12 && hit.dmg <= 16, `obrażenia ${hit.dmg}`); assert.equal(e.hp, 60 - hit.dmg); assert.equal(m.pa, 3); assert.equal(m.casts.zar, 1);
  assert.equal(r.events[0].type, 'cast');
});

test('kody błędów: zasięg, brak celu, cel sojuszniczy, brak PA, limit na turę, nieznany czar', () => {
  const s = mk();
  assert.equal(cast(s, 'zar', 3, 4).error, 'no_target', 'pusty kafel w zasięgu');
  assert.equal(cast(s, 'zar', 1, 5).error, 'range', 'za blisko: min 2'); // odległość 1
  assert.equal(cast(s, 'zar', 9, 9).error, 'out_of_bounds');
  assert.equal(cast(s, 'xyz', 5, 4).error, 'spell_unknown');
  assert.equal(castProblem(s, 'm', 'zar', { x: 9, y: 4 }), 'out_of_bounds');
  const far = mk({}, [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 0, y: 0, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 8, y: 8, initiative: 5 }]);
  assert.equal(cast(far, 'zar', 8, 8).error, 'range', 'za daleko');
  const ally = mk({}, [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10 }, { id: 'b', team: 'gracz', classId: 'grabarz', x: 4, y: 4, initiative: 8 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 8, y: 8, initiative: 5 }]);
  assert.equal(cast(ally, 'zar', 4, 4).error, 'no_target', 'nie bijemy sojusznika');
  // limit na turę: 3 PA x 2 rzuty = 6 PA, trzeci rzut: brak PA; z większą pulą PA zadziała limit
  let t = mk({}, [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10, maxPa: 12 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 500, initiative: 5 }]);
  t = ok(cast(t, 'zar', 5, 4)); t = ok(cast(t, 'zar', 5, 4)); assert.equal(cast(t, 'zar', 5, 4).error, 'limit');
  let u = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10, maxPa: 4 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 500, initiative: 5 }] });
  u = ok(cast(u, 'zar', 5, 4)); assert.equal(cast(u, 'zar', 5, 4).error, 'no_pa');
});

test('linia widzenia w czarze: ściana lub grób między magiem a celem blokuje Żar', () => {
  const wall = mk({ blocked: [{ x: 3, y: 4 }], units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, initiative: 5 }] });
  assert.equal(cast(wall, 'zar', 5, 4).error, 'no_los');
  assert.deepEqual(validTargets(wall, 'm', 'zar'), [], 'żaden wróg nie jest widoczny');
  const open = mk(); assert.deepEqual(validTargets(open, 'm', 'zar'), [{ x: 5, y: 4 }]);
});

test('odnowienie: czar zablokowany przez N kolejnych tur tej jednostki, potem znów dostępny; limity zerują się co turę', () => {
  const orig = CLASSES.zalobnik.spells[0].levels[0], saved = { ...orig };
  Object.assign(orig, { cd: 2 });
  try {
    let s = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 900, initiative: 5 }] });
    s = ok(cast(s, 'zar', 5, 4)); assert.equal(cast(s, 'zar', 5, 4).error, 'cooldown', 'w tej samej turze');
    const seen = [];
    for (let turn = 1; turn <= 4; turn++) { s = nextTurnOf(nextTurnOf(s, 'e'), 'm'); seen.push(castProblem(s, 'm', 'zar', { x: 5, y: 4 })); }
    assert.deepEqual(seen, ['cooldown', 'cooldown', null, null], 'zablokowany 2 tury, potem dostępny');
    assert.equal(unitById(s, 'm').casts.zar ?? 0, 0, 'limit na turę wyzerowany');
  } finally { Object.assign(orig, saved); }
});

test('śmierć: życie 0, grób na kaflu, grób blokuje ruch i linię, zwycięstwo kończy walkę', () => {
  let s = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10, stats: { power: 0 } }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 10, initiative: 5 }] });
  const r = cast(s, 'zar', 5, 4); s = ok(r);
  assert.equal(unitById(s, 'e').hp, 0); assert.deepEqual(s.graves, [{ x: 5, y: 4, unit: 'e' }]);
  assert.ok(r.events.some((e) => e.type === 'died') && r.events.some((e) => e.type === 'finished' && e.result === 'victory'));
  assert.equal(s.result, 'victory'); assert.equal(cast(s, 'zar', 5, 4).error, 'finished');
  assert.equal(applyCommand(s, { type: 'endTurn', unit: 'm' }).error, 'finished');
  // grób blokuje ruch i linię widzenia
  const t = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 8, y: 4, initiative: 5 }] });
  t.graves.push({ x: 3, y: 4, unit: 'x' });
  assert.equal(applyCommand(t, { type: 'move', unit: 'm', to: { x: 3, y: 4 } }).error, 'occupied', 'nie wejdzie na grób');
  assert.ok(![...legalMoves(t, 'm').values()].some((c) => c.x === 3 && c.y === 4));
  assert.ok(graveKeys(t).has(gridOf(t).key(3, 4)));
  const w = mk({ units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 6, y: 4, initiative: 5 }] }); w.graves.push({ x: 4, y: 4, unit: 'x' });
  assert.equal(cast(w, 'zar', 6, 4).error, 'no_los', 'grób zasłania cel');
});

test('statystyki i skala obrażeń: moc zwiększa obrażenia, damageScale je zmniejsza', () => {
  const m = { classId: 'zalobnik', stats: { fire: 50 } }, d = spellData({ ...m, spells: [{ id: 'zar', level: 1 }] }, 'zar').data;
  assert.deepEqual(damageRange(m, d, 'fire'), [18, 24]); assert.deepEqual(damageRange({ classId: 'zalobnik', stats: {} }, d, 'fire'), [12, 16]);
  assert.deepEqual(damageRange({ classId: 'zalobnik', stats: {}, damageScale: 0.5 }, d, 'fire'), [6, 8]);
});

test('czary bez zaimplementowanego efektu są odrzucane, a nie udawane', () => {
  const impl = []; for (const c of CLASS_LIST) for (const sp of c.spells) { if (implemented(sp.levels[0])) impl.push(sp.id); }
  assert.deepEqual(impl.sort(), ['belt', 'cios_lopata', 'podmuch', 'zar', 'zrzut_ziemi']);
  for (const [cls, id] of [['grabarz', 'dol'], ['tropiciel', 'sidla'], ['tropiciel', 'odskok'], ['zalobnik', 'stos']]) {
    const s = mk({}, [{ id: 'h', team: 'gracz', classId: cls, x: 3, y: 4, initiative: 10 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 4, y: 4, initiative: 5 }]);
    assert.equal(castProblem(s, 'h', id, { x: 4, y: 4 }), 'not_implemented', `${cls}/${id}`);
  }
});

test('losowość obrażeń jest deterministyczna i zależy od ziarna', () => {
  const run = (seed) => { let s = mk({ seed, units: [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 10, maxPa: 30 }, { id: 'e', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 999, initiative: 5 }] }); const out = [];
    for (let i = 0; i < 2; i++) { const r = cast(s, 'zar', 5, 4); s = ok(r); out.push(r.events[0].hits[0].dmg); } return out.join(','); };
  assert.equal(run(7), run(7));
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(run)).size >= 4, 'różne ziarna dają różne obrażenia');
});

test('sztuczna inteligencja rzuca czar, gdy wróg jest w zasięgu, i nie rzuca bez PA', () => {
  let s = mk({}, [{ id: 'h', team: 'gracz', classId: 'zalobnik', x: 3, y: 4, initiative: 5, maxHp: 80 }, { id: 'g', team: 'wrog', classId: 'grabarz', x: 4, y: 4, initiative: 10, damageScale: 0.3 }]);
  const c = chooseCommand(s); assert.deepEqual(c, { type: 'cast', unit: 'g', spell: 'cios_lopata', to: { x: 3, y: 4 } });
  const { state, commands } = playTurn(s, applyCommand);
  assert.equal(commands.filter((x) => x.type === 'cast').length, 2, 'dwa ciosy po 3 PA'); assert.equal(commands.at(-1).type, 'endTurn');
  assert.ok(unitById(state, 'h').hp < 80); assert.ok(unitById(state, 'h').hp >= 80 - 2 * 8);
  const empty = structuredClone(s); unitById(empty, 'g').pa = 0; assert.equal(chooseCommand(empty).type, 'endTurn');
});

test('niezmienniki na 300 losowych walkach z czarami: życie, PA, groby, wynik', () => {
  for (let seed = 1; seed <= 300; seed++) {
    let s = mk({ seed, blocked: [{ x: 3, y: 3 }, { x: 5, y: 5 }], units: [
      { id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10 }, { id: 'e1', team: 'wrog', classId: 'grabarz', x: 6, y: 3, maxHp: 25, initiative: 6, damageScale: 0.4 },
      { id: 'e2', team: 'wrog', classId: 'grabarz', x: 6, y: 5, maxHp: 25, initiative: 3, damageScale: 0.4 }] });
    const r = rng(seed * 17);
    for (let i = 0; i < 40 && !s.result; i++) {
      const u = currentUnit(s); let cmd;
      if (u.team === 'wrog') cmd = chooseCommand(s);
      else { const t = r.int(0, 3); const foes = alive(s, 'wrog');
        cmd = t === 0 ? { type: 'endTurn', unit: u.id } : t === 1 && foes.length ? { type: 'cast', unit: u.id, spell: r.pick(['zar', 'zar', 'podmuch']), to: (({ x, y }) => ({ x, y }))(r.pick(foes)) } : { type: 'move', unit: u.id, to: { x: r.int(0, 8), y: r.int(0, 8) } }; }
      const res = applyCommand(s, cmd); if (res.ok) s = res.state;
      const g = gridOf(s), keys = new Set();
      for (const gr of s.graves) { const k = g.key(gr.x, gr.y); assert.ok(!keys.has(k), `seed ${seed}: dwa groby na kaflu`); keys.add(k); }
      for (const un of s.units) { assert.ok(un.hp >= 0 && un.hp <= un.maxHp && un.pa >= 0 && un.pm >= 0, `seed ${seed}: zakres`); if (un.hp > 0) { assert.ok(!keys.has(g.key(un.x, un.y)), `seed ${seed}: żywy na grobie`); assert.ok(!g.isBlocked(un.x, un.y)); } }
      assert.equal(s.graves.length, s.units.filter((x) => x.hp === 0).length, 'każdy poległy ma grób');
      if (s.result === 'victory') assert.equal(alive(s, 'wrog').length, 0); if (s.result === 'defeat') assert.equal(alive(s, 'gracz').length, 0);
    }
  }
});

// ---------- odpychanie ----------
const G = (x, y, extra = {}) => ({ id: 'g', team: 'gracz', classId: 'grabarz', x, y, initiative: 10, maxPa: 30, ...extra });
const E = (id, x, y, extra = {}) => ({ id, team: 'wrog', classId: 'grabarz', x, y, maxHp: 500, initiative: 5, ...extra });
const push = (s, tx, ty) => cast(s, 'zrzut_ziemi', tx, ty, 'g');
const board = (units, o = {}) => mk({ ...o, units });

test('odpychanie: cel leci dokładnie o tyle kafli, ile ma czar, w każdym z czterech kierunków', () => {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const r = push(board([G(4, 4), E('e', 4 + dx * 2, 4 + dy * 2)]), 4 + dx * 2, 4 + dy * 2); assert.ok(r.ok, r.error);
    const e = unitById(r.state, 'e'), ev = r.events.find((x) => x.type === 'pushed');
    assert.deepEqual([e.x, e.y], [4 + dx * 4, 4 + dy * 4], `kierunek ${dx},${dy}`); assert.equal(ev.moved, 2); assert.equal(ev.collision, 0); assert.deepEqual(ev.hits, []);
  }
});

test('odpychanie: ściana kończy lot, a kolizja zadaje obrażenia za każdy niewykorzystany kafel', () => {
  const s = board([G(2, 4), E('e', 4, 4)], { blocked: [{ x: 6, y: 4 }] });
  const r = push(s, 4, 4); assert.ok(r.ok);
  const e = unitById(r.state, 'e'), ev = r.events.find((x) => x.type === 'pushed');
  assert.deepEqual([e.x, e.y], [5, 4], 'zatrzymał się przed ścianą'); assert.equal(ev.moved, 1); assert.equal(ev.collision, 4, '1 niewykorzystany kafel x 4 obr.');
  const direct = r.events[0].hits[0].dmg; assert.equal(e.hp, 500 - direct - 4);
  // natychmiastowa ściana: cały ruch przepada
  const w = push(board([G(2, 4), E('e', 3, 4)], { blocked: [{ x: 4, y: 4 }] }), 3, 4); const ev2 = w.events.find((x) => x.type === 'pushed');
  assert.equal(ev2.moved, 0); assert.equal(ev2.collision, 8, '2 niewykorzystane kafle');
});

test('odpychanie: krawędź planszy działa jak ściana', () => {
  const r = push(board([G(5, 4), E('e', 7, 4)]), 7, 4), ev = r.events.find((x) => x.type === 'pushed');
  assert.deepEqual([unitById(r.state, 'e').x, unitById(r.state, 'e').y], [8, 4]); assert.equal(ev.moved, 1); assert.equal(ev.collision, 4);
});

test('odpychanie: grób blokuje lot jak ściana', () => {
  const s = board([G(2, 4), E('e', 4, 4)]); s.graves.push({ x: 6, y: 4, unit: 'x' });
  const ev = push(s, 4, 4).events.find((x) => x.type === 'pushed'); assert.equal(ev.moved, 1); assert.equal(ev.collision, 4);
});

test('odpychanie: zderzenie z inną jednostką rani obie, nikt nie ląduje na zajętym kaflu', () => {
  const r = push(board([G(2, 4), E('e', 4, 4), E('b', 6, 4)]), 4, 4), ev = r.events.find((x) => x.type === 'pushed');
  assert.equal(ev.blocker, 'b'); assert.equal(ev.moved, 1); assert.equal(ev.collision, 4);
  assert.deepEqual(ev.hits.map((h) => [h.unit, h.dmg]), [['e', 4], ['b', 4]]);
  assert.deepEqual([unitById(r.state, 'e').x, unitById(r.state, 'b').x], [5, 6]); assert.equal(unitById(r.state, 'b').hp, 496);
});

test('odpychanie: cel zabity obrażeniami czaru nie jest odpychany, a grób stoi na jego kaflu', () => {
  const r = push(board([G(2, 4), E('e', 4, 4, { maxHp: 5 })]), 4, 4);
  assert.ok(!r.events.some((x) => x.type === 'pushed')); assert.deepEqual(r.state.graves, [{ x: 4, y: 4, unit: 'e' }]);
});

test('odpychanie: cel zabity zderzeniem zostawia grób na kaflu, na którym się zatrzymał', () => {
  const s = board([G(2, 4), E('e', 4, 4, { maxHp: 22, hp: 22 }), E('z', 20, 20)].slice(0, 2).concat([E('z', 8, 8)]), { blocked: [{ x: 6, y: 4 }] });
  unitById(s, 'e').hp = 12; // czar zadaje 6-8, zostaje 4-6, kolizja 4 zabija przy hp<=8
  let r = null; for (const hp of [5, 6, 7, 8, 9, 10, 11, 12]) { const t = structuredClone(s); unitById(t, 'e').hp = hp; const q = push(t, 4, 4); const dm = q.events[0].hits[0].dmg; if (hp - dm > 0 && hp - dm <= 4) { r = q; break; } }
  assert.ok(r, 'znaleziono układ, w którym kolizja zabija'); assert.equal(unitById(r.state, 'e').hp, 0);
  assert.deepEqual(r.state.graves.at(-1), { x: 5, y: 4, unit: 'e' }); assert.ok(r.events.some((x) => x.type === 'died' && x.unit === 'e' && x.grave.x === 5));
});

test('odpychanie: wymaga linii i zasięgu 1-3 (Zrzut Ziemi)', () => {
  const s = board([G(2, 2), E('e', 4, 3)]); assert.equal(castProblem(s, 'g', 'zrzut_ziemi', { x: 4, y: 3 }), 'not_in_line');
  const far = board([G(0, 4), E('e', 5, 4)]); assert.equal(castProblem(far, 'g', 'zrzut_ziemi', { x: 5, y: 4 }), 'range');
  const ok1 = board([G(0, 4), E('e', 3, 4)]); assert.equal(castProblem(ok1, 'g', 'zrzut_ziemi', { x: 3, y: 4 }), null);
});

test('chmura popiołu: powstaje na kaflu, z którego cel odleciał, zasłania widok, znika na starcie następnej tury rzucającego', () => {
  const units = [{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 1, y: 4, initiative: 10, maxPa: 12 }, E('e', 3, 4, { maxHp: 900 }), E('f', 7, 4, { maxHp: 900, initiative: 4 })];
  let s = board(units); const r = cast(s, 'podmuch', 3, 4); s = ok(r);
  assert.deepEqual(s.clouds, [{ x: 3, y: 4, turns: 1, owner: 'm' }]); assert.ok(r.events.some((x) => x.type === 'cloud'));
  assert.ok(sightBlockers(s).has(gridOf(s).key(3, 4)), 'chmura w zbiorze zasłon'); assert.ok(!graveKeys(s).has(gridOf(s).key(3, 4)), 'ale to nie grób');
  assert.equal(castProblem(s, 'm', 'zar', { x: 7, y: 4 }), 'no_los', 'Żar przez chmurę nie przejdzie');
  s = nextTurnOf(nextTurnOf(s, 'f'), 'm'); assert.deepEqual(s.clouds, [], 'zniknęła na starcie tury maga');
  assert.equal(castProblem(s, 'm', 'zar', { x: 7, y: 4 }), null);
});

test('niezmienniki na 300 losowych walkach z odpychaniem: brak nakładania, ścian i grobów pod żywymi', () => {
  for (let seed = 1; seed <= 300; seed++) {
    let s = mk({ seed, blocked: [{ x: 3, y: 3 }, { x: 6, y: 5 }, { x: 2, y: 6 }], units: [
      { id: 'g', team: 'gracz', classId: 'grabarz', x: 1, y: 4, initiative: 10, maxPa: 18 }, { id: 'e1', team: 'wrog', classId: 'grabarz', x: 5, y: 4, maxHp: 40, initiative: 6, damageScale: 0.3 },
      { id: 'e2', team: 'wrog', classId: 'grabarz', x: 6, y: 2, maxHp: 40, initiative: 3, damageScale: 0.3 }] });
    const r = rng(seed * 29);
    for (let i = 0; i < 40 && !s.result; i++) {
      const u = currentUnit(s); let cmd;
      if (u.team === 'wrog') cmd = chooseCommand(s);
      else { const foes = alive(s, 'wrog'), t = r.int(0, 3), f = foes.length ? r.pick(foes) : null;
        cmd = t === 0 ? { type: 'endTurn', unit: u.id } : t === 1 && f ? { type: 'cast', unit: u.id, spell: r.pick(['zrzut_ziemi', 'cios_lopata']), to: { x: f.x, y: f.y } } : { type: 'move', unit: u.id, to: { x: r.int(0, 8), y: r.int(0, 8) } }; }
      const res = applyCommand(s, cmd); if (res.ok) s = res.state;
      const g = gridOf(s), gk = graveKeys(s), seen = new Set();
      assert.equal(s.graves.length, new Set(s.graves.map((q) => g.key(q.x, q.y))).size, `seed ${seed}: dwa groby na kaflu`);
      for (const un of s.units) { if (un.hp > 0) { const k = g.key(un.x, un.y); assert.ok(g.inBounds(un.x, un.y) && !g.isBlocked(un.x, un.y), `seed ${seed}: ${un.id} w ścianie lub poza planszą`); assert.ok(!gk.has(k), `seed ${seed}: żywy na grobie`); assert.ok(!seen.has(k), `seed ${seed}: nakładanie`); seen.add(k); } assert.ok(un.hp >= 0 && un.hp <= un.maxHp); }
      assert.equal(s.graves.length, s.units.filter((x) => x.hp === 0).length);
    }
  }
});
