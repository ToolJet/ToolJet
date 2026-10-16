#!/usr/bin/env node
// Writes Widgets/Ui2/__contracts__/<Type>.json, the frozen public contract of every UI 2.0 widget (see
// Widgets/Ui2/__tests__/compat/contract.js). New names are written at once. A removed or changed name is written only
// when it is a rename recorded in legacyNames.ts with a data migration, or an accepted break with a reason in
// __contracts__/acceptedBreaks.json; anything else is refused with the same explanation the contract spec gives.
//
//   npm run ui2:contracts            update the contract files
//   npm run ui2:contracts -- --check report only, exit 1 when anything is out of date
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const LOADABLE = [path.join(ROOT, 'src'), path.resolve(ROOT, '../server/src')];

// The configs and legacyNames.ts are ES modules (one in TypeScript): compile them on require, as Jest does.
for (const ext of ['.js', '.ts']) {
  const fallback = require.extensions[ext] || require.extensions['.js'];
  require.extensions[ext] = (module, filename) => {
    if (!LOADABLE.some((dir) => filename.startsWith(dir))) return fallback(module, filename);
    const { code } = babel.transformFileSync(filename, {
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    });
    return module._compile(code, filename);
  };
}

const { shadcnConfigs } = require('../src/AppBuilder/WidgetManager/widgets/shadcn');
const { renamesFor } = require('../src/AppBuilder/Widgets/Ui2/legacyNames');
const contract = require('../src/AppBuilder/Widgets/Ui2/__tests__/compat/contract');

const check = process.argv.includes('--check');
const { liveContracts, classified } = contract.compareWithFrozen({ configs: shadcnConfigs, renamesFor });
const breaks = classified.filter((c) => c.verdict === 'break');
const blocked = new Set(breaks.map((c) => c.type));

if (breaks.length) console.error(contract.explainAll(breaks), '\n');

const changed = [...new Set(classified.map((c) => c.type))].filter((t) => !blocked.has(t));
if (check) {
  if (changed.length) console.error(contract.explainAll(classified.filter((c) => c.verdict !== 'break')));
  process.exit(breaks.length || changed.length ? 1 : 0);
}

fs.mkdirSync(contract.CONTRACTS_DIR, { recursive: true });
for (const type of changed) {
  const file = contract.contractFile(type);
  if (liveContracts[type]) fs.writeFileSync(file, contract.serialize(liveContracts[type]));
  else fs.rmSync(file); // an accepted widget removal
  const notes = classified.filter((c) => c.type === type).map((c) => `${c.area} ${c.key} ${c.verdict}`);
  console.log(`${type}: ${notes.join(', ')}`);
}
if (!fs.existsSync(contract.ACCEPTED_BREAKS))
  fs.writeFileSync(contract.ACCEPTED_BREAKS, contract.serialize({ breaks: [] }));

console.log(
  `${changed.length} contract file(s) written` +
    (blocked.size ? `; ${blocked.size} refused (${[...blocked].join(', ')}), see above.` : '.')
);
process.exit(breaks.length ? 1 : 0);
