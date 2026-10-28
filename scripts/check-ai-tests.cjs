#!/usr/bin/env node
// Validate placement AND actual Jest discovery. Listing tests never runs global DB setup.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const edition = require('./ai-test-scope.cjs').editionFor(process.argv[2] || 'server');
if (!['ce', 'ee', 'cloud'].includes(edition)) throw new Error('Unknown TOOLJET_EDITION');
const useEE = edition !== 'ce';
const errors = [];
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
const selected = process.argv[2];
if (selected && !['server', 'frontend'].includes(selected)) throw new Error('Expected server or frontend');
for (const pkg of selected ? [selected] : ['server', 'frontend']) {
  if (useEE && !fs.existsSync(path.join(root, pkg, 'ee', pkg === 'server' ? 'ai' : 'modules/AiBuilder'))) {
    errors.push(`${pkg}: EE checkout is required; initialize the pinned submodule or explicitly select ce`);
    continue;
  }
  if (useEE && process.env.GITHUB_ACTIONS === 'true') {
    const readGit = (args) => {
      const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
      return result.stdout.trim();
    };
    const pinned = readGit(['rev-parse', `HEAD:${pkg}/ee`]);
    const actual = readGit(['-C', `${pkg}/ee`, 'rev-parse', 'HEAD']);
    if (pinned !== actual) throw new Error(`${pkg}: checked out EE commit differs from the parent pointer`);
    console.log(`${pkg}: verified pinned EE commit ${actual}`);
  }
  const scoped = require('./ai-test-scope.cjs').findAiTests(pkg);
  const expected = new Set();
  for (const file of scoped) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const valid =
      pkg === 'server'
        ? /^server\/(ee\/)?test\/modules\/ai\/unit\/[^/]+\.spec\.ts$/.test(rel)
        : /\/__tests__\/.*\.spec\.[jt]sx?$/.test(rel);
    if (!valid) errors.push(`Misplaced AI test: ${rel}`);
    const source = fs.readFileSync(file, 'utf8');
    if (/\b(?:it|test|describe)\s*\.\s*(?:only|skip|todo|failing)\s*(?:\(|\.)/.test(source)) {
      errors.push(`Disabled, focused or expected-failing AI test: ${rel}`);
    }
    if (
      !rel.startsWith(`${pkg}/ee/`) &&
      require('./ai-test-scope.cjs')
        .imports(source)
        .some((specifier) => /^(?:@ee\/|@licensing\/|@instance-settings\/|@apps\/)|(?:^|\/)ee\//.test(specifier))
    ) {
      errors.push(`Public AI test imports private code: ${rel}`);
    }
    if (pkg === 'server') {
      const groupRunner = require(require.resolve('jest-runner-groups', { paths: [path.join(root, 'server')] }));
      if (
        !groupRunner.filterTest(
          {
            include: ['platform', 'working', 'workflows', 'security', 'database', 'marketplace'],
            exclude: ['gitsync'],
          },
          { path: file }
        )
      ) {
        errors.push(`Normal CI group filtering excludes AI test: ${rel}`);
      }
      const groups = [...source.matchAll(/@group\s+(\w+)/g)].map((match) => match[1]);
      if (
        !groups.some((group) =>
          ['platform', 'working', 'workflows', 'security', 'database', 'marketplace'].includes(group)
        )
      ) {
        errors.push(`AI test is missing a normal CI group: ${rel}`);
      }
    }

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
