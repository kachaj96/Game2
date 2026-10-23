// Czary wrogów. Same dane, bez importów (importuje je classdata, żeby findSpellDef znajdował czary wrogów po id).
// Każdy czar ma 5 poziomów: obrażenia rosną o 1 na poziom (poziom czaru wroga zależy od jego poziomu, patrz enemies.js).
const lv = (n, base) => Array.from({ length: 5 }, (_, i) => ({ ...base, ...(base.dmg ? { dmg: [base.dmg[0] + i, base.dmg[1] + i] } : {}) }));
export const ENEMY_SPELLS = {
  pazury: { id: 'pazury', element: 'earth', name: 'Pazury', desc: 'Cios pazurami z bliska.', levels: lv(5, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [5, 7] }) },
  wyrzut: { id: 'wyrzut', element: 'earth', name: 'Wyrzut', desc: 'Odrzuca cel o kafel.', levels: lv(5, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 1, dmg: [4, 6], push: 1, collision: 3 }) },
  pancerz: { id: 'pancerz', element: 'earth', name: 'Pancerz', desc: 'Uderzenie kościaną płytą.', levels: lv(5, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [6, 8] }) },
  taran: { id: 'taran', element: 'earth', name: 'Taran', desc: 'Odrzuca cel o 2 kafle. Zderzenie ze ścianą boli.', levels: lv(5, { pa: 4, min: 1, max: 1, cd: 0, perTurn: 1, dmg: [4, 6], push: 2, collision: 4 }) },
  zryw: { id: 'zryw', element: 'air', name: 'Zryw', desc: 'Szybkie cięcie.', levels: lv(5, { pa: 2, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [4, 6] }) },
  bloto: { id: 'bloto', element: 'water', name: 'Błoto', desc: 'Oblepia cel błotem: traci 1 PM w następnej turze.', levels: lv(5, { pa: 2, min: 1, max: 2, cd: 0, perTurn: 2, dmg: [3, 5], slow: 1 }) },
  pocisk: { id: 'pocisk', element: 'fire', name: 'Pocisk', desc: 'Plwocina żaru w linii.', levels: lv(5, { pa: 3, min: 2, max: 5, line: true, los: true, cd: 0, perTurn: 2, dmg: [6, 8] }) },
  kurz: { id: 'kurz', element: 'air', name: 'Kurz', desc: 'Podmuch kurzu odpycha cel i zasłania widok.', levels: lv(5, { pa: 3, min: 1, max: 3, line: true, cd: 2, perTurn: 1, dmg: [3, 4], push: 1, collision: 2, cloud: { turns: 1 } }) },
  ugryzienie: { id: 'ugryzienie', element: 'neutral', name: 'Ugryzienie', desc: 'Zwykłe ugryzienie.', levels: lv(5, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [5, 7] }) },
  pozarcie: { id: 'pozarcie', element: 'neutral', name: 'Pożarcie', desc: 'Zjada sąsiedni grób i leczy się o 25% życia.', levels: lv(5, { pa: 2, min: 1, max: 1, cd: 0, perTurn: 1, eatGrave: { healPct: 0.25 } }) },
  zagoj: { id: 'zagoj', element: 'neutral', name: 'Zagój', desc: 'Leczy sojusznika (jeszcze żaden wróg tego nie używa).', levels: Array.from({ length: 5 }, (_, i) => ({ pa: 3, min: 1, max: 3, cd: 0, perTurn: 1, heal: [8 + i, 12 + i] })) },
  kopniecie: { id: 'kopniecie', element: 'earth', name: 'Kopnięcie', desc: 'Kopniak olbrzyma.', levels: lv(5, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [7, 9] }) },
  taran_krola: { id: 'taran_krola', element: 'earth', name: 'Taran Króla', desc: 'Odrzuca cel o 3 kafle.', levels: lv(5, { pa: 4, min: 1, max: 1, cd: 0, perTurn: 1, dmg: [8, 10], push: 3, collision: 5 }) },
  wezwanie: { id: 'wezwanie', element: 'neutral', name: 'Wezwanie', desc: 'Przywołuje Kopacza na wolny kafel obok.', levels: lv(5, { pa: 4, min: 1, max: 3, cd: 3, rageCd: 2, perTurn: 1, summon: { kind: 'kopacz' } }) },
};
