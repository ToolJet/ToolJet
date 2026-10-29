#!/usr/bin/env node
// Older reports omitted untouched AI sources. Count those sources as uncovered in
// the baseline too, but only when their Git blobs are unchanged. New/changed code
// still faces the original overall floor and patch requirements.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export function repositoryPath(file) {
  const normalized = file.replaceAll('\\', '/');
  if (normalized.startsWith('server/')) return normalized;
  const marker = normalized.lastIndexOf('/server/');
  if (marker >= 0) return normalized.slice(marker + 1);
  if (/^(src|ee)\//.test(normalized)) return `server/${normalized}`;
  throw new Error(`Unrecognized server coverage path: ${file}`);
}

function percentage(covered, total) {
  return total === 0 ? 100 : Math.floor((covered / total) * 10000) / 100;
}

export function normalizeBaseline(baseline, current, eligibleFiles) {
  const result = structuredClone(baseline);
  if (!result.total?.lines || !current.total?.lines) throw new Error('Missing coverage totals');
  const existing = new Set(
    Object.keys(result)
      .filter((key) => key !== 'total')
      .map(repositoryPath)
  );
  const eligible = new Set(eligibleFiles);
  const added = [];
  for (const [file, coverage] of Object.entries(current)) {
    if (file === 'total') continue;
    const relative = repositoryPath(file);
    if (existing.has(relative) || !eligible.has(relative)) continue;
    const zero = {};
    for (const metric of ['lines', 'statements', 'functions', 'branches']) {
      const total = coverage[metric]?.total;
      const aggregate = result.total[metric];
      if (
        !Number.isSafeInteger(total) ||
        total < 0 ||
        !Number.isSafeInteger(aggregate?.total) ||
        !Number.isSafeInteger(aggregate?.covered)
      )
        throw new Error(`Invalid ${metric} counts for ${relative}`);
      zero[metric] = { total, covered: 0, skipped: 0, pct: percentage(0, total) };
      aggregate.total += total;
      aggregate.pct = percentage(aggregate.covered, aggregate.total);
    }
    result[relative] = zero;
    existing.add(relative);
    added.push(relative);
  }
  return { summary: result, added };
}

export function unchangedFiles(files, root, baselineCommit, enterpriseRoot, enterpriseCommit) {
  const blob = (cwd, commit, file) => {
    try {
      return execFileSync('git', ['-C', cwd, 'rev-parse', '--verify', `${commit}:${file}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return null;
    }
  };
  return files.filter((file) => {
    const enterprise = file.startsWith('server/ee/');
    const cwd = enterprise ? enterpriseRoot : root;
    const relative = enterprise ? file.slice('server/ee/'.length) : file;
    const before = blob(cwd, enterprise ? enterpriseCommit : baselineCommit, relative);
    return before !== null && before === blob(cwd, 'HEAD', relative);
  });
}

async function main() {
  const [currentFile, output] = process.argv.slice(2);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const repository = process.env.GITHUB_REPOSITORY;
  const branch = process.env.BASE_REF;
  if (!currentFile || !output || !repository || !branch || !process.env.GH_TOKEN) {
    throw new Error('Expected current-summary output-directory, GITHUB_REPOSITORY, BASE_REF and GH_TOKEN');
  }
  const apiRoot = process.env.GITHUB_API_URL || 'https://api.github.com';
  const api = async (resource, binary = false) => {
    const response = await fetch(`${apiRoot}/repos/${repository}/${resource}`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`Coverage baseline API returned ${response.status}`);
    return binary ? Buffer.from(await response.arrayBuffer()) : response.json();
  };
  const runs = await api(`actions/workflows/ci.yml/runs?branch=${encodeURIComponent(branch)}&event=push&per_page=20`);
  let baseline;
  let baselineRun;
  const localRequire = createRequire(path.join(root, 'server/package.json'));
  const JSZip = localRequire('jszip');
  for (const run of runs.workflow_runs) {
    const artifacts = await api(`actions/runs/${run.id}/artifacts?per_page=100`);
    const artifact = artifacts.artifacts.find((item) => item.name === 'coverage-summary' && !item.expired);
    if (!artifact) continue;
    const archive = await JSZip.loadAsync(await api(`actions/artifacts/${artifact.id}/zip`, true));
    const entries = Object.values(archive.files).filter(
      (entry) => !entry.dir && /(^|\/)coverage-summary\.json$/.test(entry.name)
    );
    if (entries.length !== 1) throw new Error('Expected exactly one baseline coverage summary');
    baseline = JSON.parse(await entries[0].async('string'));
    baselineRun = run;
    break;
  }
  fs.mkdirSync(output, { recursive: true });
  if (!baseline) {
    fs.writeFileSync(path.join(output, 'baseline-scope.json'), JSON.stringify({ baselineAvailable: false }));
    console.log('No baseline coverage artifact exists for the base branch.');
    return;
  }
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
  const ensureCommit = (cwd, commit) => {
    if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid baseline commit');
    try {
      git(cwd, 'cat-file', '-e', `${commit}^{commit}`);
    } catch {
      git(cwd, 'fetch', '--no-tags', '--depth=1', 'origin', commit);
    }
  };
  ensureCommit(root, baselineRun.head_sha);
  const ee = path.join(root, 'server/ee');
  const oldPin = git(root, 'rev-parse', `${baselineRun.head_sha}:server/ee`);
  ensureCommit(ee, oldPin);
  const { sourceFiles } = createRequire(import.meta.url)('./ai-test-scope.cjs');
  const eligible = unchangedFiles(
    sourceFiles('server', 'ee').map((file) => `server/${file}`),
    root,
    baselineRun.head_sha,
    ee,
    oldPin
  );
  const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));
  const { summary, added } = normalizeBaseline(baseline, current, eligible);
  fs.writeFileSync(path.join(output, 'coverage-summary.json'), JSON.stringify(summary));
  fs.writeFileSync(
    path.join(output, 'baseline-scope.json'),
    JSON.stringify(
      {
        baselineAvailable: true,
        runId: baselineRun.id,
        commit: baselineRun.head_sha,
        originalLines: baseline.total.lines,
        comparableLines: summary.total.lines,
        addedUnchangedAiFiles: added,
      },
      null,
      2
    )
  );
  console.log(
    `Baseline run ${baselineRun.id}: ${added.length} unchanged, previously omitted AI files counted as uncovered; ${baseline.total.lines.pct}% -> ${summary.total.lines.pct}%. Thresholds unchanged.`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
