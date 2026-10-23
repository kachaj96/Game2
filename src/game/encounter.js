// Skład spotkania: ile wrogów i jakich. Limit wrogów = 4 + liczba kompanów (zwierzak, towarzysz, drugi gracz); bohater sam walczy z maks. 4.
// Wszystko deterministyczne (rng z ziarna). Ograniczenia: przy 3 i więcej wrogach co najmniej 2 rodzaje, maks. 2 pancernych i 2 żerców,
// boss liczy się jako 1 miejsce, a solo walczy z nim najwyżej 2 dodatki.
import { rng } from '../art/rng.js';
import { ENEMIES, KOPACZE, enemyForLevel } from './enemies.js';

export const BASE_ENEMY_CAP = 4, MAX_PER_KIND = { pancerny: 2, zerca: 2 };
export const enemyCap = (companions = 0) => BASE_ENEMY_CAP + Math.max(0, companions | 0);

export function composeEncounter(seed, level, companions = 0, { boss = false, kinds = KOPACZE } = {}) {
  const r = rng(seed * 2654435 + 97), cap = enemyCap(companions), c = Math.max(0, companions | 0), pool = kinds;
  // bazowa liczba: 2 do 4, rośnie z poziomem; każdy kompan to jeden wróg więcej
  const base = Math.max(2, Math.min(4, 3 + (r() < 0.5 ? 1 : 0)));
  const adds = boss ? Math.min(2 + c, cap - 1) : Math.min(cap, base + c);
  const list = [];
  const count = (k) => list.filter((x) => x === k).length;
  const pick = () => {
    const ok = pool.filter((k) => count(k) < (MAX_PER_KIND[k] ?? 99));
    const total = ok.reduce((a, k) => a + ENEMIES[k].weight, 0); let t = r() * total;
    for (const k of ok) { t -= ENEMIES[k].weight; if (t < 0) return k; } return ok[ok.length - 1];
  };
  while (list.length < adds) list.push(pick());
  // przy 3 i więcej wrogach potrzebne 2 rodzaje: podmień ostatniego, jeśli wszyscy są tacy sami
  if (!boss && list.length >= 3 && new Set(list).size < 2) { const other = pool.find((k) => k !== list[0] && (MAX_PER_KIND[k] ?? 99) > 0); list[list.length - 1] = other; }
  const kindsOut = boss ? ['krol', ...list] : list;
  return kindsOut.map((kind, i) => ({ kind, level, id: `e${i + 1}`, seed: 10 + i }));
}
// ustawia wrogów po prawej stronie planszy (kolumny od końca), omijając zablokowane kafle
export function spawnEncounter(spec, { cols, rows, blocked = [] }) {
  const bl = new Set(blocked.map((b) => `${b.x},${b.y}`)), cells = [];
  for (let x = cols - 1; x >= cols - 3; x--) for (let k = 0; k < rows; k++) { const y = (Math.floor(rows / 2) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) + rows) % rows; if (!bl.has(`${x},${y}`)) cells.push({ x, y }); }
  return spec.map((s, i) => enemyForLevel(s.kind, s.level, s.id, cells[i].x, cells[i].y, { seed: s.seed }));
}

// najgorszy przypadek jednej tury wroga: najwięcej obrażeń (górne widełki, bez odporności) mieszczące się w PA i limitach rzutów na turę
import { damageRange, spellData, elementOfSpell } from './spells.js';
export function maxTurnDamage(unit) {
  const opts = unit.spells.map((s) => spellData(unit, s.id)).filter((sd) => sd && sd.data.dmg).map((sd) => ({ pa: sd.data.pa, per: sd.data.perTurn, v: damageRange(unit, sd.data, elementOfSpell(unit, sd.def.id))[1] }));
  let best = 0;
  const go = (i, pa, sum) => { if (i === opts.length) { best = Math.max(best, sum); return; } for (let n = 0; n <= opts[i].per && n * opts[i].pa <= pa; n++) go(i + 1, pa - n * opts[i].pa, sum + n * opts[i].v); };
  go(0, unit.maxPa, 0); return best;
}
export const worstRound = (units) => units.reduce((a, u) => a + maxTurnDamage(u), 0);
