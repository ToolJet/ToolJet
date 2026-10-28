#!/usr/bin/env node
// Validate placement AND actual Jest discovery. Listing tests never runs global DB setup.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const edition = process.env.TOOLJET_EDITION || 'ee';
if (!['ce', 'ee', 'cloud'].includes(edition)) throw new Error('Unknown TOOLJET_EDITION');
const useEE = edition !== 'ce';
const errors = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name) || entry.isSymbolicLink()) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function listTests(pkg, config) {
  const cwd = path.join(root, pkg);
  const jest = require.resolve('jest/bin/jest', { paths: [cwd] });
  const result = spawnSync(process.execPath, [jest, '--config', config, '--listTests', '--json', '--runInBand'], {
    cwd,
    env: { ...process.env, TOOLJET_EDITION: edition },
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${pkg}/${config} discovery failed: ${result.stderr}`);
  return new Set(JSON.parse(result.stdout).map((f) => path.relative(root, f).split(path.sep).join('/')));
}
for (const pkg of ['server', 'frontend']) {
  if (useEE && !fs.existsSync(path.join(root, pkg, 'ee', pkg === 'server' ? 'ai' : 'modules/AiBuilder'))) {
    errors.push(`${pkg}: EE checkout is required; initialize the pinned submodule or explicitly select ce`);
    continue;
  }
  const files = ['src', 'test', 'ee'].flatMap((dir) => walk(path.join(root, pkg, dir)));
  const scoped = files
    .filter((file) => /\.(spec|test)\.[jt]sx?$/.test(file))
    .filter((file) => {
      const rel = path.relative(root, file).split(path.sep).join('/');
      return (
        /\/(ai|AiBuilder|ManageLLMKeyPage|ApiKeyContainer)\//.test(rel) ||
        /\/ai[^/]*\.(spec|test)\./i.test(rel) ||
        (pkg === 'server' &&
          /(?:from\s*|require\s*\()\s*['"][^'"]*(?:\/ai\/|\/AiBuilder\/|\/ai\.service)/.test(
            fs.readFileSync(file, 'utf8')
          ))
      );
    });
  const expected = new Set();
  for (const file of scoped) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const valid =
      pkg === 'server'
        ? /^server\/(ee\/)?test\/modules\/ai\/unit\/[^/]+\.spec\.ts$/.test(rel)
        : /\/__tests__\/.*\.spec\.[jt]sx?$/.test(rel);
    if (!valid) errors.push(`Misplaced AI test: ${rel}`);
    if (pkg === 'server' && /(?:from\s*|require\s*\()\s*['"]node:test['"]/.test(fs.readFileSync(file, 'utf8'))) {
      errors.push(`Node runner in Jest suite: ${rel}`);
    }
    if (useEE || !rel.startsWith(`${pkg}/ee/`)) expected.add(rel);
  }
  const minimum = pkg === 'server' ? (useEE ? 19 : 3) : useEE ? 13 : 1;
  if (expected.size < minimum)
    errors.push(`${pkg}: expected at least ${minimum} AI test files, found ${expected.size}`);
  const focused = listTests(pkg, pkg === 'server' ? 'test/jest-ai.config.ts' : 'jest-ai.config.js');
  const normal = listTests(pkg, pkg === 'server' ? 'jest.config.ts' : 'jest.config.js');
  for (const file of expected) {
    if (!focused.has(file)) errors.push(`Focused runner misses ${file}`);
    if (!normal.has(file)) errors.push(`Normal runner misses ${file}`);
  }
  for (const file of focused) if (!expected.has(file)) errors.push(`Unexpected focused test: ${file}`);
  if (!useEE)
    for (const file of focused) if (file.startsWith(`${pkg}/ee/`)) errors.push(`CE runner includes EE test: ${file}`);
  console.log(`${pkg} ${edition}: ${expected.size} AI files checked against focused and normal discovery`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
