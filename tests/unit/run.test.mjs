import test from 'node:test';
import assert from 'node:assert/strict';
import { xpToNext, totalXpForLevel, chamberReward, addXp, levelFromXp, newRun, roomSeed, saveRun, loadRun, clearRun, xpOf } from '../../src/game/run.js';
import { newCharacter, validateCharacter, pointsLeft, MAX_LEVEL } from '../../src/game/progression.js';
import { DUNGEONS } from '../../src/game/dungeons.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const hero = () => newCharacter({ name: 'T', classId: 'zalobnik' });

test('XP: krzywa rośnie, poziom wynika z sumy XP, nadmiar przechodzi na kolejny poziom', () => {
  assert.equal(xpToNext(1), 60); assert.equal(totalXpForLevel(3), 180);
  assert.deepEqual(levelFromXp(0), { level: 1, into: 0, need: 60 }); assert.equal(levelFromXp(59).level, 1); assert.equal(levelFromXp(60).level, 2); assert.equal(levelFromXp(180).level, 3); assert.equal(levelFromXp(360).level, 4);
  assert.equal(levelFromXp(1e9).level, MAX_LEVEL);
});

test('addXp: dolicza XP, daje poziomy (nawet kilka naraz) i punkty do rozdania, zapis dalej przechodzi walidację', () => {
  const a = addXp(hero(), 40); assert.equal(a.gained, 0); assert.equal(xpOf(a.ch), 40); assert.ok(validateCharacter(a.ch));
  const b = addXp(a.ch, 140); assert.equal(b.ch.level, 3); assert.equal(b.gained, 2); assert.ok(pointsLeft(b.ch.level, b.ch.alloc) > pointsLeft(1, b.ch.alloc), 'nowe punkty cech');
  assert.ok(validateCharacter(b.ch)); assert.equal(addXp(hero(), -50).ch.xp, 0, 'ujemna nagroda nic nie odejmuje');
  assert.equal(validateCharacter({ ...hero(), xp: -1 }), false); assert.equal(validateCharacter({ ...hero(), xp: 1.5 }), false);
});

test('nagroda: rośnie z poziomem wrogów, boss daje trzy razy tyle, ponad pasmem lochu o połowę mniej', () => {
  const band = DUNGEONS.korytarze.band;
  assert.ok(chamberReward(5, 5, band) > chamberReward(2, 2, band)); assert.equal(chamberReward(3, 3, band, true), chamberReward(3, 3, band) * 3);
  assert.equal(chamberReward(6, 12, band), chamberReward(6, 6, band) / 2);
});

test('pętla: pełne podejście do lochu (komnaty, boss) daje kilka poziomów, ale nie przeskakuje całego pasma', () => {
  const d = DUNGEONS.korytarze; let ch = hero(), total = 0;
  for (let room = 1; room <= d.chambers; room++) { const el = Math.max(d.band[0], Math.min(d.band[1], ch.level)), r = chamberReward(el, ch.level, d.band, room === d.chambers); total += r; ch = addXp(ch, r).ch; }
  assert.ok(ch.level >= 3 && ch.level <= 4, `poziom po jednym lochu: ${ch.level} (XP ${total})`);
});

test('zapis podejścia: odczyt, uszkodzone dane i brak pamięci nie przewracają gry', () => {
  const st = mem(), r = newRun('korytarze', 123456); assert.equal(r.room, 1); assert.ok(r.seed >= 1 && r.seed <= 100000); assert.equal(roomSeed({ ...r, room: 3 }), r.seed * 10 + 3);
  assert.ok(saveRun(r, st)); assert.deepEqual(loadRun(st), r); st.setItem('arena.run.v1', '{zepsute'); assert.equal(loadRun(st), null); clearRun(st); assert.equal(loadRun(st), null);
  assert.equal(saveRun(r, null), false); assert.equal(loadRun(null), null);
});
