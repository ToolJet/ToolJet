#!/usr/bin/env node
// Packages the first-party component packs with the server (Phase 5, distribution): each pack listed in
// packs/builtin.json is built (build.mjs) and its dist copied to server/builtin-packs/<pack>/ with a pack.json of
// its identity and version. The server installs them into every workspace on first use (ee builtin-packs.ts), so a
// fresh workspace has them with no publish step. Run in CI before packaging the server.
//
//   node packages/pack-tools/bundle-builtin.mjs [--no-build]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const list = JSON.parse(fs.readFileSync(path.join(root, 'packs/builtin.json'), 'utf8'));
const out = path.join(root, 'server/builtin-packs');
const build = !process.argv.includes('--no-build');

fs.rmSync(out, { recursive: true, force: true });
for (const { dir, version } of list.packs) {
  const packDir = path.join(root, dir);
  if (build) execFileSync('node', [path.join(root, 'packages/pack-tools/build.mjs'), packDir], { stdio: 'inherit' });
  const { libraryName, correlationId } = JSON.parse(fs.readFileSync(path.join(packDir, '.tooljet/config.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(packDir, 'dist/manifest.json'), 'utf8'));
  const target = path.join(out, manifest.pack);
  fs.mkdirSync(target, { recursive: true });
  for (const file of ['index.js', 'index.css', 'manifest.json']) {
    const from = path.join(packDir, 'dist', file);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(target, file));
  }
  fs.writeFileSync(
    path.join(target, 'pack.json'),
    JSON.stringify({ pack: manifest.pack, libraryName, correlationId, version }, null, 2) + '\n'
  );
  console.log(`built-in ${manifest.pack} ${version} (${libraryName})`);
}
