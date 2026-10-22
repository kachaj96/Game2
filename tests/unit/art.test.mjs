import test from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../../src/art/rng.js';
import { genBuilding, drawBuilding, KINDS } from '../../src/art/buildings.js';
import { genCharacter, drawCharacter, ROLES, DIRS } from '../../src/art/characters.js';
import * as N from '../../src/art/nature.js';
import { PROPS } from '../../src/art/props.js';
import { applyMood, glow, MOODS } from '../../src/art/mood.js';
import { mockCtx } from './mockctx.mjs';

const sig = (o) => JSON.stringify(o);
const distinct = (arr) => new Set(arr.map(sig)).size;
const clean = (g, what) => assert.deepEqual(g.__state.bad, [], `${what}: złe liczby w argumentach rysowania`);

test('rng: to samo ziarno daje ten sam ciąg, inne ziarno inny', () => {
  const a = rng(5), b = rng(5), c = rng(6);
  const A = [a(), a(), a()], B = [b(), b(), b()], C = [c(), c(), c()];
  assert.deepEqual(A, B);
  assert.notDeepEqual(A, C);
});

test('budynki: generator jest deterministyczny i daje różnorodność', () => {
  for (let s = 1; s <= 20; s++) assert.equal(sig(genBuilding(s)), sig(genBuilding(s)));
  const specs = Array.from({ length: 60 }, (_, i) => genBuilding(i + 1));
  assert.ok(distinct(specs) >= 58, 'prawie każde ziarno to inny budynek');
  assert.ok(new Set(specs.map((s) => s.kind)).size === KINDS.length, 'wszystkie rodzaje się pojawiają');
  assert.ok(new Set(specs.map((s) => s.material)).size >= 3, 'różne materiały ścian');
  assert.ok(new Set(specs.map((s) => s.roofCol)).size >= 5, 'różne kolory dachów');
  for (const s of specs) { assert.ok(s.w > 0 && s.d > 0 && s.floors >= 1 && s.fh > 0 && s.roofH > 0); }
});

test('budynki: każdy rodzaj i 40 ziaren rysuje się bez błędów', () => {
  for (const kind of KINDS) for (let s = 1; s <= 7; s++) {
    const g = mockCtx(); drawBuilding(g, 200, 300, genBuilding(s * 11, kind));
    assert.ok(g.__state.calls > 100, `${kind}: coś narysowano`); clean(g, `${kind}#${s}`);
  }
});

test('postacie: generator jest deterministyczny i daje różnorodność', () => {
  for (let s = 1; s <= 20; s++) assert.equal(sig(genCharacter(s)), sig(genCharacter(s)));
  const specs = Array.from({ length: 60 }, (_, i) => genCharacter(i + 1));
  assert.ok(distinct(specs) >= 58);
  assert.equal(new Set(specs.map((s) => s.role)).size, ROLES.length, 'wszystkie role się pojawiają');
  assert.ok(new Set(specs.map((s) => s.hairStyle)).size >= 5, 'różne fryzury');
  assert.ok(new Set(specs.map((s) => s.skin)).size >= 4, 'różne karnacje');
  for (const r of ROLES) assert.equal(genCharacter(3, r).role, r);
});

test('postacie: każda rola, 4 kierunki i klatki chodu rysują się bez błędów', () => {
  for (const role of ROLES) for (let s = 1; s <= 5; s++) for (const d of Object.values(DIRS)) for (const t of [undefined, 0, 0.25, 0.5, 0.75]) {
    const g = mockCtx(); drawCharacter(g, 100, 100, genCharacter(s * 9, role), { ...d, t, ring: s % 2 ? 'rgb(60,120,255)' : undefined });
    assert.ok(g.__state.calls > 50); clean(g, `${role}#${s}`);
  }
});

test('przyroda i rekwizyty rysują się bez błędów dla wielu ziaren', () => {
  const nat = ['oak', 'pine', 'birch', 'deadTree', 'bush', 'rock', 'flowers', 'mushrooms', 'stump', 'reeds'];
  for (const name of nat) for (let s = 1; s <= 15; s++) for (const biome of Object.keys(N.BIOMES)) {
    const g = mockCtx(); N[name](g, 100, 100, s, { biome }); assert.ok(g.__state.calls > 3); clean(g, `${name}#${s}/${biome}`);
  }
  for (const [name, fn] of Object.entries(PROPS)) { const g = mockCtx(); fn(g, 50, 50, 1, 3); clean(g, name); }
  const g = mockCtx(); N.pond(g, 100, 100, 80, 20, 2); N.ground(g, 300, 200, 1); N.tufts(g, 300, 200, 1, 50); N.road(g, [[0, 0], [50, 0], [50, 20], [0, 20]], 1); clean(g, 'teren');
});

test('drzewa tego samego gatunku z różnych ziaren nie są kopiami', () => {
  const rec = (seed) => { const g = mockCtx(); const log = []; const orig = g.arc; const p = new Proxy(g, { get(t, k) { if (k === 'arc') return (...a) => log.push(a.map((v) => Math.round(v))); return t[k]; }, set(t, k, v) { t[k] = v; return true; } }); N.oak(p, 100, 100, seed); return log; };
  const sigs = new Set(Array.from({ length: 12 }, (_, i) => sig(rec(i + 1))));
  assert.ok(sigs.size >= 11);
});

test('nastrój: każdy preset i poświata rysują się bez złych liczb', () => {
  for (const name of Object.keys(MOODS)) { const g = mockCtx(); applyMood(g, 400, 300, name); glow(g, 50, 60, 40); assert.ok(g.__state.calls > 0); clean(g, name); }
  const g = mockCtx(); applyMood(g, 100, 100, 'nieistniejacy'); clean(g, 'nieznany preset wraca do dnia');
});
