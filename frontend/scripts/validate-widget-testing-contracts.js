#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { validateWidgetTestingContracts } = require('../src/test/app-builder/widgetContractValidator');

function changedFilesFromInput(input) {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('{')) {
        const record = JSON.parse(line);
        if (typeof record.path !== 'string' || typeof record.status !== 'string')
          throw new Error('Each changed-file record requires path and status');
        return record;
      }
      const [statusOrPath, maybePath] = line.split('\t');
      return maybePath ? { status: statusOrPath, path: maybePath } : { status: 'modified', path: statusOrPath };
    });
}

function changedFilesFromBase(frontendRoot, baseRef) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: frontendRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
  const base = git('rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`).trim();
  const scope = ['src/AppBuilder/Widgets', 'src/AppBuilder/WidgetManager/widgets'];
  const diffArgs = ['--no-ext-diff', '--no-textconv', '--relative', '--no-renames'];
  const names = git('diff', ...diffArgs, '--name-status', '-z', base, '--', ...scope).split('\0');
  const changes = [];
  for (let i = 0; i + 1 < names.length; i += 2) {
    const status = { A: 'added', D: 'removed', M: 'modified', T: 'modified' }[names[i]];
    if (!status) throw new Error(`Unsupported change status ${names[i]}`);
    const file = names[i + 1];
    const [added, deleted] = git('diff', ...diffArgs, '--numstat', base, '--', file).split('\t');
    const patch = git('diff', ...diffArgs, '--unified=3', base, '--', file);
    changes.push({
      status,
      path: file,
      additions: Number(added),
      deletions: Number(deleted),
      patch: patch.includes('@@ ') ? patch.slice(patch.indexOf('@@ ')).replace(/\n$/, '') : '',
    });
  }
  for (const file of git('ls-files', '--others', '--exclude-standard', '-z', '--', ...scope)
    .split('\0')
    .filter(Boolean)) {
    changes.push({ status: 'added', path: file });
  }
  return changes;
}

const frontendRoot = path.resolve(__dirname, '..');

function main() {
  try {
    const baseIndex = process.argv.indexOf('--base-ref');
    if (baseIndex !== -1 && (!process.argv[baseIndex + 1] || process.argv[baseIndex + 1].startsWith('--')))
      throw new Error('--base-ref requires a commit or branch');
    if (baseIndex !== -1 && process.argv.includes('--changed-files-stdin'))
      throw new Error('Use either --base-ref or --changed-files-stdin');
    const changedFiles =
      baseIndex !== -1
        ? changedFilesFromBase(frontendRoot, process.argv[baseIndex + 1])
        : process.argv.includes('--changed-files-stdin')
        ? changedFilesFromInput(fs.readFileSync(0, 'utf8'))
        : [];
    const result = validateWidgetTestingContracts(frontendRoot, {
      changedFiles,
    });
    // Print the ledger before errors for navigation. Counts describe the contract;
    // they do not prove complete coverage, test execution, or assertion quality.
    if (result.ledger?.length) {
      console.log('Widget coverage ledger:\n');
      for (const entry of result.ledger) {
        const { covered, shared, qa, decision, none, illegal } = entry.dispositions;
        console.log(
          `- ${entry.componentType} [whole-widget: ${entry.status}] ${entry.scenarios} scenarios ` +
            `(${entry.verifiedScenarios} verified, ${entry.engineeringScenarios} engineering, ${entry.qaScenarios} QA-owned, ${entry.deferredScenarios} deferred) | ` +
            `${entry.rows} disposed rows: ${covered} covered, ${shared} shared, ${qa} qa, ` +
            `${decision} decision, ${none} none, ${illegal} illegal | ${entry.openDecisions} open decisions`
        );
      }
      console.log('');
    }
    // Warnings print before the exit check and on the success path alike: debt
    // that nobody sees is not recorded.
    if (result.warnings?.length) {
      console.warn(`Widget testing contract warnings (${result.warnings.length}):\n`);
      console.warn(result.warnings.map((warning) => `- ${warning}`).join('\n'));
      console.warn('');
    }
    if (result.errors.length) {
      console.error(`Widget testing contract violations (${result.errors.length}):\n`);
      console.error(result.errors.map((error) => `- ${error}`).join('\n'));
      process.exit(1);
    }
    console.log(
      `Widget testing contracts OK — ${result.trackedWidgets} registered, ${result.verifiedWidgets} whole-widget engineering verified, ${result.pendingWidgets} pending whole-widget verification. Structural checks only.`
    );
  } catch (error) {
    console.error(`Widget testing contract validation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { changedFilesFromInput, changedFilesFromBase };
