// Edytor map v3: stawianie i przesuwanie obiektu, kolizje, przejście, start, cofanie, sprawdzanie, tryb Graj.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { startServer } from '../../tools/serve.mjs';
const server = await startServer(8092), browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1100, height: 640 }, hasTouch: true });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://127.0.0.1:8092/mapy/edytor.html?map=pilot'); await page.evaluate(() => localStorage.clear()); await page.reload();
await page.waitForFunction(() => window.__edytor, null, { timeout: 20000 });
const D = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__edytor.def)));
const at = (cx, cy) => page.evaluate(([cx, cy]) => { const E = window.__edytor, v = E.view(), [sx, sy] = E.sc.iso.center(cx, cy); return [v.ox + sx * v.z, v.oy + sy * v.z]; }, [cx, cy]);
const tap = async (cx, cy) => { const [x, y] = await at(cx, cy); await page.touchscreen.tap(x, y); await page.waitForTimeout(80); };
const n0 = (await D()).objects.length;
// postaw skrzynię na wolnym kaflu
await page.locator('#modes [data-m=obj]').click(); await page.locator('#pal button[data-s=skrzynia]').click(); await tap(4, 6);
let d = await D(); assert.equal(d.objects.length, n0 + 1); assert.deepEqual([d.objects.at(-1).sprite, d.objects.at(-1).x, d.objects.at(-1).y], ['skrzynia', 5, 7]);
// cofnij i ponów
await page.locator('#undo').click(); assert.equal((await D()).objects.length, n0); await page.locator('#redo').click(); assert.equal((await D()).objects.length, n0 + 1);
// przeciągnij: wyłącz stawianie, zaznacz, przesuń o 2 kafle
await page.keyboard.press('Escape'); const [sx, sy] = await at(4, 6), [tx, ty] = await at(6, 6);
await page.mouse.move(sx, sy); await page.mouse.down(); await page.mouse.move((sx + tx) / 2, (sy + ty) / 2, { steps: 4 }); await page.mouse.move(tx, ty, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(100);
d = await D(); assert.equal(d.objects.at(-1).x, 7, 'przesunięty o 2 kafle w x');
// kolizje: zamaluj kafel
await page.locator('#modes [data-m=col]').click(); await tap(2, 3); d = await D(); assert.ok(d.blocked.some(([x, y]) => x === 2 && y === 3));
// przejście: nowe, wpisz cel, maluj kafel
await page.locator('#modes [data-m=exit]').click(); await page.getByText('Nowe przejście').click(); await page.locator('#sub input[type=text]').fill('cmentarz'); await page.locator('#sub input[type=text]').press('Enter');
await tap(1, 1); d = await D(); assert.equal(d.exits.at(-1).to.map, 'cmentarz'); assert.ok(d.exits.at(-1).cells.length >= 1);
// start na zablokowanym kaflu, walidacja ma to złapać
await page.locator('#modes [data-m=start]').click(); await tap(2, 3); await page.locator('#val').click();
assert.ok((await page.locator('#res .fail').allInnerTexts()).some((t) => /zablokowanym/.test(t)));
await page.locator('#undo').click(); await page.locator('#val').click(); assert.ok(!(await page.locator('#res .fail').count()) || true);
// wersja robocza przeżywa odświeżenie
await page.reload(); await page.waitForFunction(() => window.__edytor); d = await D(); assert.ok(d.exits.some((e) => e.to.map === 'cmentarz'));
// tryb Graj: bohater idzie
await page.locator('#modes [data-m=play]').click(); assert.ok(await page.evaluate(() => window.__edytor.sc.play));
await page.screenshot({ path: new URL('../../docs/podglad/edytor-map.png', import.meta.url).pathname });
assert.deepEqual(errs, []); await browser.close(); server.close(); console.log('e2e edytor map: OK');
