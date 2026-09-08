const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mode = args.shift() || 'all';
const editionArg = args.find((arg) => arg.startsWith('--edition'));
const edition = editionArg?.includes('=')
  ? editionArg.split('=')[1]
  : editionArg
  ? args[args.indexOf(editionArg) + 1]
  : undefined;
const forwarded = editionArg
  ? args.filter((arg, index) => arg !== editionArg && index !== args.indexOf(editionArg) + 1)
  : args;
if (edition && !['ce', 'ee'].includes(edition)) throw new Error('--edition must be ce or ee');
if (edition === 'ee' && !fs.existsSync(path.resolve(__dirname, '../ee/modules'))) {
  throw new Error('EE tests require the frontend/ee submodule with ee/modules checked out');
}

const patterns = {
  all: ['src/AppBuilder', 'src/test/app-builder'],
  contracts: [
    'src/test/app-builder/__tests__/contracts.spec.js',
    'src/test/app-builder/__tests__/widgetContractValidator.spec.js',
  ],
  parity: ['src/test/app-builder/__tests__/parity.spec.js'],
};
const jestArgs = [...(patterns[mode] || patterns.all), ...forwarded];
if (mode === 'watch') jestArgs.push('--watch');
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), ...jestArgs], {
  stdio: 'inherit',
  env: { ...process.env, ...(edition ? { TOOLJET_EDITION: edition } : {}) },
});
process.exit(result.status ?? 1);
