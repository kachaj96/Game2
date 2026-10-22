import test from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../src/art/rng.js';
import { CLASSES, CLASS_LIST, DEV_SPELLS, MAX_SPELL_LEVEL } from '../../src/game/classdata.js';
import * as P from '../../src/game/progression.js';
import { saveCharacter, loadCharacter, SAVE_KEY } from '../../src/game/save.js';
import { createState } from '../../src/game/state.js';
import { damageRange, spellData, elementOfSpell } from '../../src/game/spells.js';

const ch = (o = {}) => P.newCharacter({ classId: 'zalobnik', ...o });
const fakeStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };

test('punkty cech: 5 za poziom od poziomu 2 (liczby z planu)', () => {
  assert.deepEqual([1, 2, 5, 10, 15, 20].map(P.pointsAtLevel), [0, 5, 20, 45, 70, 95]); assert.equal(P.pointsAtLevel(0), 0);
});
test('koszt cech: 1 do 50, 2 do 100, 3 powyżej; sumy zgodne z planem', () => {
  assert.deepEqual([0, 49, 50, 99, 100].map(P.stepCost), [1, 1, 2, 2, 3]);
  assert.deepEqual([30, 50, 60, 80].map(P.costTo), [30, 50, 70, 110]);
  assert.equal(P.maxStat(45), 45); assert.equal(P.maxStat(95), 72, 'z 95 punktów jedna cecha maks. 72');
  for (let n = 1; n <= 150; n++) assert.ok(P.costTo(n) > P.costTo(n - 1), 'koszt ściśle rośnie');
});
test('podnoszenie i obniżanie cech: bez przekroczenia punktów, zwrot dokładnie tyle, ile kosztowało', () => {
  let a = P.emptyAlloc(); const lvl = 10;
  for (let i = 0; i < 60; i++) a = P.raise(lvl, a, 'fire'); assert.equal(a.fire, 45, 'limit 45 punktów'); assert.equal(P.pointsLeft(lvl, a), 0);
  assert.equal(P.raise(lvl, a, 'earth').earth, 0, 'brak punktów'); assert.equal(P.raise(lvl, a, 'nie_ma').nie_ma, undefined);
  const b = P.lower(a, 'fire'); assert.equal(P.pointsLeft(lvl, b), 1); assert.equal(P.lower(P.emptyAlloc(), 'fire').fire, 0, 'nie poniżej zera');
  // z poziomu 20 (95 pkt): po przekroczeniu 50 kolejny punkt kosztuje 2
  let c = P.emptyAlloc(); for (let i = 0; i < 80; i++) c = P.raise(20, c, 'air'); assert.equal(c.air, 72); assert.equal(P.spent(c), 94);
});
test('niezmienniki na 500 losowych sekwencjach: punkty nigdy ujemne, cechy nigdy ujemne, koszt = suma kroków', () => {
  const r = rng(9);
  for (let i = 0; i < 500; i++) { const lvl = r.int(1, 30); let a = P.emptyAlloc();
    for (let k = 0; k < 200; k++) { const st = r.pick(P.STATS); a = r() < 0.7 ? P.raise(lvl, a, st) : P.lower(a, st); assert.ok(P.pointsLeft(lvl, a) >= 0); assert.ok(P.STATS.every((s) => a[s] >= 0)); }
    assert.equal(P.spent(a), P.STATS.reduce((s, k) => s + P.costTo(a[k]), 0)); }
});
test('statystyki bojowe: życie z poziomu i Witalności, moce żywiołów z cech (liczby z planu)', () => {
  const base = (cls, lvl) => P.deriveStats({ ...P.newCharacter({ classId: cls, origin: 'wygnaniec' }), level: lvl }).hp;
  assert.deepEqual(['grabarz', 'tropiciel', 'zalobnik'].map((c) => base(c, 10)), [125, 91, 74], 'życie bazowe na poz. 10');
  let c = P.setLevel(ch({ origin: 'wygnaniec' }), 10); for (let i = 0; i < 22; i++) c = { ...c, alloc: P.raise(10, c.alloc, 'vitality') }; for (let i = 0; i < 23; i++) c = { ...c, alloc: P.raise(10, c.alloc, 'fire') };
  const d = P.deriveStats(c); assert.equal(d.hp, 96, '74 + 22 Witalności'); assert.equal(d.fire, 23);
  const u = P.unitFromCharacter(c); assert.deepEqual(damageRange(u, spellData(u, 'zar').data, 'fire'), [14, 19], 'Żar po 23 pkt Ognia (tabela z planu)');
  let c45 = P.setLevel(ch({ origin: 'wygnaniec' }), 10); for (let i = 0; i < 45; i++) c45 = { ...c45, alloc: P.raise(10, c45.alloc, 'fire') };
  const u45 = P.unitFromCharacter(c45); assert.deepEqual(damageRange(u45, spellData(u45, 'zar').data, 'fire'), [17, 23]); assert.equal(u45.maxHp, 74);
});
test('przeszłość i cechy sumują się z punktami cech', () => {
  let c = P.setLevel(ch({ origin: 'syn_kopca', traits: ['twardy', 'zawzięty'] }), 5); c = { ...c, alloc: P.raise(5, P.raise(5, P.emptyAlloc(), 'earth'), 'earth') };
  const d = P.deriveStats(c); assert.equal(d.earth, 4 + 2); assert.equal(d.hp, 38 + 8 + 6 - 4 + 4 * 4);
});
test('punkty czarów: 1 za poziom od 2, czar 1 -> 5 kosztuje 10, nie przekroczysz poziomu ani puli, przeszłość Uczeń daje +1', () => {
  let c = P.setLevel(ch({ origin: 'wygnaniec' }), 11); assert.equal(P.spellPointsTotal(c), 10);
  for (let i = 0; i < 10; i++) c = P.upgradeSpell(c, 'zar'); assert.equal(c.spellLevels.zar, 5); assert.equal(P.spellPointsLeft(c), 0); assert.equal(P.upgradeSpell(c, 'podmuch'), c, 'brak punktów');
  assert.equal(P.upgradeSpell(c, 'nie_ma'), c); const d = P.downgradeSpell(c, 'zar'); assert.equal(d.spellLevels.zar, 4); assert.equal(P.spellPointsLeft(d), 4, 'zwrot kosztu ostatniego poziomu');
  assert.equal(P.spellPointsTotal(ch({ origin: 'uczen' })), 1);
  assert.equal(P.upgradeSpell(P.setLevel(ch(), 30), 'zar').spellLevels.zar, 2);
});
test('wyższy poziom czaru realnie zmienia obrażenia w walce', () => {
  let c = P.setLevel(ch(), 30); for (let i = 0; i < 4; i++) c = P.upgradeSpell(c, 'zar');
  const u = P.unitFromCharacter(c); assert.equal(u.spells.find((s) => s.id === 'zar').level, 5); assert.deepEqual(damageRange(u, spellData(u, 'zar').data, 'fire'), [21, 26]);
});
test('zmiana poziomu w dół zwraca punkty (reset cech i czarów), gdy przekraczają limit', () => {
  let c = P.setLevel(ch(), 10); c = { ...c, alloc: P.raise(10, c.alloc, 'fire') }; c = P.upgradeSpell(c, 'zar');
  const same = P.setLevel(c, 10); assert.equal(same.alloc.fire, 1); const lower = P.setLevel(c, 1); assert.deepEqual(lower.alloc, P.emptyAlloc()); assert.equal(lower.spellLevels.zar, 1);
  assert.equal(P.setLevel(c, 999).level, P.MAX_LEVEL); assert.equal(P.setLevel(c, -5).level, 1);
});
test('wyposażenie: nie zdejmiesz ostatniego czaru, nie założysz obcego, limit 24, czary testowe tylko na życzenie', () => {
  let c = ch(); assert.deepEqual(c.equipped, ['zar', 'podmuch', 'stos']);
  c = P.toggleEquipped(c, 'stos'); assert.deepEqual(c.equipped, ['zar', 'podmuch']); c = P.toggleEquipped(P.toggleEquipped(c, 'zar'), 'podmuch'); assert.equal(c.equipped.length, 1, 'ostatni zostaje');
  assert.equal(P.toggleEquipped(c, 'obcy'), c);
  let d = ch(); for (const s of DEV_SPELLS) d = P.toggleEquipped(P.learnSpell(d, s.id), s.id); assert.equal(d.equipped.length, 8);
  assert.equal(P.unitFromCharacter(d).spells.length, 3, 'testowe pominięte'); assert.equal(P.unitFromCharacter(d, {}, { allowDev: true }).spells.length, 8);
  assert.equal(P.learnSpell(d, 'nie_ma'), d);
});
test('walidacja i zapis: pełny obieg, uszkodzone lub zmanipulowane zapisy są odrzucane bez wyjątku', () => {
  const st = fakeStore(); let c = P.setLevel(ch({ name: 'Wiera', traits: ['twardy'] }), 12); c = { ...c, alloc: P.raise(12, c.alloc, 'fire') };
  assert.equal(P.validateCharacter(c), true); assert.equal(saveCharacter(c, st), true); assert.deepEqual(loadCharacter(st), c);
  assert.equal(loadCharacter(fakeStore()), null, 'brak zapisu');
  const bad = (mut) => { const x = structuredClone(c); mut(x); return x; };
  for (const [n, m] of [['klasa', (x) => { x.classId = 'nie_ma'; }], ['poziom', (x) => { x.level = 99; }], ['nadmiar punktów', (x) => { x.alloc.fire = 200; }], ['ujemne', (x) => { x.alloc.earth = -1; }],
    ['ułamek', (x) => { x.alloc.air = 1.5; }], ['obcy czar', (x) => { x.spellLevels.dziwny = 1; }], ['poziom czaru', (x) => { x.spellLevels.zar = 9; }], ['nadmiar punktów czarów', (x) => { x.spellLevels.zar = 5; x.spellLevels.podmuch = 5; x.spellLevels.stos = 5; }],
    ['pusty ekwipunek', (x) => { x.equipped = []; }], ['duplikaty', (x) => { x.equipped = ['zar', 'zar']; }], ['obca przeszłość', (x) => { x.origin = 'x'; }], ['trzy cechy', (x) => { x.traits = ['twardy', 'szybki', 'cichy']; }], ['wersja', (x) => { x.v = 2; }], ['długie imię', (x) => { x.name = 'x'.repeat(30); }]]) {
    assert.equal(P.validateCharacter(bad(m)), false, n); assert.equal(saveCharacter(bad(m), fakeStore()), false, `zapis odrzucony: ${n}`);
  }
  for (const junk of ['{', 'null', '[]', '"x"', '{"v":1}', '12']) { const s2 = fakeStore(); s2.setItem(SAVE_KEY, junk); assert.equal(loadCharacter(s2), null, junk); }
  assert.equal(saveCharacter(c, { setItem() { throw new Error('pełny'); } }), false, 'błąd zapisu nie przewraca gry'); assert.equal(loadCharacter({ getItem() { throw new Error('x'); } }), null); assert.equal(loadCharacter(null), null);
  assert.equal(P.validateCharacter(null), false); assert.equal(P.validateCharacter('x'), false);
});
test('postać z zapisu da się wystawić do walki: createState przyjmuje jednostkę z poprawnymi statystykami', () => {
  let c = P.setLevel(ch({ origin: 'straznik', traits: ['ostrożny'] }), 8); c = { ...c, alloc: P.raise(8, c.alloc, 'fire') };
  const s = createState({ cols: 5, rows: 5, units: [P.unitFromCharacter(c, { x: 1, y: 1 }), { id: 'e', team: 'wrog', classId: 'grabarz', x: 3, y: 3 }] });
  const h = s.units.find((u) => u.id === 'h'); assert.equal(h.maxHp, P.deriveStats(c).hp); assert.equal(h.hp, h.maxHp); assert.equal(h.stats.fire, 1);
  assert.deepEqual(h.resist, { earth: 10, fire: 10, water: 10, air: 10, neutral: 0 }, 'przeszłość Strażnik +5% i cecha Ostrożny +5%');
  assert.equal(h.stats.earth, -4, 'skaza cechy Ostrożny'); assert.deepEqual(h.spells.map((x) => x.id), ['zar', 'podmuch', 'stos']);
});
