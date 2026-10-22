// Dane klas: statystyki i czary. PROPOZYCJA, liczby do strojenia po pierwszych walkach.
// Wszystkie klasy startują z 6 PA i 3 PM (zwiększane ekwipunkiem). Każda ma 3 czary po 5 poziomów.
export const BASE = { pa: 6, pm: 3 };
// Żywioły (PROPOZYCJA do akceptacji): cztery plus neutralny. Kolor i kształt ramki ikony zależą od żywiołu. Efekt na obrażenia dopiero po akceptacji planu.
export const ELEMENTS = {
  earth: { id: 'earth', name: 'Ziemia', color: '#9a6a34', shape: 'square' },
  fire: { id: 'fire', name: 'Ogień', color: '#e0482a', shape: 'circle' },
  water: { id: 'water', name: 'Woda', color: '#3a8ae0', shape: 'hex' },
  air: { id: 'air', name: 'Powietrze', color: '#5ac85a', shape: 'diamond' },
  neutral: { id: 'neutral', name: 'Zwykłe', color: '#a8a8b4', shape: 'shield' },
};
export const MAX_SPELL_LEVEL = 5;
export const spellUpgradeCost = (fromLevel) => fromLevel; // z poziomu n na n+1 kosztuje n punktów czaru, 1 punkt czaru za poziom bohatera
export const STAT_POINTS_PER_LEVEL = 5;

// każdy poziom czaru: pa, min/max zasięgu, cd (odnowienie w turach), perTurn (limit rzutów w turze), dmg [min,max] i efekty
export const CLASSES = {
  grabarz: {
    id: 'grabarz', name: 'Grabarz', role: 'Wojownik', ratings: { damage: 3, control: 3, positioning: 1 },
    tagline: 'Kopie groby, zanim ktoś w nie wpadnie. Walczy z bliska i ustawia przeciwników tam, gdzie chce.',
    stats: { hp: 62, hpPerLevel: 7, initiative: 15, main: 'earth' },
    spells: [
      { id: 'cios_lopata', element: 'earth', name: 'Cios Łopatą', tags: ['damage'], desc: 'Uderzenie z bliska. Najmocniejszy cios na PA wśród klas startowych, ale wymaga stania przy przeciwniku.', levels: [
        { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [15, 19] }, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [17, 21] },
        { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [19, 23] }, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [21, 26] }, { pa: 3, min: 1, max: 1, cd: 0, perTurn: 2, dmg: [24, 30] }] },
      { id: 'zrzut_ziemi', element: 'earth', name: 'Zrzut Ziemi', tags: ['push'], desc: 'Odpycha cel w linii. Zderzenie z przeszkodą lub jednostką zadaje dodatkowe obrażenia za każdy niewykorzystany kafel.', levels: [
        { pa: 3, min: 1, max: 3, line: true, cd: 3, perTurn: 1, dmg: [6, 8], push: 2, collision: 4 }, { pa: 3, min: 1, max: 3, line: true, cd: 3, perTurn: 1, dmg: [7, 9], push: 2, collision: 5 },
        { pa: 3, min: 1, max: 4, line: true, cd: 2, perTurn: 1, dmg: [8, 10], push: 3, collision: 5 }, { pa: 3, min: 1, max: 4, line: true, cd: 2, perTurn: 1, dmg: [9, 12], push: 3, collision: 6 }, { pa: 3, min: 1, max: 5, line: true, cd: 2, perTurn: 1, dmg: [10, 13], push: 3, collision: 7 }] },
      { id: 'dol', element: 'earth', name: 'Dół', tags: ['trap'], desc: 'Kopie dół na kaflu. Kto w niego wpadnie, traci wszystkie punkty ruchu i obrywa.', levels: [
        { pa: 4, min: 1, max: 2, cd: 4, perTurn: 1, trap: { dmg: [10, 14], turns: 3, radius: 0, holdPm: true } }, { pa: 4, min: 1, max: 2, cd: 4, perTurn: 1, trap: { dmg: [12, 16], turns: 3, radius: 0, holdPm: true } },
        { pa: 3, min: 1, max: 2, cd: 4, perTurn: 1, trap: { dmg: [14, 18], turns: 4, radius: 0, holdPm: true } }, { pa: 3, min: 1, max: 3, cd: 3, perTurn: 1, trap: { dmg: [16, 21], turns: 4, radius: 1, holdPm: true } }, { pa: 3, min: 1, max: 3, cd: 3, perTurn: 1, trap: { dmg: [18, 24], turns: 5, radius: 1, holdPm: true } }] },
    ],
  },
  tropiciel: {
    id: 'tropiciel', name: 'Tropiciel', role: 'Łowca', ratings: { damage: 3, control: 2, positioning: 3 },
    tagline: 'Poluje w ciemności. Trzyma dystans, zastawia sidła i znika, zanim ktoś go dosięgnie.',
    stats: { hp: 46, hpPerLevel: 5, initiative: 40, main: 'air' },
    spells: [
      { id: 'belt', element: 'air', name: 'Bełt', tags: ['damage', 'los'], desc: 'Strzał z kuszy. Wymaga linii widzenia.', levels: [
        { pa: 3, min: 3, max: 7, los: true, cd: 0, perTurn: 2, dmg: [11, 15] }, { pa: 3, min: 3, max: 7, los: true, cd: 0, perTurn: 2, dmg: [13, 17] },
        { pa: 3, min: 3, max: 8, los: true, cd: 0, perTurn: 2, dmg: [15, 19] }, { pa: 3, min: 3, max: 8, los: true, cd: 0, perTurn: 2, dmg: [17, 22] }, { pa: 3, min: 3, max: 9, los: true, cd: 0, perTurn: 2, dmg: [19, 25] }] },
      { id: 'sidla', element: 'earth', name: 'Sidła', tags: ['trap'], desc: 'Zastawia pułapkę. Kto w nią wejdzie, obrywa i traci 2 PM w następnej turze.', levels: [
        { pa: 3, min: 1, max: 5, cd: 2, perTurn: 1, trap: { dmg: [8, 12], turns: 4, radius: 0, slowPm: 2, maxActive: 2 } }, { pa: 3, min: 1, max: 5, cd: 2, perTurn: 1, trap: { dmg: [10, 14], turns: 4, radius: 0, slowPm: 2, maxActive: 2 } },
        { pa: 3, min: 1, max: 6, cd: 2, perTurn: 1, trap: { dmg: [12, 16], turns: 5, radius: 0, slowPm: 2, maxActive: 3 } }, { pa: 2, min: 1, max: 6, cd: 2, perTurn: 1, trap: { dmg: [14, 19], turns: 5, radius: 0, slowPm: 2, maxActive: 3 } }, { pa: 2, min: 1, max: 6, cd: 1, perTurn: 1, trap: { dmg: [16, 22], turns: 6, radius: 0, slowPm: 2, maxActive: 4 } }] },
      { id: 'odskok', element: 'neutral', name: 'Skok w Cień', tags: ['position'], desc: 'Odskok do tyłu w linii, ponad jednostkami. Od 4. poziomu zostawia sidła w miejscu startu.', levels: [
        { pa: 2, min: 0, max: 0, self: true, jump: 3, cd: 4, perTurn: 1 }, { pa: 2, min: 0, max: 0, self: true, jump: 3, cd: 3, perTurn: 1 },
        { pa: 2, min: 0, max: 0, self: true, jump: 4, cd: 3, perTurn: 1 }, { pa: 2, min: 0, max: 0, self: true, jump: 4, cd: 3, perTurn: 1, leavesTrap: true }, { pa: 2, min: 0, max: 0, self: true, jump: 5, cd: 2, perTurn: 1, leavesTrap: true }] },
    ],
  },
  zalobnik: {
    id: 'zalobnik', name: 'Żałobnik', role: 'Mag', ratings: { damage: 3, control: 3, positioning: 2 },
    tagline: 'Żałoba to jego broń. Z popiołu i grobów wyciąga ogień, który pamięta poległych.',
    stats: { hp: 38, hpPerLevel: 4, initiative: 28, main: 'fire' },
    spells: [
      { id: 'zar', element: 'fire', name: 'Żar', tags: ['damage', 'los'], desc: 'Kula żaru. Przy świeżym grobie obok celu uderza mocniej. Wymaga linii widzenia.', levels: [
        { pa: 3, min: 2, max: 6, los: true, cd: 0, perTurn: 2, dmg: [12, 16], graveBonus: 0.3 }, { pa: 3, min: 2, max: 6, los: true, cd: 0, perTurn: 2, dmg: [14, 18], graveBonus: 0.3 },
        { pa: 3, min: 2, max: 7, los: true, cd: 0, perTurn: 2, dmg: [16, 20], graveBonus: 0.35 }, { pa: 3, min: 2, max: 7, los: true, cd: 0, perTurn: 2, dmg: [18, 23], graveBonus: 0.4 }, { pa: 3, min: 2, max: 8, los: true, cd: 0, perTurn: 2, dmg: [21, 26], graveBonus: 0.5 }] },
      { id: 'podmuch', element: 'air', name: 'Podmuch Popiołu', tags: ['push', 'los'], desc: 'Odpycha cel w linii i zostawia chmurę popiołu, która zasłania linię widzenia.', levels: [
        { pa: 3, min: 1, max: 4, line: true, cd: 2, perTurn: 1, dmg: [4, 6], push: 3, collision: 3, cloud: { turns: 1 } }, { pa: 3, min: 1, max: 4, line: true, cd: 2, perTurn: 1, dmg: [5, 7], push: 3, collision: 3, cloud: { turns: 1 } },
        { pa: 3, min: 1, max: 5, line: true, cd: 2, perTurn: 1, dmg: [6, 8], push: 3, collision: 4, cloud: { turns: 2 } }, { pa: 3, min: 1, max: 5, line: true, cd: 2, perTurn: 1, dmg: [7, 10], push: 4, collision: 4, cloud: { turns: 2 } }, { pa: 3, min: 1, max: 6, line: true, cd: 1, perTurn: 1, dmg: [8, 12], push: 4, collision: 5, cloud: { turns: 2 } }] },
      { id: 'stos', element: 'fire', name: 'Stos Pogrzebowy', tags: ['glyph'], desc: 'Zapala stos, który wybucha po turze. Postawiony na grobie zadaje o połowę więcej i pochłania grób.', levels: [
        { pa: 4, min: 2, max: 5, cd: 3, perTurn: 1, glyph: { dmg: [18, 24], radius: 1, delay: 1, graveBonus: 0.5 } }, { pa: 4, min: 2, max: 5, cd: 3, perTurn: 1, glyph: { dmg: [21, 28], radius: 1, delay: 1, graveBonus: 0.5 } },
        { pa: 4, min: 2, max: 6, cd: 3, perTurn: 1, glyph: { dmg: [24, 32], radius: 1, delay: 1, graveBonus: 0.5 } }, { pa: 4, min: 2, max: 6, cd: 2, perTurn: 1, glyph: { dmg: [27, 36], radius: 1, delay: 1, graveBonus: 0.5 } }, { pa: 3, min: 2, max: 7, cd: 2, perTurn: 1, glyph: { dmg: [30, 40], radius: 2, delay: 1, graveBonus: 0.5 } }] },
    ],
  },
};
export const CLASS_LIST = Object.values(CLASSES);

// Czary TESTOWE (dev) z innych żywiołów, żeby sprawdzać pasek skrótów i odporności. Nie należą do żadnej klasy, ładowane tylko przez ?spells=all.
// Prawdziwe czary zdobywane (i ich projekt) to osobna decyzja.
const lv = (f) => Array.from({ length: MAX_SPELL_LEVEL }, (_, i) => f(i));
export const DEV_SPELLS = [
  { id: 'lzy_zaloby', element: 'water', name: 'Łzy Żałoby', tags: ['damage', 'los'], dev: true, desc: 'Zimna kula wody. Wymaga linii widzenia.', levels: lv((i) => ({ pa: 3, min: 2, max: 5 + (i > 2 ? 1 : 0), los: true, cd: 0, perTurn: 2, dmg: [11 + 2 * i, 15 + 2 * i] })) },
  { id: 'kamienny_calun', element: 'earth', name: 'Kamienny Całun', tags: ['damage'], dev: true, desc: 'Uderzenie odłamkami skały z bliska.', levels: lv((i) => ({ pa: 3, min: 1, max: 3, cd: i < 3 ? 1 : 0, perTurn: 2, dmg: [13 + 2 * i, 17 + 2 * i] })) },
  { id: 'plonacy_belt', element: 'fire', name: 'Płonący Bełt', tags: ['damage', 'los'], dev: true, desc: 'Bełt z płonącym grotem. Wymaga linii widzenia.', levels: lv((i) => ({ pa: 3, min: 3, max: 6, los: true, cd: 0, perTurn: 2, dmg: [12 + 2 * i, 16 + 2 * i] })) },
  { id: 'szron', element: 'water', name: 'Szron', tags: ['damage'], dev: true, desc: 'Lodowy dotyk z bliska.', levels: lv((i) => ({ pa: 2, min: 1, max: 2, cd: i < 3 ? 1 : 0, perTurn: 2, dmg: [8 + 2 * i, 11 + 2 * i] })) },
  { id: 'wicher', element: 'air', name: 'Wicher', tags: ['damage', 'los'], dev: true, desc: 'Cięcie wiatrem na dystans.', levels: lv((i) => ({ pa: 2, min: 2, max: 6, los: true, cd: 0, perTurn: 3, dmg: [8 + 2 * i, 11 + 2 * i] })) },
];
export const findSpellDef = (classId, spellId) => CLASSES[classId]?.spells.find((s) => s.id === spellId) || DEV_SPELLS.find((s) => s.id === spellId) || null;
export const spellAt = (classId, spellId, level) => { const sp = CLASSES[classId]?.spells.find((s) => s.id === spellId); return sp ? sp.levels[level - 1] || null : null; };

// Przeszłość (jedna) i cechy (dwie): historia bohatera plus drobne liczby. Każda cecha ma plus i skazę.
export const ORIGINS = [
  { id: 'syn_kopca', name: 'Dziecko Cmentarza', story: 'Wychowałeś się wśród grobów. Martwych się nie boisz, żywych coraz mniej.', bonus: { hp: 8 }, bonusText: '+8 życia' },
  { id: 'wygnaniec', name: 'Wygnaniec z Dróg', story: 'Wypędzono cię z trzech miast. W czwartym nikt nie zadaje pytań, a arena nie pyta o przeszłość.', bonus: { initiative: 6 }, bonusText: '+6 inicjatywy' },
  { id: 'uczen', name: 'Uczeń Spalonej Biblioteki', story: 'Ocalało kilka kart. Resztę znasz na pamięć, i to cię przeraża.', bonus: { spellPoints: 1 }, bonusText: '+1 punkt czaru na start' },
  { id: 'straznik', name: 'Strażnik Zamkniętej Bramy', story: 'Pilnowałeś wejścia, aż coś stamtąd wyszło. Teraz schodzisz sprawdzić co.', bonus: { resistAll: 5 }, bonusText: '+5% odporności na wszystkie żywioły' },
];
// cechy: plus i skaza. Klucze: hp, initiative, earth/fire/water/air (moc żywiołu w %), resistAll (odporność na żywioły w %)
export const TRAITS = [
  { id: 'twardy', name: 'Twardy', desc: 'Znosi więcej, wolniej reaguje.', plus: { hp: 6 }, minus: { initiative: -3 } },
  { id: 'szybki', name: 'Szybki', desc: 'Pierwszy w kolejce, kruchszy.', plus: { initiative: 5 }, minus: { hp: -4 } },
  { id: 'zawzięty', name: 'Zawzięty', desc: 'Bije mocniej ziemią, mniej wytrzymuje.', plus: { earth: 4 }, minus: { hp: -4 } },
  { id: 'cichy', name: 'Cichy', desc: 'Pewny w wietrze, słabszy w ogniu.', plus: { air: 4 }, minus: { fire: -4 } },
  { id: 'naznaczony', name: 'Naznaczony', desc: 'Arena zostawiła ślad: ogień kosztem życia.', plus: { fire: 4 }, minus: { hp: -4 } },
  { id: 'ostrożny', name: 'Ostrożny', desc: 'Odporny na żywioły, słabszy w ziemi.', plus: { resistAll: 5 }, minus: { earth: -4 } },
];
export const MAX_TRAITS = 2;
// statystyki startowe po kreatorze: klasa + przeszłość + cechy
export function startStats(classId, originId, traitIds = []) {
  const c = CLASSES[classId], o = ORIGINS.find((x) => x.id === originId);
  const out = { hp: c.stats.hp, initiative: c.stats.initiative, earth: 0, fire: 0, water: 0, air: 0, power: 0, flat: 0, spellPoints: 0, pa: BASE.pa, pm: BASE.pm, resist: { earth: 0, fire: 0, water: 0, air: 0, neutral: 0 } };
  const add = (d) => { for (const [k, v] of Object.entries(d || {})) { if (k === 'resistAll') for (const e of ['earth', 'fire', 'water', 'air']) out.resist[e] += v; else out[k] = (out[k] || 0) + v; } };
  add(o?.bonus); for (const t of traitIds.slice(0, MAX_TRAITS)) { const tr = TRAITS.find((x) => x.id === t); add(tr?.plus); add(tr?.minus); }
  return out;
}
