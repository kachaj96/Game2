import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, QUALITY, QUALITY_IDS, loadSettings, saveSettings, validSettings, SETTINGS_KEY } from '../../src/game/settings.js';
import { darkness, drawNight, DAY_LENGTH } from '../../src/art/daylight.js';
import { mockCtx } from './mockctx.mjs';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('ustawienia: domyślne, zapis i odczyt, uszkodzone dane wracają do domyślnych', () => {
  const st = mem(); assert.deepEqual(loadSettings(st), DEFAULTS);
  assert.ok(saveSettings({ quality: 'low', time: 'night', fps: true }, st)); assert.deepEqual(loadSettings(st), { quality: 'low', time: 'night', fps: true });
  st.setItem(SETTINGS_KEY, '{"quality":"ultra"}'); assert.deepEqual(loadSettings(st), DEFAULTS); st.setItem(SETTINGS_KEY, 'zle'); assert.deepEqual(loadSettings(st), DEFAULTS);
  assert.equal(saveSettings({ quality: 'x', time: 'day', fps: false }, st), false); assert.equal(saveSettings(DEFAULTS, null), false); assert.equal(validSettings(DEFAULTS), true);
});

test('jakość: każdy preset ma komplet pól, wyższa jakość nie jest tańsza od niższej', () => {
  for (const id of QUALITY_IDS) { const q = QUALITY[id]; for (const k of ['name', 'dprMax', 'shadowRes', 'decals', 'beams', 'water', 'smoke']) assert.notEqual(q[k], undefined, `${id}.${k}`); }
  assert.ok(QUALITY.low.dprMax <= QUALITY.medium.dprMax && QUALITY.medium.dprMax <= QUALITY.high.dprMax); assert.ok(QUALITY.low.shadowRes <= QUALITY.high.shadowRes);
});

test('pora dnia: tryby stałe, cykl przechodzi dzień, noc i świt, noc jest naprawdę ciemna', () => {
  assert.equal(darkness(123, 'day'), 0); assert.equal(darkness(123, 'night'), 1);
  assert.equal(darkness(0), 0); assert.equal(darkness(DAY_LENGTH * 0.3), 0); assert.ok(darkness(DAY_LENGTH * 0.56) > 0 && darkness(DAY_LENGTH * 0.56) < 1, 'zmierzch');
  assert.equal(darkness(DAY_LENGTH * 0.75), 1); assert.ok(darkness(DAY_LENGTH * 0.95) < 1 && darkness(DAY_LENGTH * 0.95) > 0, 'świt'); assert.equal(darkness(DAY_LENGTH * 1.3), darkness(DAY_LENGTH * 0.3), 'doba się powtarza');
});

test('noc: warstwa rysuje się bez złych liczb, w dzień nic nie rysuje', () => {
  const night = mockCtx(); night.width = 860; night.height = 340; night.getContext = () => night;
  const g = mockCtx(); drawNight(g, night, 0, { x: 400, y: 200, angle: 0.5 }, [], 1); assert.equal(g.__state.calls, 0);
  drawNight(g, night, 1, { x: 400, y: 200, angle: 0.5 }, [{ x: 100, y: 100, r: 150, a: 0.8 }], 1.4); assert.ok(g.__state.calls > 5); assert.deepEqual(g.__state.bad, []); assert.deepEqual(night.__state.bad, []);
});
