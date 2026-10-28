#!/usr/bin/env node
// Validate execution against actual focused discovery, including every assertion's status.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
try {
  const [pkg, resultsFile] = process.argv.slice(2);
  if (!['server', 'frontend'].includes(pkg) || !resultsFile)
    throw new Error('Usage: check-ai-test-results.cjs server|frontend results.json');
  const cwd = path.resolve(__dirname, '..', pkg);
  const config = pkg === 'server' ? 'test/jest-ai.config.ts' : 'jest-ai.config.js';
  const discovery = spawnSync(
    process.execPath,
    [require.resolve('jest/bin/jest', { paths: [cwd] }), '--config', config, '--listTests', '--json', '--runInBand'],
    { cwd, encoding: 'utf8' }
  );
  if (discovery.status !== 0)
    throw new Error(discovery.error?.message || discovery.stderr || 'AI test discovery failed');
  const expected = JSON.parse(discovery.stdout);
  if (!expected.length) throw new Error('No expected AI tests');
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')).testResults;
  let count = 0;
  for (const file of expected) {
    const suite = results.find((result) => result.name === file);
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
