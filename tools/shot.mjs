// Robi zrzuty stron podglądu do docs/podglad. Wymaga Playwrighta (npm i), a w razie potrzeby CHROMIUM_PATH.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = [
  ['wioska', 1500, 800], ['zblizenie', 1500, 900], ['klasy', 1500, 980], ['ikony', 1500, 1130], ['siatka', 1000, 700, async (page) => { const c = await page.evaluate(() => window.__grid.center(5, 6)); const box = await page.locator('canvas').boundingBox(); await page.mouse.move(box.x + c[0], box.y + c[1]); }], ['budynki', 1500, 860], ['postacie', 1500, 620], ['postacie-zblizenie', 1500, 560], ['przyroda', 1500, 520], ['przeciwnicy', 1500, 790], ['motywy', 1500, 900],
];

let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const server = await startServer(8099);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let bad = 0;
for (const [name, w, h, act] of SHOTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => { bad++; console.error(`${name}: ${e.message}`); });
  await page.goto(`http://127.0.0.1:8099/www/${name}.html`);
  if (act) await act(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'docs/podglad', `${name}.png`) });
  await page.close();
  console.log('zrzut:', name);
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
