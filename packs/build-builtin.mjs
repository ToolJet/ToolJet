#!/usr/bin/env node
// Builds the component packs that ship with ToolJet and puts them where the server serves them from
// (server/src/modules/custom-component-libraries/builtin-packs.ts). Each pack listed in packs/builtin.json is built
// with the custom component CLI (`tooljet library build`, from cli/), exactly like any custom component library, and
// its dist/ is copied to server/builtin-packs/<pack>/ with a builtin.json naming it. Run in CI and the Docker build,
// after `npm --prefix cli run build`.
//
//   node packs/build-builtin.mjs [--install]   (--install runs `npm ci` in each pack first)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'cli/bin/run');
const out = path.join(root, 'server/builtin-packs');
const install = process.argv.includes('--install');
const { packs } = JSON.parse(fs.readFileSync(path.join(root, 'packs/builtin.json'), 'utf8'));

fs.rmSync(out, { recursive: true, force: true });
for (const dir of packs) {
  const packDir = path.join(root, dir);
  const pack = path.basename(packDir);
  if (install) execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: packDir, stdio: 'inherit' });
  execFileSync('node', [cli, 'library', 'build'], { cwd: packDir, stdio: 'inherit' });

  const { version } = JSON.parse(fs.readFileSync(path.join(packDir, 'package.json'), 'utf8'));
  const { libraryName } = JSON.parse(fs.readFileSync(path.join(packDir, '.tooljet/config.json'), 'utf8'));
  const target = path.join(out, pack);
  fs.mkdirSync(target, { recursive: true });
  for (const file of ['index.js', 'index.css', 'manifest.json']) {
    const from = path.join(packDir, 'dist', file);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(target, file));
  }
  fs.writeFileSync(
    path.join(target, 'builtin.json'),
    JSON.stringify({ pack, displayName: libraryName ?? pack, version }, null, 2) + '\n'
  );
  console.log(`built-in ${pack} ${version}`);
}
