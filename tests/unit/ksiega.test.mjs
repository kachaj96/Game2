import test from 'node:test';
import assert from 'node:assert/strict';
import { KSIEGA, ksiegaView, ksiegaComplete } from '../../src/game/ksiega.js';
import { ENEMIES } from '../../src/game/enemies.js';
import { genKopacz, drawKopacz, KOPACZE, BOSSOWIE } from '../../src/art/creatures.js';
import { mockCtx } from './mockctx.mjs';

test('Księga Wrogów: każdy wróg ma wpis z rysunkiem, warunkiem odkrycia i wskazówką (bez wpisu CI nie przejdzie)', () => {
  assert.ok(ksiegaComplete());
  for (const k of Object.keys(ENEMIES)) {
    const e = KSIEGA[k]; assert.ok(e, `brak wpisu: ${k}`); assert.equal(e.name, ENEMIES[k].name, `${k}: nazwa zgodna z grą`);
    assert.ok(e.hint.length > 10 && e.tip.length > 10 && e.unlock && e.more.length >= 1);
    assert.ok([...KOPACZE, ...BOSSOWIE].includes(e.art.kind), `${k}: znany rysunek`); const g = mockCtx(); drawKopacz(g, 50, 50, genKopacz(e.art.seed, e.art.kind), { view: 'front' }); assert.deepEqual(g.__state.bad, []); assert.ok(g.__state.calls > 40);
  }
  assert.equal(Object.keys(KSIEGA).length, Object.keys(ENEMIES).length, 'bez wpisów-sierot');
});
test('Księga Wrogów: teksty nie zdradzają fabuły (brama, pieczęć, arena)', () => {
  const all = Object.values(KSIEGA).flatMap((e) => [e.hint, e.tip, ...e.more.map((m) => m.text)]).join(' ').toLowerCase();
  for (const w of ['brama', 'bramy', 'pieczęć', 'zapieczęt', 'arena', 'areny', 'pogrzebana']) assert.ok(!all.includes(w), `zdradza: ${w}`);
});
test('Księga Wrogów: warstwy odkrywają się po warunku, odporności tylko te odkryte w walce', () => {
  const unseen = ksiegaView('zerca'); assert.equal(unseen.name, '???'); assert.equal(unseen.art, null); assert.equal(unseen.tip, null); assert.deepEqual(unseen.more, []); assert.ok(unseen.hint);
  const seen = ksiegaView('zerca', { seen: true, known: { water: 25 } }); assert.equal(seen.name, 'Żerca'); assert.ok(seen.tip); assert.deepEqual(seen.more, []);
  assert.deepEqual(seen.resist.find((r) => r.element === 'water'), { element: 'water', value: 25 }); assert.equal(seen.resist.find((r) => r.element === 'fire').value, null, 'nieodkryte zostają ukryte');
  assert.equal(ksiegaView('zerca', { defeated: true }).more.length, 1); assert.equal(ksiegaView('nie_ma'), null);
});
test('Król Kopców: rysowany w 4 kierunkach, większy od Pancernego, z koroną', () => {
  for (let s = 1; s <= 6; s++) { const sp = genKopacz(s, 'krol'); assert.equal(sp.kind, 'krol'); assert.ok(sp.crown >= 5 && sp.plates); for (const d of [{ view: 'front' }, { view: 'back' }, { view: 'front', mirror: true }]) { const g = mockCtx(); drawKopacz(g, 80, 90, sp, { ...d, t: 0.3 }); assert.deepEqual(g.__state.bad, []); } }
  const avg = (k) => Array.from({ length: 20 }, (_, i) => genKopacz(i + 1, k)).reduce((a, s) => a + s.sc * s.bw, 0) / 20; assert.ok(avg('krol') > avg('pancerny') * 1.2);
  assert.equal(new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(genKopacz(i + 1, 'krol')))).size, 20);
});
