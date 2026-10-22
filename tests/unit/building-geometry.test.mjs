import test from 'node:test';
import assert from 'node:assert/strict';
import { genBuilding, buildingGeometry, footprintCells, OVERHANG, KINDS } from '../../src/art/buildings.js';
import { IsoGrid } from '../../src/grid.js';

const specs = Array.from({ length: 120 }, (_, i) => genBuilding(i + 1));
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

test('budynek stoi na pełnych kaflach: wymiary podstawy są całkowite', () => {
  for (const s of specs) { assert.ok(Number.isInteger(s.w) && Number.isInteger(s.d), `${s.kind}#${s.seed}: ${s.w}x${s.d}`); assert.ok(s.w >= 1 && s.d >= 1 && s.w <= 4 && s.d <= 4); }
});

test('footprintCells: liczba komórek to w*d i leżą tuż przed rogiem S', () => {
  for (const s of specs.slice(0, 40)) {
    const cells = footprintCells(s, 10, 12);
    assert.equal(cells.length, s.w * s.d);
    assert.equal(new Set(cells.map((c) => `${c.x},${c.y}`)).size, cells.length, 'bez duplikatów');
    assert.ok(cells.every((c) => c.x >= 10 - s.w && c.x <= 9 && c.y >= 12 - s.d && c.y <= 11));
  }
});

test('footprintCells blokuje na siatce dokładnie komórki budynku', () => {
  const g = new IsoGrid(20, 20), s = genBuilding(7, 'tavern');
  g.blockCells(footprintCells(s, 8, 9));
  assert.equal(g.blocked.size, s.w * s.d);
  assert.ok(g.isBlocked(7, 8) && !g.isBlocked(8, 9), 'komórka (sx,sy) leży już poza budynkiem');
});

test('dach leży nad murami: okap wystaje poza podstawę o dokładnie OVERHANG i jest wyżej niż mur minus spadek', () => {
  for (const s of specs) {
    const G = buildingGeometry(s), o = G.o;
    assert.ok(near(o, s.roofShape === 'cone' ? 0.08 : OVERHANG));
    const { W, S, E, N } = G.eave;
    assert.ok(near(W[0], -s.w - o) && near(W[1], o) && near(S[0], o) && near(S[1], o) && near(E[0], o) && near(E[1], -s.d - o) && near(N[0], -s.w - o) && near(N[1], -s.d - o));
    for (const p of [W, S, E, N]) assert.ok(near(p[2], G.h - 3), 'okap tuż pod koroną muru');
    assert.ok(G.rz > G.h + 10, 'kalenica wyraźnie nad murem');
  }
});

test('ściana szczytowa i kalenica leżą w jednej płaszczyźnie z murem (to była przyczyna dachu "wiszącego w powietrzu")', () => {
  for (const s of specs.filter((q) => q.roofShape === 'gable')) {
    const { roof, w, d, o, ez, rz } = buildingGeometry(s);
    if (roof.type === 'gx') {
      assert.equal(roof.gableFace, 'R');
      assert.ok(near(roof.gableApex[0], 0), 'szczyt w płaszczyźnie x=0 prawej ściany');
      assert.ok(near(roof.gableApex[1], -d / 2), 'szczyt dokładnie w połowie ściany');
      assert.ok(near(roof.R1[1], -d / 2) && near(roof.R2[1], -d / 2), 'kalenica biegnie wzdłuż osi x nad środkiem');
      assert.ok(near(roof.R2[0], o) && near(roof.R1[0], -w - o), 'kalenica wystaje poza szczyty o okap');
      assert.ok(roof.baseZ > ez && roof.baseZ < rz, 'połać w płaszczyźnie muru leży między okapem a kalenicą');
    } else {
      assert.equal(roof.type, 'gy'); assert.equal(roof.gableFace, 'L');
      assert.ok(near(roof.gableApex[1], 0) && near(roof.gableApex[0], -w / 2));
      assert.ok(near(roof.R1[0], -w / 2) && near(roof.R2[0], -w / 2));
      assert.ok(near(roof.R1[1], o) && near(roof.R2[1], -d - o));
      assert.ok(roof.baseZ > ez && roof.baseZ < rz);
    }
  }
});

test('dach czterospadowy ma szczyt dokładnie nad środkiem podstawy', () => {
  for (const s of specs.filter((q) => q.roofShape === 'hip' || q.roofShape === 'cone')) {
    const { roof, w, d, rz } = buildingGeometry(s);
    assert.equal(roof.type, 'hip');
    assert.ok(near(roof.apex[0], -w / 2) && near(roof.apex[1], -d / 2) && near(roof.apex[2], rz));
  }
});

test('wszystkie rodzaje budynków dają poprawną geometrię', () => {
  for (const kind of KINDS) for (let i = 1; i <= 10; i++) {
    const G = buildingGeometry(genBuilding(i * 3, kind));
    for (const v of Object.values(G.eave)) assert.ok(v.every(Number.isFinite));
    assert.ok(Number.isFinite(G.h) && Number.isFinite(G.rz));
  }
});
