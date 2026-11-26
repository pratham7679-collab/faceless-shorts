#!/usr/bin/env node
// Build dist/index.html: one self-contained page (CSS and JS inlined) that still downloads
// content packs from ./packs/ next to it, falling back to the inlined bundle when offline.
//   node tools/bundle-packs.mjs && node tools/build-single.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, f) => `<style>\n${readFileSync(join(root, f), 'utf8')}\n</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, f) => `<script>\n${readFileSync(join(root, f), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
mkdirSync(join(root, 'dist/packs'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
for (const f of readdirSync(join(root, 'packs'))) copyFileSync(join(root, 'packs', f), join(root, 'dist/packs', f));
console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB + packs/`);
