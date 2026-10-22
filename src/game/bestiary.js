// Przeciwnicy: archetypy z odpornościami na żywioły (w %, ujemne = słabość). Reguła projektowa pilnowana testem:
// każdy archetyp ma co najmniej jeden żywioł z odpornością <= 0, żeby żaden build nie trafił na ścianę nie do pokonania.
export const ARCHETYPES = {
  straznik: { name: 'Strażnik', classId: 'grabarz', maxHp: 22, damageScale: 0.4, spells: [{ id: 'cios_lopata', level: 1 }], resist: { earth: 30, fire: -20, water: 0, air: 10, neutral: 0 } },
  popielny: { name: 'Popielny', classId: 'grabarz', maxHp: 20, damageScale: 0.4, spells: [{ id: 'cios_lopata', level: 1 }], resist: { earth: 0, fire: 50, water: -30, air: 0, neutral: 0 } },
  topielec: { name: 'Topielec', classId: 'grabarz', maxHp: 24, damageScale: 0.4, spells: [{ id: 'cios_lopata', level: 1 }], resist: { earth: 10, fire: -30, water: 50, air: 0, neutral: 0 } },
  wichrzyciel: { name: 'Wichrzyciel', classId: 'grabarz', maxHp: 18, damageScale: 0.4, spells: [{ id: 'cios_lopata', level: 1 }], resist: { earth: -30, fire: 0, water: 10, air: 40, neutral: 0 } },
  szkielet: { name: 'Szkielet', classId: 'grabarz', maxHp: 20, damageScale: 0.4, spells: [{ id: 'cios_lopata', level: 1 }], resist: { earth: 0, fire: 0, water: 0, air: 0, neutral: 20 } },
};
export const spawn = (archetype, id, x, y, extra = {}) => { const a = ARCHETYPES[archetype]; if (!a) throw new Error(`Nieznany archetyp: ${archetype}`); return { id, team: 'wrog', archetype, ...structuredClone(a), x, y, ...extra }; };
