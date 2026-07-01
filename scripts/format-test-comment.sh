#!/usr/bin/env bash
# Reads jest JSON output files and emits a markdown PR comment.
# Env vars:
#   UNIT_JSON         path to unit test JSON (default /tmp/tj-unit-results.json)
#   E2E_JSON_DIR      dir containing shard-N.json e2e results (default /tmp/tj-e2e-json)
#   RUN_URL           full GHA run URL for the "Run #N" link
#   GITHUB_RUN_NUMBER GHA run number
set -euo pipefail

UNIT_JSON="${UNIT_JSON:-/tmp/tj-unit-results.json}"
E2E_JSON_DIR="${E2E_JSON_DIR:-/tmp/tj-e2e-json}"
RUN_URL="${RUN_URL:-}"
GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-?}"

node - <<'JSEOF'
const fs   = require('fs');
const path = require('path');

const UNIT_JSON        = process.env.UNIT_JSON        || '/tmp/tj-unit-results.json';
const E2E_JSON_DIR     = process.env.E2E_JSON_DIR     || '/tmp/tj-e2e-json';
const RUN_URL          = process.env.RUN_URL          || '';
const GITHUB_RUN_NUMBER = process.env.GITHUB_RUN_NUMBER || '?';

function extractModule(filePath) {
  const m = filePath.match(/test\/modules\/([^/]+)\//);
  return m ? m[1] : path.basename(path.dirname(filePath));
}

function statusIcon(status) {
  if (status === 'passed')  return '✅';
  if (status === 'failed')  return '❌';
  return '⏭';
}

function formatSection(data, label) {
  if (!data) return null;

  const rows     = [];
  const failures = [];

  for (const suite of data.testResults) {
    const mod = extractModule(suite.testFilePath);
    for (const t of suite.testResults) {
      const title = [...(t.ancestorTitles || []), t.title].join(' › ');
      rows.push(`| \`${mod}\` | ${title} | ${statusIcon(t.status)} |`);
      if (t.status === 'failed') {
        const msg = (t.failureMessages || []).join('\n').slice(0, 500);
        failures.push({ mod, title, msg });
      }
    }
  }

  const passed  = data.numPassedTests  || 0;
  const failed  = data.numFailedTests  || 0;
  const icon    = failed > 0 ? '❌' : '✅';
  const summary = `${icon} ${passed} passed · ${failed} failed`;

  let out = `### ${label} · ${summary}\n\n`;
  out += `| Module | Test | Result |\n|--------|------|--------|\n`;
  out += rows.join('\n') + '\n';

  if (failures.length > 0) {
    const plural = failures.length > 1 ? 'failures' : 'failure';
    out += `\n<details>\n<summary>${failures.length} ${plural}</summary>\n\n`;
    for (const f of failures) {
      out += `**${f.mod} › ${f.title}**\n\`\`\`\n${f.msg}\n\`\`\`\n\n`;
    }
    out += `</details>\n`;
  }

  return out;
}

// Load unit results
let unitData = null;
if (fs.existsSync(UNIT_JSON)) {
  try { unitData = JSON.parse(fs.readFileSync(UNIT_JSON, 'utf8')); } catch (_) {}
}

// Load and merge e2e shard results
let e2eData = null;
if (fs.existsSync(E2E_JSON_DIR)) {
  const shardFiles = fs.readdirSync(E2E_JSON_DIR)
    .filter(f => /^shard-\d+\.json$/.test(f))
    .sort();
  if (shardFiles.length > 0) {
    const merged = { testResults: [], numPassedTests: 0, numFailedTests: 0 };
    for (const f of shardFiles) {
      try {
        const shard = JSON.parse(fs.readFileSync(path.join(E2E_JSON_DIR, f), 'utf8'));
        merged.testResults.push(...(shard.testResults || []));
        merged.numPassedTests += shard.numPassedTests || 0;
        merged.numFailedTests += shard.numFailedTests || 0;
      } catch (_) {}
    }
    if (merged.testResults.length > 0) e2eData = merged;
  }
}

// Collect module names across all results
const modules = new Set();
for (const d of [unitData, e2eData].filter(Boolean)) {
  for (const s of d.testResults) modules.add(extractModule(s.testFilePath));
}
const moduleList = [...modules].sort().map(m => `\`${m}\``).join(', ') || '_all_';

const runRef = RUN_URL
  ? `[#${GITHUB_RUN_NUMBER}](${RUN_URL})`
  : `#${GITHUB_RUN_NUMBER}`;

let out = `<!-- tj-test-results -->\n`;
out += `## 🧪 Server Test Results\n\n`;
out += `> **Modules tested:** ${moduleList} · **Run:** ${runRef}\n\n`;
out += `---\n\n`;

const unitSection = formatSection(unitData, 'Unit Tests');
const e2eSection  = formatSection(e2eData,  'E2e Tests');

out += unitSection || '_No unit test results found._\n\n';
if (e2eSection) out += '\n' + e2eSection + '\n';

process.stdout.write(out);
JSEOF
