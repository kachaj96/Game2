import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { ASSETS, assetDim } from '../../src/art/assets.js';

test('obrazy: każdy wpis ma plik PNG o proporcjach zgodnych z rozmiarem w świecie, a światła leżą w obrazie', () => {
  for (const [k, a] of Object.entries(ASSETS)) {
    const f = new URL(`../../www/${a.src}`, import.meta.url); assert.ok(existsSync(f), `${k}: brak pliku`);
    const b = readFileSync(f); assert.equal(b.toString('latin1', 1, 4), 'PNG'); const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    assert.ok(Math.abs(w / h - a.w / a.h) < 0.02, `${k}: proporcje ${w}x${h} a ${a.w}x${a.h}`); assert.ok(b.length < 1.2e6, `${k}: plik za duży`);
    for (const [x, y] of a.lights || []) assert.ok(x > 0 && x < 1 && y > 0 && y < 1);
    const d = assetDim(k); assert.ok(d[2] * 2 >= a.w && d[3] >= a.h);
  }
});
