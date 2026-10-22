import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, CLASSES, CLASS_LIST, MAX_SPELL_LEVEL, spellAt, spellUpgradeCost } from '../../src/game/classdata.js';
import { heroSpec, randomHeroOpts, randomName, CLASS_IDS, CLASS_LOOKS, FACES, HAIR_STYLES, SWATCHES, SKIN_TONES } from '../../src/art/classes.js';
import { drawCharacter, DIRS } from '../../src/art/characters.js';
import { mockCtx } from './mockctx.mjs';

const avg = (d) => (d[0] + d[1]) / 2;
const mainDmgPerPa = (c) => { const sp = c.spells.find((s) => s.tags.includes('damage')), l = sp.levels[0]; return avg(l.dmg) / l.pa; };

test('klasy: trzy klasy startowe, każda z 3 czarami po 5 poziomów, wszystkie startują z 6 PA i 3 PM', () => {
  assert.deepEqual(BASE, { pa: 6, pm: 3 });
  assert.equal(CLASS_LIST.length, 3);
  for (const [key, c] of Object.entries(CLASSES)) {
    assert.equal(c.id, key);
    assert.equal(c.spells.length, 3, `${c.name}: 3 czary`);
    for (const sp of c.spells) assert.equal(sp.levels.length, MAX_SPELL_LEVEL, `${sp.name}: 5 poziomów`);
  }
});

test('czary: wartości są sensowne na każdym poziomie', () => {
  for (const c of CLASS_LIST) for (const sp of c.spells) for (const [i, l] of sp.levels.entries()) {
    const w = `${c.name}/${sp.name}/L${i + 1}`;
    assert.ok(Number.isInteger(l.pa) && l.pa >= 1 && l.pa <= BASE.pa, `${w}: koszt PA`);
    assert.ok(l.min >= 0 && l.max >= l.min, `${w}: zasięg`);
    assert.ok(Number.isInteger(l.cd) && l.cd >= 0 && Number.isInteger(l.perTurn) && l.perTurn >= 1, `${w}: odnowienie i limit`);
    const d = l.dmg || l.trap?.dmg || l.glyph?.dmg; if (d) assert.ok(d[0] > 0 && d[1] >= d[0], `${w}: obrażenia`);
  }
});

test('czary: kolejne poziomy nigdy nie są gorsze (mocniejsze, tańsze lub z krótszym odnowieniem)', () => {
  for (const c of CLASS_LIST) for (const sp of c.spells) for (let i = 1; i < sp.levels.length; i++) {
    const a = sp.levels[i - 1], b = sp.levels[i], w = `${c.name}/${sp.name}/L${i}->L${i + 1}`;
    assert.ok(b.pa <= a.pa, `${w}: koszt nie rośnie`); assert.ok(b.cd <= a.cd, `${w}: odnowienie nie rośnie`); assert.ok(b.max >= a.max, `${w}: zasięg nie maleje`);
    const da = a.dmg || a.trap?.dmg || a.glyph?.dmg, db = b.dmg || b.trap?.dmg || b.glyph?.dmg;
    if (da) assert.ok(avg(db) >= avg(da), `${w}: obrażenia nie maleją`);
    assert.ok(JSON.stringify(a) !== JSON.stringify(b), `${w}: poziom musi coś zmieniać`);
  }
});

test('wszystkie cztery wybrane mechaniki są w grze: odpychanie, linia widzenia, pułapki/glify, odnowienia', () => {
  const all = CLASS_LIST.flatMap((c) => c.spells.flatMap((s) => s.levels));
  assert.ok(all.some((l) => l.push), 'odpychanie'); assert.ok(all.some((l) => l.los), 'linia widzenia'); assert.ok(all.some((l) => l.cloud), 'chmura zasłaniająca widok');
  assert.ok(all.some((l) => l.trap), 'pułapki'); assert.ok(all.some((l) => l.glyph), 'glify'); assert.ok(all.some((l) => l.cd > 0), 'odnowienia');
  for (const c of CLASS_LIST) { const tags = new Set(c.spells.flatMap((s) => s.tags)); assert.ok(tags.size >= 3, `${c.name}: różnorodne czary`); }
});

test('każda klasa może w pierwszej turze zadać obrażenia dwa razy (2 x 3 PA = 6 PA)', () => {
  for (const c of CLASS_LIST) { const sp = c.spells.find((s) => s.tags.includes('damage')).levels[0]; assert.ok(sp.pa * sp.perTurn <= BASE.pa && sp.perTurn >= 2, `${c.name}: ${sp.pa} PA x ${sp.perTurn}`); }
});

test('balans startowy: główny atak klas nie różni się o więcej niż 1,5 raza na PA', () => {
  const v = CLASS_LIST.map(mainDmgPerPa), ratio = Math.max(...v) / Math.min(...v);
  assert.ok(ratio <= 1.5, `stosunek ${ratio.toFixed(2)}: ${CLASS_LIST.map((c, i) => `${c.name} ${v[i].toFixed(1)}`).join(', ')}`);
});

test('koszt pełnego rozwoju: czar z poziomu 1 na 5 kosztuje 10 punktów, trzy czary 30', () => {
  let one = 0; for (let l = 1; l < MAX_SPELL_LEVEL; l++) one += spellUpgradeCost(l);
  assert.equal(one, 10); assert.equal(one * 3, 30);
  assert.equal(spellAt('grabarz', 'cios_lopata', 1).pa, 3); assert.equal(spellAt('grabarz', 'nie_ma', 1), null); assert.equal(spellAt('xx', 'a', 1), undefined ?? null);
});

test('wygląd klas: trzy różne sylwetki (czapka, broń, ruch), nie tylko kolor', () => {
  const sp = CLASS_IDS.map((id) => heroSpec(id));
  assert.equal(new Set(sp.map((s) => s.hat.kind)).size, 3); assert.equal(new Set(sp.map((s) => s.held)).size, 3); assert.equal(new Set(sp.map((s) => s.move)).size, 3);
  assert.deepEqual(sp.map((s) => s.role), ['warrior', 'ranger', 'mage']);
});

test('kreator: opcje trafiają do specyfikacji, deterministycznie', () => {
  const o = { female: true, skin: SKIN_TONES[4], hair: '#a8381e', hairStyle: 'braids', face: 5, colors: ['#111111', '#222222', '#333333'], seed: 9 };
  for (const id of CLASS_IDS) {
    const s = heroSpec(id, o);
    assert.equal(s.female, true); assert.equal(s.skin, SKIN_TONES[4]); assert.equal(s.hairStyle, 'braids'); assert.equal(s.outfit.base, '#111111'); assert.equal(s.face.scar, true);
    assert.equal(JSON.stringify(s), JSON.stringify(heroSpec(id, o)));
  }
  assert.throws(() => heroSpec('nie_ma'));
  assert.notEqual(JSON.stringify(heroSpec('mage' in CLASS_LOOKS ? 'grabarz' : 'grabarz', { face: 0 })), JSON.stringify(heroSpec('grabarz', { face: 4 })));
});

test('losowanie bohatera i imienia: deterministyczne i zróżnicowane', () => {
  assert.equal(JSON.stringify(randomHeroOpts(4)), JSON.stringify(randomHeroOpts(4)));
  assert.ok(new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(randomHeroOpts(i)))).size >= 29);
  const names = new Set(Array.from({ length: 40 }, (_, i) => randomName(i))); assert.ok(names.size >= 20); for (const n of names) assert.ok(n.length >= 3);
});

test('rysowanie: każda klasa x płeć x twarz x fryzura x kierunek x klatka chodu bez złych liczb', () => {
  for (const id of CLASS_IDS) for (const female of [false, true]) for (const face of [0, 4, 7]) for (const hairStyle of HAIR_STYLES) for (const d of Object.values(DIRS)) for (const t of [undefined, 0.1, 0.6]) {
    const g = mockCtx(); drawCharacter(g, 100, 100, heroSpec(id, { female, face, hairStyle, colors: [SWATCHES[face], SWATCHES[3], SWATCHES[11]], beard: !female && face === 4 ? 'full' : null }), { ...d, t });
    assert.ok(g.__state.calls > 60); assert.deepEqual(g.__state.bad, [], `${id} ${female} ${face} ${hairStyle}`);
  }
});

import { ORIGINS, TRAITS, MAX_TRAITS, startStats } from '../../src/game/classdata.js';
test('przeszłości i cechy: 4 przeszłości, 6 cech, każda cecha to plus i skaza', () => {
  assert.equal(ORIGINS.length, 4); assert.equal(TRAITS.length, 6);
  for (const o of ORIGINS) { assert.ok(o.name && o.story && o.bonusText && Object.keys(o.bonus).length === 1); }
  for (const t of TRAITS) { const p = Object.values(t.plus), m = Object.values(t.minus); assert.ok(p.every((v) => v > 0) && m.every((v) => v < 0), `${t.name}: plus i skaza`); }
  assert.equal(new Set([...ORIGINS, ...TRAITS].map((x) => x.id)).size, ORIGINS.length + TRAITS.length, 'unikalne id');
});
test('startStats: PA i PM zawsze 6 i 3, przeszłość i cechy się sumują, nadmiarowe cechy są ignorowane', () => {
  const s = startStats('grabarz', 'syn_kopca', ['twardy', 'zawzięty']);
  assert.equal(s.pa, 6); assert.equal(s.pm, 3);
  assert.equal(s.hp, 62 + 8 + 6 - 4); assert.equal(s.initiative, 15 - 3); assert.equal(s.earth, 4); assert.equal(s.fire, 0);
  assert.deepEqual(startStats('grabarz', 'syn_kopca', ['twardy', 'zawzięty', 'cichy']), s, 'trzecia cecha ignorowana');
  assert.equal(startStats('zalobnik', 'uczen').spellPoints, 1);
  const o = startStats('tropiciel', 'straznik', ['ostrożny']); assert.deepEqual(o.resist, { earth: 10, fire: 10, water: 10, air: 10, neutral: 0 }); assert.equal(o.earth, -4);
  assert.equal(startStats('tropiciel', 'wygnaniec', ['cichy']).air, 4); assert.equal(startStats('tropiciel', 'wygnaniec', ['cichy']).fire, -4);
  for (const c of CLASS_LIST) for (const o2 of ORIGINS) for (const t of TRAITS) assert.ok(startStats(c.id, o2.id, [t.id]).hp > 20, 'żadna kombinacja nie robi bohatera nieżywym');
});


import { ELEMENTS, DEV_SPELLS } from '../../src/game/classdata.js';
import { SPELL_SYMBOLS, drawSpellIcon } from '../../src/art/spellicons.js';
test('żywioły: każdy czar ma znany żywioł, kolory i kształty ramek są unikalne, przewodni żywioł klasy zgadza się z planem', () => {
  assert.deepEqual(Object.keys(ELEMENTS), ['earth', 'fire', 'water', 'air', 'neutral']);
  assert.equal(new Set(Object.values(ELEMENTS).map((e) => e.color)).size, 5); assert.equal(new Set(Object.values(ELEMENTS).map((e) => e.shape)).size, 5, 'kształt ramki odróżnia żywioły bez koloru');
  for (const c of CLASS_LIST) for (const sp of c.spells) assert.ok(ELEMENTS[sp.element], `${c.name}/${sp.name}: brak żywiołu`);
  const lead = { grabarz: 'earth', tropiciel: 'air', zalobnik: 'fire' };
  for (const c of CLASS_LIST) { const n = c.spells.filter((s) => s.element === lead[c.id]).length; assert.ok(n >= 1 && n >= c.spells.filter((s) => s.element !== lead[c.id]).length - 1, `${c.name}: przewodni żywioł dominuje`); }
  assert.ok(!CLASS_LIST.flatMap((c) => c.spells).some((s) => s.element === 'water'), 'woda tylko z czarów zdobywanych (plan)');
});
test('ikony: każdy czar ma własny symbol, każdy stan rysuje się bez złych liczb', () => {
  const ids = [...CLASS_LIST.flatMap((c) => c.spells.map((s) => s.id)), ...DEV_SPELLS.map((s) => s.id)]; assert.deepEqual([...SPELL_SYMBOLS].sort(), [...ids].sort(), 'symbol dla każdego czaru i żaden zbędny');
  for (const sp of [...CLASS_LIST.flatMap((c) => c.spells), ...DEV_SPELLS]) for (const size of [40, 56, 96]) for (const st of [{}, { selected: true }, { disabled: true, noPa: true }, { cooldown: 3 }, { soon: true }]) {
    const g = mockCtx(); drawSpellIcon(g, { ...sp, pa: sp.levels[0].pa }, 50, 50, size, st); assert.ok(g.__state.calls > 10); assert.deepEqual(g.__state.bad, [], `${sp.id} ${size}`);
  }
  const g = mockCtx(); drawSpellIcon(g, { id: 'nieznany', element: 'water' }, 0, 0); assert.deepEqual(g.__state.bad, [], 'nieznany czar rysuje się zastępczym symbolem');
});

test('czary testowe (dev): pełne dane, poprawne poziomy, wszystkie żywioły poza neutralnym, w tym woda', () => {
  assert.equal(DEV_SPELLS.length, 5); assert.ok(DEV_SPELLS.some((s) => s.element === 'water'));
  for (const sp of DEV_SPELLS) { assert.ok(sp.dev && sp.name && ELEMENTS[sp.element] && sp.levels.length === 5, sp.id);
    for (let i = 1; i < 5; i++) { const a = sp.levels[i - 1], b = sp.levels[i]; assert.ok(b.pa <= a.pa && b.cd <= a.cd && b.max >= a.max, `${sp.id} L${i + 1}`); assert.ok((b.dmg[0] + b.dmg[1]) > (a.dmg[0] + a.dmg[1]), `${sp.id}: obrażenia rosną`); } }
});
