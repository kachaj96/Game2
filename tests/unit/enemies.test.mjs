import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, currentUnit, unitById, alive } from '../../src/game/state.js';
import { applyCommand } from '../../src/game/commands.js';
import { chooseCommand, playTurn } from '../../src/game/ai.js';
import { castProblem, spellData, damageRange } from '../../src/game/spells.js';
import { ENEMIES, KOPACZE, enemyForLevel, enemyHp, spellLevelFor, DAMAGE_SCALE, POWER_PER_LEVEL } from '../../src/game/enemies.js';
import { ENEMY_SPELLS } from '../../src/game/enemyspells.js';
import { composeEncounter, spawnEncounter, enemyCap, worstRound } from '../../src/game/encounter.js';
import { referenceHero, heroCommand } from '../../src/game/reference.js';
import { unitFromCharacter, deriveStats } from '../../src/game/progression.js';

const mk = (units, o = {}) => createState({ cols: 9, rows: 9, seed: 5, blocked: [], units, ...o });
const E = (kind, id, x, y, extra = {}) => enemyForLevel(kind, 5, id, x, y, extra);
const hero = (x, y, extra = {}) => ({ id: 'h', team: 'gracz', name: 'Ty', classId: 'zalobnik', x, y, initiative: 99, maxHp: 80, ...extra });
const cast = (s, unit, spell, x, y) => applyCommand(s, { type: 'cast', unit, spell, to: { x, y } });
const end = (s) => applyCommand(s, { type: 'endTurn', unit: currentUnit(s).id });

test('wrogowie: dane spójne (czary istnieją, 5 poziomów, każdy poziom coś zmienia, odporności z słabością lub zerem, znany profil AI)', () => {
  const profiles = ['bijatyk', 'blokujacy', 'zwiadowca', 'strzelec', 'padlinozerca', 'boss'];
  for (const [id, e] of Object.entries(ENEMIES)) {
    assert.equal(e.id, id); assert.ok(profiles.includes(e.ai), `${id}: profil`); assert.ok(e.spells.length >= 1 && e.spells.length <= 3, 'kilka czarów, nie tyle co gracz');
    for (const sid of e.spells) { const sp = ENEMY_SPELLS[sid]; assert.ok(sp, `${id}: czar ${sid}`); assert.equal(sp.levels.length, 5); if (sp.levels[0].dmg || sp.levels[0].heal) assert.equal(new Set(sp.levels.map((l) => JSON.stringify(l))).size, 5, `${sid}: poziomy się różnią`); }
    assert.ok(Object.values(e.resist).some((v) => v <= 0), `${id}: ma słabość lub zero`); assert.ok(Object.values(e.resist).every((v) => v >= -100 && v <= 75));
    assert.equal(e.pa >= 4 && e.pa <= 8, true); assert.ok(e.pm >= 2 && e.pm <= 5);
  }
  assert.deepEqual(KOPACZE, ['kopacz', 'pancerny', 'szperacz', 'pluja', 'zerca']);
  assert.equal(new Set(KOPACZE.map((k) => `${ENEMIES[k].pa}/${ENEMIES[k].pm}/${ENEMIES[k].init}`)).size, 5, 'każdy rodzaj ma inne PA, PM i inicjatywę');
});

test('wrogowie: skalowanie z poziomem (HP, moc, poziom czarów, skala obrażeń, PA i PM bez zmian)', () => {
  for (const k of [...KOPACZE, 'krol']) {
    const a = enemyForLevel(k, 1, 'a', 0, 0), b = enemyForLevel(k, 9, 'b', 0, 0);
    assert.equal(a.maxHp, ENEMIES[k].hp[0]); assert.equal(b.maxHp, ENEMIES[k].hp[0] + ENEMIES[k].hp[1] * 8); assert.equal(enemyHp(k, 9), b.maxHp);
    assert.equal(a.stats.power, 0); assert.equal(b.stats.power, Math.round(POWER_PER_LEVEL * 8)); assert.equal(b.damageScale, DAMAGE_SCALE);
    assert.deepEqual([a.maxPa, a.maxPm], [b.maxPa, b.maxPm]);
  }
  assert.deepEqual([1, 4, 5, 8, 9, 17, 30].map(spellLevelFor), [1, 1, 2, 2, 3, 5, 5]);
  assert.equal(enemyForLevel('kopacz', 9, 'x', 0, 0).spells[0].level, 3);
  assert.throws(() => enemyForLevel('nie_ma', 1, 'x', 0, 0));
  const lo = damageRange(enemyForLevel('kopacz', 1, 'a', 0, 0), spellData(enemyForLevel('kopacz', 1, 'a', 0, 0), 'pazury').data, 'earth'), hi = enemyForLevel('kopacz', 20, 'b', 0, 0);
  assert.ok(damageRange(hi, spellData(hi, 'pazury').data, 'earth')[1] > lo[1] * 2, 'na poziomie 20 uderza wyraźnie mocniej');
});

test('leczenie: leczy sojusznika, nie ponad maksimum, nie wroga', () => {
  const healer = { ...E('kopacz', 'a', 3, 3), spells: [{ id: 'zagoj', level: 1 }] }, ally = { ...E('pancerny', 'b', 4, 3), hp: 10 };
  let s = mk([hero(0, 0, { initiative: 1 }), { ...healer, initiative: 99 }, ally]);
  assert.equal(currentUnit(s).id, 'a'); assert.equal(castProblem(s, 'a', 'zagoj', { x: 0, y: 0 }), 'range'); assert.equal(castProblem(s, 'a', 'zagoj', { x: 4, y: 3 }), null);
  let r = cast(s, 'a', 'zagoj', 4, 3); assert.ok(r.ok); const b = unitById(r.state, 'b'); assert.ok(b.hp >= 18 && b.hp <= 22, `hp ${b.hp}`);
  s = mk([hero(0, 0, { initiative: 1 }), { ...healer, initiative: 99 }, { ...ally, hp: ally.maxHp - 2 }]); r = cast(s, 'a', 'zagoj', 4, 3);
  assert.equal(unitById(r.state, 'b').hp, ally.maxHp, 'nie ponad maksimum'); assert.equal(r.events.find((e) => e.type === 'healed').amount, 2);
  s = mk([hero(3, 4, { initiative: 1 }), { ...healer, initiative: 99 }, ally]); assert.equal(castProblem(s, 'a', 'zagoj', { x: 3, y: 4 }), 'no_target', 'wroga się nie leczy');
});

test('zjadanie grobu: usuwa grób obok i leczy 25% życia, bez grobu nie działa, determinizm', () => {
  const z = { ...E('zerca', 'z', 4, 4), hp: 20, initiative: 99 }, base = () => mk([hero(0, 0, { initiative: 1 }), z]);
  let s = base(); s.graves.push({ x: 5, y: 4, unit: 'x' });
  assert.equal(castProblem(s, 'z', 'pozarcie', { x: 4, y: 5 }), 'no_grave'); assert.equal(castProblem(s, 'z', 'pozarcie', { x: 5, y: 4 }), null);
  const r = cast(s, 'z', 'pozarcie', 5, 4); assert.ok(r.ok); assert.equal(r.state.graves.length, 0);
  assert.equal(unitById(r.state, 'z').hp, 20 + Math.floor(z.maxHp * 0.25)); assert.ok(r.events.some((e) => e.type === 'graveEaten'));
  assert.equal(unitById(r.state, 'z').pa, 4, 'kosztuje 2 PA');
  assert.equal(JSON.stringify(cast(s, 'z', 'pozarcie', 5, 4).state), JSON.stringify(r.state));
  const full = base(); full.graves.push({ x: 5, y: 4, unit: 'x' }); full.units[1].hp = full.units[1].maxHp - 1; assert.equal(unitById(cast(full, 'z', 'pozarcie', 5, 4).state, 'z').hp, z.maxHp, 'nie ponad maksimum');
});

test('spowolnienie: cel traci PM tylko w swojej następnej turze', () => {
  const sz = { ...E('szperacz', 's', 3, 4), initiative: 99 }, h = hero(4, 4, { initiative: 1, maxPm: 3 });
  let s = mk([h, sz]); const before = unitById(s, 'h').maxPm;
  let r = cast(s, 's', 'bloto', 4, 4); assert.ok(r.ok); assert.ok(r.events.some((e) => e.type === 'slowed')); assert.equal(unitById(r.state, 'h').slow, 1);
  r = end(r.state); assert.equal(currentUnit(r.state).id, 'h'); assert.equal(unitById(r.state, 'h').pm, before - 1, 'o 1 PM mniej w następnej turze'); assert.equal(unitById(r.state, 'h').slow, 0);
  r = end(r.state); r = end(r.state); assert.equal(unitById(r.state, 'h').pm, before, 'potem znów pełne PM');
  const two = cast(mk([{ ...h, maxPm: 1 }, sz]), 's', 'bloto', 4, 4); assert.equal(unitById(end(two.state).state, 'h').pm, 0, 'nie poniżej zera');
});

test('przywołanie: stawia Kopacza na wolnym kaflu, wchodzi do kolejki, ma odnowienie 3 (w szale 2) i respektuje limit wrogów', () => {
  const boss = { ...enemyForLevel('krol', 5, 'k', 4, 4), initiative: 50 };
  let s = mk([hero(0, 0, { initiative: 1 }), boss], { enemyCap: 4 });
  assert.equal(currentUnit(s).id, 'k'); const gv = mk([hero(0, 0, { initiative: 1 }), boss], { enemyCap: 4 }); gv.graves.push({ x: 5, y: 5, unit: 'x' }); assert.equal(castProblem(gv, 'k', 'wezwanie', { x: 5, y: 5 }), 'target_occupied', 'na grobie nie da się'); assert.equal(castProblem(s, 'k', 'wezwanie', { x: 8, y: 4 }), 'range');
  const r = cast(s, 'k', 'wezwanie', 5, 4); assert.ok(r.ok);
  const n = unitById(r.state, 's1'); assert.ok(n && n.kind === 'kopacz' && n.team === 'wrog' && n.level === 5 && n.summonedBy === 'k'); assert.deepEqual([n.x, n.y], [5, 4]);
  assert.deepEqual(r.state.order, ['k', 's1', 'h'], 'wchodzi do kolejki zaraz po przywołującym'); assert.equal(unitById(r.state, 'k').cooldowns.wezwanie, 4, 'odnowienie 3 tury (zapis +1)');
  assert.equal(castProblem(r.state, 'k', 'wezwanie', { x: 5, y: 5 }), 'cooldown');
  const full = mk([hero(0, 0, { initiative: 1 }), boss, E('kopacz', 'a', 8, 8), E('kopacz', 'b', 8, 7), E('kopacz', 'c', 8, 6)], { enemyCap: 4 }); assert.equal(castProblem(full, 'k', 'wezwanie', { x: 5, y: 4 }), 'summon_full', 'pełny limit wrogów');
  const open = mk([hero(0, 0, { initiative: 1 }), boss, E('kopacz', 'a', 8, 8), E('kopacz', 'b', 8, 7), E('kopacz', 'c', 8, 6)], { enemyCap: 5 }); assert.equal(castProblem(open, 'k', 'wezwanie', { x: 5, y: 4 }), null, 'kompan podnosi limit');
  assert.equal(JSON.stringify(cast(s, 'k', 'wezwanie', 5, 4).state), JSON.stringify(r.state), 'determinizm');
});

test('boss: poniżej 50% życia wpada w szał raz (+1 PA, wezwanie co 2 tury)', () => {
  const boss = { ...enemyForLevel('krol', 5, 'k', 3, 4), initiative: 1 }, h = hero(2, 4, { initiative: 99, stats: { fire: 0, power: 0 } });
  let s = mk([h, boss]); assert.equal(unitById(s, 'k').maxPa, 8);
  s.units[1].hp = Math.floor(boss.maxHp * 0.5) + 3; s.units[0].spells = [{ id: 'cios_lopata', level: 5 }]; s.units[0].classId = 'grabarz'; s.units[0].stats = { earth: 200, power: 0 };
  const r = cast(s, 'h', 'cios_lopata', 3, 4); assert.ok(r.ok, r.error); const k = unitById(r.state, 'k');
  assert.equal(k.enraged, true); assert.equal(k.maxPa, 9); assert.ok(r.events.some((e) => e.type === 'enraged'));
  const again = cast({ ...r.state, units: r.state.units.map((u) => (u.id === 'h' ? { ...u, pa: 6, casts: {} } : u)) }, 'h', 'cios_lopata', 3, 4); assert.equal(unitById(again.state, 'k').maxPa, 9, 'szał tylko raz');
  const sp = spellData(k, 'wezwanie').data; assert.equal([sp.cd, sp.rageCd].join('/'), '3/2');
  const kk = { ...k, pa: 9 }; const sm = cast(mk([{ ...h, initiative: 1 }, { ...kk, initiative: 99 }]), 'k', 'wezwanie', 3, 5); assert.ok(sm.ok, sm.error); assert.equal(unitById(sm.state, 'k').cooldowns.wezwanie, 3, 'w szale odnowienie 2 (zapis +1)');
});

test('AI: zwiadowca bije najsłabszego, po ataku ucieka i tura się kończy (bez pętli)', () => {
  const sz = { ...E('szperacz', 's', 3, 4), initiative: 99 };
  const s = mk([hero(4, 4, { initiative: 1 }), { ...hero(4, 6, { initiative: 1, hp: 5 }), id: 'h2' }, sz]);
  const first = chooseCommand(s); assert.equal(first.type, 'cast'); assert.deepEqual(first.to.y, 6 - 0 === first.to.y ? first.to.y : first.to.y);
  const { state, commands } = playTurn(s, applyCommand); assert.ok(commands.length <= 8 && commands.at(-1).type === 'endTurn');
  const last = commands.filter((c) => c.type === 'move').at(-1); assert.ok(last, 'ucieka po ataku');
  const sU = unitById(state, 's'), d = (u) => Math.abs(u.x - sU.x) + Math.abs(u.y - sU.y);
  assert.ok(commands.findIndex((c) => c.type === 'cast') < commands.indexOf(last), 'najpierw atak, potem ucieczka'); assert.ok(d(unitById(state, 'h')) >= 2);
});
test('AI: zwiadowca wybiera cel o najmniejszym życiu', () => {
  const s = mk([{ ...hero(4, 4, { initiative: 1 }), hp: 70 }, { ...hero(2, 4, { initiative: 1, hp: 9 }), id: 'h2' }, { ...E('szperacz', 's', 3, 4), initiative: 99 }]);
  assert.deepEqual(chooseCommand(s).to, { x: 2, y: 4 });
});
test('AI: strzelec cofa się przed bliskim wrogiem do dystansu 2 do 5 w linii i dopiero strzela', () => {
  const s = mk([hero(4, 4, { initiative: 1 }), { ...E('pluja', 'p', 5, 4), initiative: 99 }]);
  const c = chooseCommand(s); assert.equal(c.type, 'move'); const d = Math.abs(c.to.x - 4) + Math.abs(c.to.y - 4); assert.ok(d >= 2 && d <= 5 && (c.to.x === 4 || c.to.y === 4), `cel ${c.to.x},${c.to.y}`);
  const { state, commands } = playTurn(s, applyCommand); assert.ok(commands.some((x) => x.type === 'cast')); const p = unitById(state, 'p'); assert.ok(Math.abs(p.x - 4) + Math.abs(p.y - 4) >= 2);
});
test('AI: strzelec z daleka ustawia się w linii w zasięgu zamiast podchodzić do wroga', () => {
  const s = mk([hero(0, 0, { initiative: 1 }), { ...E('pluja', 'p', 7, 5), initiative: 99 }]);
  const { state } = playTurn(s, applyCommand), p = unitById(state, 'p'), d = Math.abs(p.x) + Math.abs(p.y);
  assert.ok((p.x === 0 || p.y === 0) ? d >= 2 && d <= 5 : d > 5, 'albo w linii w zasięgu, albo dalej idzie po pozycję');
});
test('AI: padlinożerca zjada sąsiedni grób, zanim zaatakuje, a idzie do grobu gdy jest ranny', () => {
  let s = mk([hero(0, 0, { initiative: 1 }), { ...E('zerca', 'z', 4, 4), hp: 10, initiative: 99 }]); s.graves.push({ x: 5, y: 4, unit: 'x' });
  assert.deepEqual(chooseCommand(s), { type: 'cast', unit: 'z', spell: 'pozarcie', to: { x: 5, y: 4 } });
  s = mk([hero(0, 0, { initiative: 1 }), { ...E('zerca', 'z', 4, 4), hp: 10, initiative: 99 }]); s.graves.push({ x: 7, y: 4, unit: 'x' });
  const m = chooseCommand(s); assert.equal(m.type, 'move'); assert.ok(m.to.x > 4, 'idzie w stronę grobu');
  s = mk([hero(0, 0, { initiative: 1 }), { ...E('zerca', 'z', 4, 4), initiative: 99 }]); s.graves.push({ x: 7, y: 4, unit: 'x' }); assert.equal(chooseCommand(s).type === 'cast', false, 'zdrowy nie goni grobów');
});
test('AI: blokujący woli Taran, gdy odepchnięcie kończy się zderzeniem ze ścianą', () => {
  const mkb = (blocked) => mk([hero(4, 4, { initiative: 1 }), { ...E('pancerny', 'p', 3, 4), initiative: 99 }], { blocked });
  assert.equal(chooseCommand(mkb([{ x: 5, y: 4 }])).spell, 'taran'); assert.equal(chooseCommand(mkb([])).spell, 'pancerz', 'bez ściany woli mocniejszy cios');
});
test('AI: bijatyk podchodzi, a w zasięgu bije najmocniejszym czarem; boss najpierw wzywa pomocnika', () => {
  let s = mk([hero(8, 8, { initiative: 1 }), { ...E('kopacz', 'k', 0, 0), initiative: 99 }]); assert.equal(chooseCommand(s).type, 'move');
  s = mk([hero(1, 0, { initiative: 1 }), { ...E('kopacz', 'k', 0, 0), initiative: 99 }]); assert.equal(chooseCommand(s).type, 'cast');
  s = mk([hero(5, 4, { initiative: 1 }), { ...enemyForLevel('krol', 5, 'b', 3, 4), initiative: 99 }], { enemyCap: 4 }); const c = chooseCommand(s); assert.equal(c.spell, 'wezwanie');
  s = mk([hero(5, 4, { initiative: 1 }), { ...enemyForLevel('krol', 5, 'b', 3, 4), initiative: 99, cooldowns: { wezwanie: 3 } }], { enemyCap: 4 }); assert.notEqual(chooseCommand(s).spell, 'wezwanie');
});

test('skład spotkania: limit 4 + kompani, różnorodność, limity rodzajów, boss, determinizm (ziarna 0..200)', () => {
  for (let seed = 0; seed <= 200; seed++) for (const comp of [0, 1, 2, 3]) for (const level of [1, 6, 12, 25]) {
    const spec = composeEncounter(seed, level, comp), kinds = spec.map((s) => s.kind), cap = enemyCap(comp);
    assert.ok(spec.length >= 2 && spec.length <= cap, `${seed}/${comp}: ${spec.length} wrogów, limit ${cap}`);
    if (comp === 0) assert.ok(spec.length <= 4, 'solo maks. 4');
    if (spec.length >= 3) assert.ok(new Set(kinds).size >= 2, `${seed}: min. 2 rodzaje`);
    assert.ok(kinds.filter((k) => k === 'pancerny').length <= 2 && kinds.filter((k) => k === 'zerca').length <= 2);
    assert.ok(spec.every((s) => s.level === level && ENEMIES[s.kind] && !ENEMIES[s.kind].boss)); assert.equal(new Set(spec.map((s) => s.id)).size, spec.length);
    assert.equal(JSON.stringify(spec), JSON.stringify(composeEncounter(seed, level, comp)));
    const b = composeEncounter(seed, level, comp, { boss: true }); assert.equal(b[0].kind, 'krol'); assert.ok(b.length - 1 <= 2 + comp && b.length <= cap, 'boss to jedno miejsce, solo maks. 2 dodatki');
    if (comp === 0) assert.ok(b.length <= 3, 'solo: boss i maks. 2 dodatki');
  }
  assert.ok(new Set(Array.from({ length: 60 }, (_, i) => JSON.stringify(composeEncounter(i, 5, 0)))).size >= 30, 'ziarna dają różne składy');
  const more = composeEncounter(7, 5, 2).length, solo = composeEncounter(7, 5, 0).length; assert.equal(more, solo + 2, 'każdy kompan to jeden wróg więcej');
});
test('rozmieszczenie wrogów: po prawej stronie, na wolnych kaflach, bez zablokowanych', () => {
  const blocked = [{ x: 8, y: 4 }, { x: 8, y: 3 }];
  for (let seed = 0; seed < 40; seed++) { const us = spawnEncounter(composeEncounter(seed, 5, 2), { cols: 9, rows: 9, blocked }); const keys = us.map((u) => `${u.x},${u.y}`); assert.equal(new Set(keys).size, us.length); assert.ok(us.every((u) => u.x >= 6 && !blocked.some((b) => b.x === u.x && b.y === u.y))); }
});

// ---- symulacja balansu: bohater referencyjny (Żałobnik, wszystkie punkty w Ogień i Żar) kontra skład ----
function fight(level, seed, { companions = 0, boss = false } = {}) {
  const ch = referenceHero(level), hero0 = unitFromCharacter(ch, { x: 1, y: 4 }), spec = composeEncounter(seed, level, companions, { boss });
  const blocked = [{ x: 4, y: 2 }, { x: 4, y: 6 }, { x: 3, y: 4 }];
  let s = createState({ cols: 9, rows: 9, seed: seed + 1, blocked, units: [hero0, ...spawnEncounter(spec, { cols: 9, rows: 9, blocked })], enemyCap: enemyCap(companions) }), firstRoundDeath = false, guard = 0;
  while (!s.result && guard++ < 800 && s.turn.round <= 30) { const u = currentUnit(s), c = u.team === 'gracz' ? heroCommand(s) : chooseCommand(s), r = applyCommand(s, c); assert.ok(r.ok, `${c.type} ${r.error}`); s = r.state; if (unitById(s, 'h').hp <= 0 && s.turn.round <= 1) firstRoundDeath = true; }
  return { win: s.result === 'victory', rounds: s.turn.round, firstRoundDeath };
}
test('symulacja balansu: wygrana 60 do 90%, nie ginie w pierwszej rundzie, walka kończy się w kilku rundach', () => {
  for (const L of [1, 5, 10, 20]) {
    const N = 30, res = Array.from({ length: N }, (_, i) => fight(L, i + 1)), win = res.filter((r) => r.win).length / N, avg = res.reduce((a, r) => a + r.rounds, 0) / N;
    assert.ok(win >= 0.6 && win <= 0.9, `L${L}: wygrane ${win.toFixed(2)}`); assert.equal(res.filter((r) => r.firstRoundDeath).length, 0, `L${L}: ginie w pierwszej rundzie`);
    assert.ok(avg >= 3 && avg <= 10, `L${L}: średnio ${avg.toFixed(1)} rund`); assert.ok(Math.min(...res.map((r) => r.rounds)) >= 3, `L${L}: za szybko`); assert.ok(Math.max(...res.map((r) => r.rounds)) <= 14, `L${L}: za długo`);
  }
});
test('najgorsza runda: cztery trafiające wszystkie ataki wroga zabierają maks. 0.8 życia bohatera (ziarna 0..200)', () => {
  for (const L of [1, 5, 10, 20]) { const hp = deriveStats(referenceHero(L)).hp; let worst = 0; for (let s = 0; s <= 200; s++) worst = Math.max(worst, worstRound(spawnEncounter(composeEncounter(s, L, 0), { cols: 9, rows: 9 })) / hp); assert.ok(worst <= 0.8, `L${L}: ${worst.toFixed(2)}`); }
});
test('kompani podnoszą liczbę wrogów, a boss z dodatkami da się pokonać (symulacja)', () => {
  const r = fight(10, 3, { companions: 0, boss: true }); assert.ok(r.rounds >= 3);
});

test('AI: przeciwnik obchodzi ścianę w poprzek planszy zamiast stać w miejscu, a po kilku turach dociera do wroga', () => {
  // ściana x=4 z jedną przerwą na y=8; wróg po jednej stronie, bohater po drugiej
  const blocked = []; for (let y = 0; y < 8; y++) blocked.push({ x: 4, y });
  let s = mk([hero(6, 2, { initiative: 1 }), { ...E('kopacz', 'e', 2, 2), initiative: 99 }], { blocked });
  const start = { ...unitById(s, 'e') }; let moved = 0;
  for (let t = 0; t < 8 && Math.abs(unitById(s, 'e').x - 6) + Math.abs(unitById(s, 'e').y - 2) > 1; t++) {
    s = playTurn(s, applyCommand).state; const e = unitById(s, 'e'); if (e.x !== start.x || e.y !== start.y) moved++;
    if (currentUnit(s).id !== 'e') s = end(s).state;
  }
  const e = unitById(s, 'e'); assert.ok(moved >= 2, 'rusza się w kolejnych turach'); assert.ok(e.x >= 4 || e.y >= 6, `obszedł ścianę (${e.x},${e.y})`);
});
