#!/usr/bin/env node
// Validate execution against actual focused discovery, including every assertion's status.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
try {
  const [pkg, resultsFile, mode = 'unit'] = process.argv.slice(2);
  if (!['server', 'frontend'].includes(pkg) || !resultsFile || !['unit', 'e2e', 'focused'].includes(mode))
    throw new Error('Usage: check-ai-test-results.cjs server|frontend results-file-or-directory [unit|e2e|focused]');
  const cwd = path.resolve(__dirname, '..', pkg);
  const { findAiTests, editionFor } = require('./ai-test-scope.cjs');
  const { testKind } = require('./ai-test-policy.cjs');
  const config =
    mode === 'focused'
      ? pkg === 'server'
        ? 'test/jest-ai.config.ts'
        : 'jest-ai.config.js'
      : pkg === 'server'
        ? mode === 'e2e'
          ? 'test/jest-e2e.config.ts'
          : 'jest.config.ts'
        : 'jest.config.js';
  const scoped = findAiTests(pkg).filter((file) => {
    const relative = path.relative(path.dirname(cwd), file).split(path.sep).join('/');
    return (editionFor(pkg) !== 'ce' || !relative.startsWith(`${pkg}/ee/`)) && testKind(pkg, relative) === mode;
  });
  if (mode === 'e2e' && scoped.length === 0) {
    console.log(`${pkg}: no AI e2e suites are declared`);
    process.exit(0);
  }
  const discovery = spawnSync(
    process.execPath,
    [require.resolve('jest/bin/jest', { paths: [cwd] }), '--config', config, '--listTests', '--json', '--runInBand'],
    { cwd, encoding: 'utf8' }
  );
  if (discovery.status !== 0)
    throw new Error(discovery.error?.message || discovery.stderr || 'AI test discovery failed');
  const discovered = JSON.parse(discovery.stdout);
  const expected = mode === 'focused' ? discovered : scoped;
  if (!expected.length) throw new Error('No expected AI tests');
  for (const file of expected) if (!discovered.includes(file)) throw new Error(`Normal ${mode} runner misses ${file}`);
  const readResults = (file) =>
    fs.statSync(file).isDirectory()
      ? fs
          .readdirSync(file)
          .filter((name) => name.endsWith('.json'))
          .flatMap((name) => readResults(path.join(file, name)))
      : JSON.parse(fs.readFileSync(file, 'utf8')).testResults || [];
  const results = readResults(resultsFile);
  let count = 0;
  for (const file of expected) {
    const matching = results.filter((result) => result.name === file);
    if (matching.length > 1) throw new Error(`AI suite ran more than once: ${path.relative(cwd, file)}`);
    const suite = matching[0];
    if (!suite || suite.status !== 'passed' || !suite.assertionResults.length)
      throw new Error(`Missing, failed or empty AI suite: ${path.relative(cwd, file)}`);
    for (const assertion of suite.assertionResults) {
      if (assertion.status !== 'passed')
        throw new Error(`AI test did not pass: ${assertion.fullName} (${assertion.status})`);
      count++;
    }
  }
  console.log(`${pkg}: executed ${count} AI tests in ${expected.length} suites, no failures or skips`);
} catch (error) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      '\n### AI execution check failed\n\n```text\n' + error.message.replaceAll('```', "'''") + '\n```\n'
    );
  }
  console.error(error.message);
  process.exitCode = 1;
}
