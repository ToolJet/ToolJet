#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { validateWidgetTestingContracts } = require('../src/test/app-builder/widgetContractValidator');

function changeOptions(args) {
  let stdin = false;
  let designOnly = false;
  let baseRef;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--changed-files-stdin' && !stdin) stdin = true;
    else if (args[index] === '--design-only' && !designOnly) designOnly = true;
    else if (args[index] === '--base-ref' && baseRef === undefined) {
      baseRef = args[++index];
      if (!baseRef || baseRef.startsWith('-')) throw new Error('--base-ref requires a Git commit or ref');
    } else throw new Error(`Unknown or repeated argument: ${args[index]}`);
  }
  if (stdin && baseRef !== undefined) throw new Error('--changed-files-stdin and --base-ref are mutually exclusive');
  return { stdin, designOnly, baseRef: baseRef ?? 'HEAD' };
}

function changedFilesFromStdin() {
  return fs
    .readFileSync(0, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t');
      if (tab === -1) return { status: 'modified', path: line };
      const status = line.slice(0, tab);
      const filePath = line.slice(tab + 1);
      if (
        !['added', 'modified', 'removed', 'renamed', 'copied', 'changed', 'unchanged'].includes(status) ||
        !filePath
      ) {
        throw new Error('Changed-file stdin requires a path or a GitHub status<TAB>path per line');
      }
      return { status, path: filePath };
    });
}

function changedFilesFromGit(frontendRoot, baseRef) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: frontendRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  try {
    const base = git('rev-parse', '--verify', '--end-of-options', `${baseRef}^{commit}`).trim();
    // Disabling rename detection keeps both the removed and added paths in scope.
    const entries = git('diff', '--relative', '--name-status', '-z', '--no-renames', base, '--', '.').split('\0');
    const files = [];
    for (let index = 0; index + 1 < entries.length; index += 2) {
      const status = entries[index] === 'A' ? 'added' : entries[index] === 'D' ? 'removed' : 'modified';
      files.push({ status, path: entries[index + 1] });
    }
    for (const filePath of git('ls-files', '--others', '--exclude-standard', '-z', '--', '.')
      .split('\0')
      .filter(Boolean)) {
      files.push({ status: 'added', path: filePath });
    }
    return files;
  } catch (error) {
    throw new Error(`Git change discovery failed: ${error.stderr?.toString().trim() || error.message}`);
  }
}

const frontendRoot = path.resolve(__dirname, '..');

try {
  const options = changeOptions(process.argv.slice(2));
  const changedFiles = options.stdin ? changedFilesFromStdin() : changedFilesFromGit(frontendRoot, options.baseRef);
  const result = validateWidgetTestingContracts(frontendRoot, {
    changedFiles,
    designOnly: options.designOnly,
  });
  console.log(
    `Change scope: ${options.stdin ? 'explicit stdin' : `working tree against ${options.baseRef}`} (${
      changedFiles.length
    } paths).`
  );
  if (result.ledger?.length) {
    console.log('Widget coverage ledger:\n');
    for (const entry of result.ledger) {
      const { covered, shared, qa, decision, none, illegal } = entry.dispositions;
      console.log(
        `- ${entry.componentType} [${entry.status}] ${entry.scenarios} scenarios ` +
          `(${entry.verifiedScenarios} verified, ${entry.engineeringScenarios} engineering, ${entry.qaScenarios} QA-owned) | ` +
          `${entry.rows} disposed rows: ${covered} covered, ${shared} shared, ${qa} qa, ` +
          `${decision} decision, ${none} excluded, ${illegal} illegal | ${entry.openDecisions} open decisions`
      );
      for (const deferred of entry.deferredScenarios) {
        console.log(`  Deferred: ${deferred.id} — ${deferred.deferredBy || 'missing attribution'}`);
      }
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
  if (options.designOnly && result.scopeErrors.length) {
    console.warn(`Delivery scope blockers (${result.scopeErrors.length}; retained during design review):\n`);
    console.warn(result.scopeErrors.map((error) => `- ${error}`).join('\n'));
  }
  if (result.errors.length) {
    console.error(`Widget testing contract violations (${result.errors.length}):\n`);
    console.error(result.errors.map((error) => `- ${error}`).join('\n'));
    process.exit(1);
  }
  if (options.designOnly) {
    console.log('Widget contract design OK — run full validation after approval before delivery.');
  } else
    console.log(
      `Widget testing contracts OK — ${result.trackedWidgets} registered, ${result.approvedWidgets} approved ` +
        `(${result.partialWidgets} partial), ${result.pendingWidgets} queued for backfill.`
    );
} catch (error) {
  console.error(`Widget testing contract validation failed: ${error.message}`);
  process.exit(1);
}
