// Składa katalog dist/ dla Capacitora: strony z www/ i kod z src/ obok siebie (strony importują ../src/...), wejście przekierowuje do menu.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dist = path.join(root, 'dist');
rmSync(dist, { recursive: true, force: true }); mkdirSync(dist, { recursive: true });
cpSync(path.join(root, 'www'), path.join(dist, 'www'), { recursive: true });
cpSync(path.join(root, 'src'), path.join(dist, 'src'), { recursive: true });
writeFileSync(path.join(dist, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arena Iso</title><body style="background:#14110f"><script>location.replace("www/index.html")</script>');
console.log('dist gotowy');
