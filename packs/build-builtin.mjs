#!/usr/bin/env node
// Builds the component packs that ship with ToolJet and puts them where the server serves them from
// (server/src/modules/builtin-packs). Each pack listed in packs/builtin.json is built
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
// displayNames: the panel name of a pack component whose export name reads wrong there. A component's name is saved in
// apps, so it cannot be renamed: Rocket 2.0's droppable TabsContainer shows as Tabs, as Ant's and MUI's Tabs do, and its
// text-only Tabs as Text Tabs (team testing, 2026-10-29: a drop into Rocket's "Tabs" went to the canvas).
const { packs, displayNames = {} } = JSON.parse(fs.readFileSync(path.join(root, 'packs/builtin.json'), 'utf8'));

fs.rmSync(out, { recursive: true, force: true });
for (const dir of packs) {
  const packDir = path.join(root, dir);
  const pack = path.basename(packDir);
  // The Dockerfiles run this under NODE_ENV=production, which would skip the dev dependencies (types) the build needs.
  if (install) execFileSync('npm', ['ci', '--include=dev', '--no-audit', '--no-fund'], { cwd: packDir, stdio: 'inherit' });
  execFileSync('node', [cli, 'library', 'build'], { cwd: packDir, stdio: 'inherit' });

  const { version } = JSON.parse(fs.readFileSync(path.join(packDir, 'package.json'), 'utf8'));
  const { libraryName } = JSON.parse(fs.readFileSync(path.join(packDir, '.tooljet/config.json'), 'utf8'));
  const target = path.join(out, pack);
  fs.mkdirSync(target, { recursive: true });
  for (const file of ['index.js', 'index.css', 'manifest.json']) {
    const from = path.join(packDir, 'dist', file);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(target, file));
  }
  const names = displayNames[pack];
  if (names) {
    const manifestPath = path.join(target, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const [component, displayName] of Object.entries(names)) {
      if (!manifest.components?.[component]) throw new Error(`packs/builtin.json: ${pack} has no component ${component}`);
      manifest.components[component].displayName = displayName;
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  fs.writeFileSync(
    path.join(target, 'builtin.json'),
    JSON.stringify({ pack, displayName: libraryName ?? pack, version }, null, 2) + '\n'
  );
  console.log(`built-in ${pack} ${version}`);
}
