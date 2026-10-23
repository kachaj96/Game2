import test from 'node:test';
import assert from 'node:assert/strict';
import { DUNGEONS, DUNGEON_IDS, dungeonLevel, levelAdvice } from '../../src/game/dungeons.js';
import { THEMES } from '../../src/art/theme.js';

test('lochy: kształt danych, pasmo zawiera zalecany poziom, motyw istnieje', () => {
  assert.deepEqual(DUNGEON_IDS, ['korytarze', 'gniazdo', 'arena']);
  for (const d of Object.values(DUNGEONS)) {
    for (const k of ['id', 'name', 'family', 'rec', 'band', 'theme', 'maxCompanions', 'entranceKind']) assert.ok(d[k] !== undefined, `${d.id}.${k}`);
    assert.ok(d.band[0] <= d.rec && d.rec <= d.band[1], `${d.id}: pasmo zawiera zalecany poziom`);
    assert.ok(THEMES[d.theme], `${d.id}: motyw ${d.theme}`);
  }
  assert.deepEqual([DUNGEONS.korytarze.rec, DUNGEONS.gniazdo.rec, DUNGEONS.arena.rec], [3, 8, 28]);
});
test('dungeonLevel przycina poziom bohatera do pasma', () => {
  const b = DUNGEONS.korytarze.band;
  assert.equal(dungeonLevel(1, b), 2); assert.equal(dungeonLevel(4, b), 4); assert.equal(dungeonLevel(30, b), 6);
});
test('ostrzeżenie o poziomie jest tylko tekstem i zawsze wymienia zalecany poziom', () => {
  for (const lv of [1, 3, 20]) assert.match(levelAdvice(lv, DUNGEONS.korytarze), /Zalecany poziom 3/);
  assert.match(levelAdvice(1, DUNGEONS.korytarze), /silniejsi/); assert.match(levelAdvice(20, DUNGEONS.korytarze), /słabsi/);
});
