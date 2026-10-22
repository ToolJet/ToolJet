/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

// The pages App.jsx lazy-loads used to be bundled with the app, so their stylesheets applied everywhere,
// and other screens rely on classes they define. lazyPageStyles.ts keeps loading those stylesheets with
// the app (with workspaceSettingsStyles.ts). This fails when a lazy page imports a stylesheet listed in neither.

const SRC = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(file, 'utf8');
const resolveAlias = (spec, fromDir) =>
  spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : path.resolve(fromDir, spec);

function lazyPageDirs() {
  const app = read(path.join(SRC, 'App/App.jsx'));
  const targets = [...app.matchAll(/lazy\(\s*\(\)\s*=>\s*import\((?:\/\*.*?\*\/\s*)?'(@\/[^']+)'\)/gs)].map(
    (m) => m[1]
  );
  return [
    ...new Set(
      targets.map((target) => {
        const full = path.join(SRC, target.slice(2));
        return fs.existsSync(full) && fs.statSync(full).isDirectory() ? full : path.dirname(full);
      })
    ),
  ];
}

function stylesheetsImportedUnder(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') found.push(...stylesheetsImportedUnder(full));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      for (const [, spec] of read(full).matchAll(/import\s+['"]([^'"]+\.s?css)['"]/g)) {
        found.push(resolveAlias(spec, dir));
      }
    }
  }
  return found;
}

test('App.jsx still lazy-loads pages (otherwise this check covers nothing)', () => {
  expect(lazyPageDirs().length).toBeGreaterThan(0);
});

test('every stylesheet a lazy page imports is loaded up front by lazyPageStyles.ts or workspaceSettingsStyles.ts', () => {
  const listed = new Set(
    ['App/lazyPageStyles.ts', 'App/workspaceSettingsStyles.ts'].flatMap((file) =>
      [...read(path.join(SRC, file)).matchAll(/import\s+'([^']+)'/g)].map(([, spec]) =>
        resolveAlias(spec, path.join(SRC, 'App'))
      )
    )
  );
  const missing = [...new Set(lazyPageDirs().flatMap(stylesheetsImportedUnder))]
    .filter((sheet) => !listed.has(sheet))
    .map((sheet) => path.relative(SRC, sheet));

  expect(missing).toEqual([]);
});
