import { execFile, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Session } from './session';
import { collectProjectSource, readSourceState } from './source-upload';
import { hashProjectSource } from './source-sync';

/*
  Security scans of an app project with @tooljet/app-scanner. The scanner is an ES module, so it
  runs as a child process: `node <scanner>/bin/tj-app-scan.js <project> --sarif ... --summary ... --dependencies ...`.

  check    scans locally and prints findings (`--sarif`, `--json`)
  dev      scans each build and uploads the SARIF and packages (source "dev"); never blocks the build
  publish  asks the server for the authoritative scan (stored source, else this project) and refuses on a failing
           gate unless --allow-findings; the server decides the release gate either way
*/

export interface ScanFinding {
  ruleId: string;
  severity: string;
  message: string;
  location: string;
  tool: string;
  blocking?: boolean;
  /** name@version, for dependency findings. */
  package?: string;
}

export interface LocalScan {
  sarif: { runs: any[] };
  summary: {
    gate: 'pass' | 'fail';
    counts: Record<string, number>;
    notRun: { id: string; reason?: string }[];
    tools: { name: string; version: string }[];
    blocking: unknown[];
  };
  dependencies: { name: string; version: string; license?: string; direct?: boolean; dev?: boolean }[];
}

/** The scanner isn't on this computer: nothing is known about the code, so nothing is reported about it. */
export class ScannerNotInstalledError extends Error {}

export function scannerBin(): string {
  if (process.env.TOOLJET_APP_SCANNER_BIN) return process.env.TOOLJET_APP_SCANNER_BIN;
  // The scanner ships with ToolJet's enterprise server, not with the CLI: install @tooljet/app-scanner beside the CLI or
  // point TOOLJET_APP_SCANNER_BIN at its bin. The package's main is src/index.js; the bin sits next to src.
  try {
    return path.join(path.dirname(require.resolve('@tooljet/app-scanner')), '..', 'bin', 'tj-app-scan.js');
  } catch {
    throw new ScannerNotInstalledError(
      "The security scanner isn't on this computer, so this code wasn't scanned here. ToolJet scans it when you publish. " +
        'To scan here, set TOOLJET_APP_SCANNER_BIN to its tj-app-scan.js, or install @tooljet/app-scanner.'
    );
  }
}

export async function scanProject(
  root: string,
  options: { offline?: boolean; policyFile?: string; sarifOut?: string } = {}
): Promise<LocalScan> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-scan-'));
  try {
    const sarif = path.join(dir, 'out.sarif');
    const summary = path.join(dir, 'summary.json');
    const dependencies = path.join(dir, 'dependencies.json');
    const args = [scannerBin(), root, '--sarif', sarif, '--summary', summary, '--dependencies', dependencies, '--json'];
    if (options.offline) args.push('--offline');
    if (options.policyFile) args.push('--policy', options.policyFile);
    await new Promise<void>((resolve, reject) => {
      execFile(process.execPath, args, { maxBuffer: 32 * 1024 * 1024, timeout: 180_000 }, (error, _stdout, stderr) => {
        // Exit 1 means the scan ran and its gate failed; a crash also exits 1, but writes no report.
        const code = (error as unknown as { code?: number | string } | null)?.code;
        if (!error || (code === 1 && fs.existsSync(sarif))) return resolve();
        reject(new Error(`The security scan did not run: ${String(stderr).trim() || error.message}`));
      });
    });
    const result: LocalScan = {
      sarif: JSON.parse(fs.readFileSync(sarif, 'utf8')),
      summary: JSON.parse(fs.readFileSync(summary, 'utf8')),
      dependencies: JSON.parse(fs.readFileSync(dependencies, 'utf8')),
    };
    if (options.sarifOut) fs.writeFileSync(options.sarifOut, `${JSON.stringify(result.sarif, null, 2)}\n`);
    return result;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Every result of a SARIF log, most severe first. */
export function findingsFromSarif(sarif: { runs?: any[] }): ScanFinding[] {
  const out: ScanFinding[] = [];
  for (const run of sarif.runs ?? []) {
    for (const r of run.results ?? []) {
      if (r.suppressions?.length) continue;
      const loc = r.locations?.[0]?.physicalLocation;
      out.push({
        ruleId: r.ruleId,
        severity: r.properties?.severity ?? 'medium',
        message: r.message?.text ?? '',
        location: loc ? `${loc.artifactLocation?.uri}${loc.region?.startLine ? `:${loc.region.startLine}` : ''}` : '',
        tool: `${run.tool?.driver?.name} ${run.tool?.driver?.version}`,
        blocking: r.properties?.blocking,
        ...(r.properties?.package ? { package: `${r.properties.package}@${r.properties.version}` } : {}),
      });
    }
  }
  return out.sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9));
}

/** Open findings from the server's version status, of one scan source when given (the status merges every source). */
export function findingsFromStatus(status: { findings?: any[] }, source?: string): ScanFinding[] {
  return (status.findings ?? [])
    .filter((f) => f.status === 'open' && (!source || f.source === source))
    .map((f) => ({
      ruleId: f.ruleId,
      severity: f.severity,
      message: f.message,
      location: f.location?.uri
        ? `${f.location.uri}${f.location.line ? `:${f.location.line}` : ''}`
        : f.location?.logical ?? '',
      tool: `${f.tool} ${f.toolVersion}`,
      blocking: f.blocking,
    }));
}

export const formatFinding = (f: ScanFinding): string =>
  `${f.severity.toUpperCase().padEnd(8)} ${f.ruleId}${f.blocking ? ' [blocks release]' : ''}\n         ${
    f.location
  }\n         ${f.message}`;

export const countsLine = (counts: Record<string, number>): string =>
  ['critical', 'high', 'medium', 'low'].map((s) => `${counts[s] ?? 0} ${s}`).join(', ');

/** The checks a project scan runs; a scan that did not complete reports each of them as not run. */
export const PROJECT_CHECKS = [
  'code-lint',
  'secrets',
  'osv',
  'new-release',
  'lockfile',
  'licenses',
  'dependency-policy',
  'vendored',
];

/** A scan that did not complete, as SARIF the server stores as failed: every check errored, with the reason. */
export function failedScanSarif(reason: string, checkIds: string[] = PROJECT_CHECKS): { version: string; runs: any[] } {
  return {
    version: '2.1.0',
    runs: checkIds.map((checkId) => ({
      tool: { driver: { name: 'tooljet-app-scanner', version: 'unknown', rules: [] } },
      invocations: [
        { executionSuccessful: false, toolExecutionNotifications: [{ level: 'error', message: { text: reason } }] },
      ],
      results: [],
      properties: { checkId, status: 'error', reason, scanFailed: true },
    })),
  };
}

/** "Scan failed" and its reason from the server's version status (of one source when given), or null. */
export const failureLine = (
  status: { failure?: { source?: string; reason: string; failedChecks?: { checkId: string }[] } | null },
  source?: string
) =>
  status.failure && (!source || status.failure.source === source)
    ? `Scan failed: ${status.failure.reason}${
        status.failure.failedChecks?.length
          ? ` (${status.failure.failedChecks.map((c) => c.checkId).join(', ')} did not finish)`
          : ' (no check finished)'
      }`
    : null;

/*
  Which stored code a scan is of: the revision and content hash of the project's last pull or push
  (.tooljet/source.json), sent only when that state is for this version and the files scanned are exactly that code.
  ToolJet counts an upload toward a required scanner only with a matching identity, and refuses a mismatch (409), so a
  copy with local changes not yet stored sends none: its scan is shown, but proves nothing about the stored code.
*/
export function scannedSourceIdentity(
  root: string,
  versionId: string
): { sourceRevision: number; sourceContentHash: string } | undefined {
  const state = readSourceState(root);
  if (!state || state.versionId !== versionId || !state.contentHash) return undefined;
  try {
    if (hashProjectSource(root) !== state.contentHash) return undefined;
  } catch {
    return undefined;
  }
  return { sourceRevision: state.revision, sourceContentHash: state.contentHash };
}

/** Upload a scan to the app version (source dev or publish), with the project's packages and, given the project root, the stored code it is of. */
export function uploadScan(
  session: Session,
  target: { appId: string; versionId: string; root?: string },
  scan: Pick<LocalScan, 'sarif'> & Partial<Pick<LocalScan, 'dependencies'>>,
  source: 'dev' | 'ci'
): Promise<any> {
  const identity = target.root ? scannedSourceIdentity(target.root, target.versionId) : undefined;
  return session.api(`/apps/${target.appId}/versions/${target.versionId}/scan-results`, {
    method: 'POST',
    body: { source, sarif: scan.sarif, dependencies: scan.dependencies, ...(identity ?? {}) },
  });
}

/** The authoritative scan at publish: the server scans the version's stored source, else these files. */
export function requestPublishScan(
  session: Session,
  target: { appId: string; versionId: string; root: string }
): Promise<any> {
  return session.api(`/apps/${target.appId}/versions/${target.versionId}/security/publish-scan`, {
    method: 'POST',
    body: { files: collectProjectSource(target.root) },
  });
}

/** name@version for a spec (name, name@range, name@tag), resolved by npm so the project's .npmrc registry applies. */
export function resolvePackageSpec(spec: string, cwd: string): { name: string; version: string } {
  const at = spec.lastIndexOf('@');
  const name = at > 0 ? spec.slice(0, at) : spec;
  const out = execFileSync('npm', ['view', spec, 'version', '--json'], {
    cwd,
    encoding: 'utf8',
    timeout: 60_000,
  }).trim();
  if (!out) throw new Error(`${spec}: no such package or version`);
  const parsed = JSON.parse(out);
  const version = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
  if (typeof version !== 'string') throw new Error(`${spec}: no such package or version`);
  return { name, version };
}

/** Dependency checks only (malware, CVEs, cooldown, licence, blocklist) for packages about to be added. */
export async function vetPackages(
  packages: { name: string; version: string }[],
  options: { offline?: boolean; policyFile?: string } = {}
): Promise<Omit<LocalScan, 'dependencies'>> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-vet-'));
  try {
    const list = path.join(dir, 'packages.json');
    const sarif = path.join(dir, 'out.sarif');
    const summary = path.join(dir, 'summary.json');
    fs.writeFileSync(list, JSON.stringify(packages.map((p) => ({ ...p, direct: true }))));
    const args = [scannerBin(), '--packages', list, '--sarif', sarif, '--summary', summary, '--json'];
    if (options.offline) args.push('--offline');
    if (options.policyFile) args.push('--policy', options.policyFile);
    await new Promise<void>((resolve, reject) => {
      execFile(process.execPath, args, { maxBuffer: 32 * 1024 * 1024, timeout: 180_000 }, (error, _stdout, stderr) => {
        const code = (error as unknown as { code?: number | string } | null)?.code;
        if (!error || (code === 1 && fs.existsSync(sarif))) return resolve();
        reject(new Error(`The package check did not run: ${String(stderr).trim() || error.message}`));
      });
    });
    return { sarif: JSON.parse(fs.readFileSync(sarif, 'utf8')), summary: JSON.parse(fs.readFileSync(summary, 'utf8')) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
