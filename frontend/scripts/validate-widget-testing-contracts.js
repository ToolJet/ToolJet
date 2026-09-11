#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validateWidgetTestingContracts } = require('../src/test/app-builder/widgetContractValidator');

function changedFilesFromStdin() {
  if (!process.argv.includes('--changed-files-stdin')) return [];
  return fs
    .readFileSync(0, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [statusOrPath, maybePath] = line.split('\t');
      return maybePath ? { status: statusOrPath, path: maybePath } : { status: 'modified', path: statusOrPath };
    });
}

const frontendRoot = path.resolve(__dirname, '..');

try {
  const result = validateWidgetTestingContracts(frontendRoot, { changedFiles: changedFilesFromStdin() });
  // The ledger prints on every run, before the exit check. A thin contract has
  // to be visible arithmetic: three sibling select widgets shipped 36, 28, and
  // 14 scenarios against comparable surfaces and nothing surfaced the gap.
  if (result.ledger?.length) {
    console.log('Widget coverage ledger:\n');
    for (const entry of result.ledger) {
      const { covered, shared, qa, decision, none, illegal } = entry.dispositions;
      console.log(
        `- ${entry.componentType} [${entry.status}] ${entry.scenarios} scenarios ` +
          `(${entry.verifiedScenarios} verified, ${entry.engineeringScenarios} engineering) | ` +
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
    `Widget testing contracts OK — ${result.trackedWidgets} registered, ${result.approvedWidgets} approved, ${result.pendingWidgets} queued for backfill.`
  );
} catch (error) {
  console.error(`Widget testing contract validation failed: ${error.message}`);
  process.exit(1);
}
