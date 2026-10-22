import test from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../src/art/rng.js';
import { createState, currentUnit, unitById, alive, gridOf } from '../../src/game/state.js';
import { applyCommand } from '../../src/game/commands.js';
import { damageRange, damageRangeVs, afterResist, resistOf, statFor, elementOfSpell, spellData, RESIST_CAP, RESIST_FLOOR } from '../../src/game/spells.js';
import { CLASSES, CLASS_LIST, ELEMENTS } from '../../src/game/classdata.js';
import { ARCHETYPES, spawn } from '../../src/game/bestiary.js';
import { chooseCommand } from '../../src/game/ai.js';

const zar = (stats = {}, extra = {}) => ({ classId: 'zalobnik', team: 'gracz', stats, spells: [{ id: 'zar', level: 1 }], ...extra });
const ZAR = spellData(zar(), 'zar').data;
const vs = (stats, resist, element = 'fire') => damageRangeVs(zar(stats), ZAR, element, { team: 'wrog', resist: { [element]: resist } });
const mk = (units, o = {}) => createState({ cols: 9, rows: 9, seed: 3, blocked: [], units, ...o });
const cast = (s, spell, x, y, unit) => applyCommand(s, { type: 'cast', unit, spell, to: { x, y } });

test('wzór obrażeń: tabela z planu (Żar 12-16, 45 punktów w Ogień)', () => {
  assert.deepEqual(damageRange(zar({ fire: 45 }), ZAR, 'fire'), [17, 23]);
  assert.deepEqual(vs({ fire: 45 }, 0), [17, 23], 'bez odporności');
  assert.deepEqual(vs({ fire: 45 }, -20), [20, 27], 'słaby na ogień');
  assert.deepEqual(vs({ fire: 45 }, 30), [11, 16], 'odporny +30%');
  assert.deepEqual(vs({ fire: 45 }, 75), [4, 5], 'bardzo odporny +75%');
  assert.deepEqual(damageRange(zar(), ZAR, 'water'), [12, 16], 'cecha Ognia nie działa na wodę: bez cech wody podstawa');
  assert.deepEqual(damageRange(zar({ fire: 45 }), ZAR, 'water'), [12, 16], 'moc ognia nie wzmacnia wody');
});

test('wzór obrażeń: moc ogólna wzmacnia wszystko, neutralne tylko ją, obrażenia stałe dodają się przed odpornością', () => {
  assert.deepEqual(damageRange(zar({ power: 25 }), ZAR, 'fire'), [15, 20]); assert.deepEqual(damageRange(zar({ power: 25 }), ZAR, 'water'), [15, 20]);
  assert.deepEqual(damageRange(zar({ fire: 100, power: 10 }), ZAR, 'neutral'), [13, 17], 'neutralne ignoruje cechę żywiołu, bierze moc ogólną');
  assert.equal(statFor(zar({ fire: 30, power: 5 }), 'fire'), 35); assert.equal(statFor(zar({ fire: 30, power: 5 }), 'neutral'), 5);
  assert.deepEqual(damageRange(zar({ flat: 5 }), ZAR, 'fire'), [17, 21]);
  assert.deepEqual(vs({ flat: 10 }, 50), [11, 13], 'floor((12+10)*0.5), floor((16+10)*0.5)');
});

test('wzór obrażeń: cecha ujemna osłabia, nigdy poniżej zera; słabość nie ma sufitu ponad -100%', () => {
  assert.deepEqual(damageRange(zar({ fire: -50 }), ZAR, 'fire'), [6, 8]); assert.deepEqual(damageRange(zar({ fire: -500 }), ZAR, 'fire'), [0, 0]);
  assert.deepEqual(vs({}, -100), [24, 32], '-100% podwaja'); assert.deepEqual(vs({}, -400), [24, 32], 'słabość ograniczona do -100%');
});

test('odporności: limity gracz +50%, przeciwnik +75%, wartość ujemna do -100%', () => {
  assert.equal(RESIST_CAP.gracz, 50); assert.equal(RESIST_CAP.wrog, 75); assert.equal(RESIST_FLOOR, -100);
  assert.equal(resistOf({ team: 'gracz', resist: { fire: 90 } }, 'fire'), 50); assert.equal(resistOf({ team: 'wrog', resist: { fire: 90 } }, 'fire'), 75);
  assert.equal(resistOf({ team: 'wrog', resist: {} }, 'fire'), 0); assert.equal(afterResist({ team: 'gracz', resist: { fire: 90 } }, 'fire', 100), 50);
  assert.equal(afterResist({ team: 'wrog', resist: { fire: 100 } }, 'fire', 100), 25, 'przeciwnik: max 75% odporności');
});

test('bestiariusz: każdy archetyp ma słabość lub neutralność, wartości w granicach, spawn tworzy kopię', () => {
  for (const [id, a] of Object.entries(ARCHETYPES)) {
    const vals = Object.values(a.resist); assert.ok(vals.some((v) => v <= 0), `${id}: brak żywiołu z odpornością <= 0`);
    assert.ok(vals.every((v) => v <= RESIST_CAP.wrog && v >= RESIST_FLOOR), `${id}: poza granicami`); assert.ok(a.maxHp > 0 && a.name);
    assert.deepEqual(Object.keys(a.resist).sort(), ['air', 'earth', 'fire', 'neutral', 'water'], `${id}: komplet żywiołów`);
  }
  const s1 = spawn('straznik', 'a', 1, 1), s2 = spawn('straznik', 'b', 2, 2); s1.resist.fire = 99; assert.equal(s2.resist.fire, -20, 'kopie niezależne'); assert.throws(() => spawn('nie_ma', 'x', 0, 0));
});

test('rzut czaru stosuje żywioł i odporność, zdarzenie niesie żywioł, surową wartość i odporność', () => {
  const s = mk([{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 99, stats: { fire: 45 } }, spawn('straznik', 'e', 5, 4, { maxHp: 500, resist: { fire: 30 } })]);
  const r = cast(s, 'zar', 5, 4, 'm'); assert.ok(r.ok); const h = r.events[0].hits[0];
  assert.equal(h.element, 'fire'); assert.equal(h.resist, 30); assert.ok(h.raw >= 17 && h.raw <= 23); assert.equal(h.dmg, Math.floor(h.raw * 0.7)); assert.equal(h.kind, 'spell');
  assert.equal(unitById(r.state, 'e').hp, 500 - h.dmg);
});

test('odkrywanie odporności: po trafieniu żywiołem znamy tę odporność wroga i tylko tę', () => {
  const s = mk([{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 99 }, spawn('straznik', 'e', 5, 4, { maxHp: 500 })]);
  assert.deepEqual(s.known, {}); const t = applyCommand(s, { type: 'cast', unit: 'm', spell: 'zar', to: { x: 5, y: 4 } }).state;
  assert.deepEqual(t.known, { e: { fire: -20 } }, 'ogień -20% odkryty, reszta nie');
  const u = applyCommand(t, { type: 'cast', unit: 'm', spell: 'zar', to: { x: 5, y: 4 } }).state; assert.deepEqual(u.known, { e: { fire: -20 } }, 'powtórzenie nic nie dodaje');
});

test('obrażenia z kolizji są stałe: nie zależą od cech ani odporności', () => {
  const mkp = (stats, resist) => mk([{ id: 'g', team: 'gracz', classId: 'grabarz', x: 2, y: 4, initiative: 99, stats }, spawn('straznik', 'e', 4, 4, { maxHp: 900, resist })], { blocked: [{ x: 6, y: 4 }] });
  const a = cast(mkp({}, {}), 'zrzut_ziemi', 4, 4, 'g'), b = cast(mkp({ earth: 200, power: 100, flat: 50 }, { earth: 75, neutral: 75, fire: 75 }), 'zrzut_ziemi', 4, 4, 'g');
  const ca = a.events.find((e) => e.type === 'pushed'), cb = b.events.find((e) => e.type === 'pushed');
  assert.equal(ca.collision, 4); assert.equal(cb.collision, 4); assert.equal(cb.hits[0].kind, 'collision'); assert.equal(cb.hits[0].element, 'neutral');
});

test('AI wybiera czar, który po odporności zadaje więcej (nie samo najwyższe obrażenia bazowe)', () => {
  const sp = (id, element, lo, hi) => ({ id, element, name: id, tags: ['damage'], desc: '', levels: Array(5).fill(0).map(() => ({ pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [lo, hi] })) });
  CLASSES.test = { id: 'test', name: 'T', role: 'T', stats: { hp: 30, hpPerLevel: 1, initiative: 1, main: 'fire' }, spells: [sp('t_ogien', 'fire', 20, 20), sp('t_woda', 'water', 15, 15)] };
  try {
    const mkb = (resist) => mk([{ id: 'a', team: 'wrog', classId: 'test', x: 3, y: 4, initiative: 10 }, { id: 'h', team: 'gracz', classId: 'grabarz', x: 4, y: 4, initiative: 1, maxHp: 99, resist }]);
    assert.equal(chooseCommand(mkb({})).spell, 't_ogien', 'bez odporności ogień 20 > woda 15');
    assert.equal(chooseCommand(mkb({ fire: 50 })).spell, 't_woda', 'ogień 10 < woda 15');
    assert.equal(chooseCommand(mkb({ fire: 50, water: 50 })).spell, 't_ogien', 'ogień 10 = woda 7, ogień lepszy');
  } finally { delete CLASSES.test; }
});

test('niezmienniki: obrażenia nigdy ujemne ani większe niż możliwe maksimum, życie zgodne ze zdarzeniami (300 losowych układów)', () => {
  const r = rng(77);
  for (let i = 0; i < 300; i++) {
    const stats = { fire: r.int(-80, 150), power: r.int(-20, 60), flat: r.int(0, 15) }, res = r.int(-150, 120);
    const s = mk([{ id: 'm', team: 'gracz', classId: 'zalobnik', x: 2, y: 4, initiative: 99, stats }, spawn('straznik', 'e', 5, 4, { maxHp: 999, resist: { fire: res } })]);
    const out = cast(s, 'zar', 5, 4, 'm'); assert.ok(out.ok); const h = out.events[0].hits[0], e = unitById(out.state, 'e');
    const [lo, hi] = damageRange(unitById(s, 'm'), ZAR, 'fire'), cap = Math.max(0, Math.min(75, res)), floor = Math.max(-100, res);
    assert.ok(h.dmg >= 0); assert.ok(h.dmg <= Math.floor(hi * (1 - Math.min(cap, floor) / 100)) + 0, `i=${i}`); assert.equal(e.hp, 999 - h.dmg);
  }
});

test('odporność wroga nie wpływa na jego własne obrażenia, a skala obrażeń (damageScale) wciąż działa', () => {
  const g = spawn('straznik', 'e', 1, 1); assert.equal(g.damageScale, 0.4);
  const d = spellData(g, 'cios_lopata').data; assert.deepEqual(damageRange(g, d, 'earth'), [6, 7], 'floor(15*0.4), floor(19*0.4)');
  assert.deepEqual(damageRange({ ...g, resist: { earth: 75 } }, d, 'earth'), [6, 7]);
});
