// Renderuje ikony Androida (launcher, okrągła, warstwa pierwszego planu) z www/ikona.html do android/app/src/main/res/mipmap-*.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), res = path.join(root, 'android/app/src/main/res');
const dens = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
const server = await startServer(8141), browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
const shot = async (v, size, file) => { await page.setViewportSize({ width: size, height: size }); await page.goto(`http://127.0.0.1:8141/www/ikona.html?v=${v}&size=${size}`); await page.waitForFunction(() => window.__ok); writeFileSync(file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })); };
for (const [d, [legacy, adaptive]] of Object.entries(dens)) {
  const dir = path.join(res, `mipmap-${d}`); mkdirSync(dir, { recursive: true });
  await shot('full', legacy, path.join(dir, 'ic_launcher.png')); await shot('round', legacy, path.join(dir, 'ic_launcher_round.png')); await shot('fg', adaptive, path.join(dir, 'ic_launcher_foreground.png'));
}
await shot('full', 512, path.join(root, 'docs/ikona-512.png'));
await browser.close(); server.close(); console.log('ikony gotowe');
