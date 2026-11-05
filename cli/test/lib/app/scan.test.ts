import nock = require('nock');
import { expect } from 'chai';
import * as fs from 'fs';
import Module = require('module');
import * as os from 'os';
import * as path from 'path';

import {
  findingsFromSarif,
  failedScanSarif,
  failureLine,
  findingsFromStatus,
  requestPublishScan,
  scanProject,
  uploadScan,
  vetPackages,
  scannerBin,
  ScannerNotInstalledError,
} from '../../../src/lib/app/scan';
import { Session } from '../../../src/lib/app/session';

// The scanner is not part of the CLI: these run when TOOLJET_APP_SCANNER_BIN points at one, against its own fixture
// projects (test/fixtures/projects beside its bin).
const SCANNER_BIN = process.env.TOOLJET_APP_SCANNER_BIN;
const FIXTURES = SCANNER_BIN ? path.resolve(path.dirname(SCANNER_BIN), '../test/fixtures/projects') : '';
const BASE_URL = 'https://tooljet.test';

const session = (): Session =>
  ({
    url: BASE_URL,
    kind: 'session',
    api: async (p: string, init: { method?: string; body?: unknown } = {}) => {
      const res = await fetch(`${BASE_URL}/api${p}`, {
        method: init.method ?? 'GET',
        headers: { 'content-type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      return res.json();
    },
  } as unknown as Session);

describe('app security scan', function () {
  before(function () {
    if (!SCANNER_BIN) this.skip();
  });

  it('scans a project with the real scanner, offline: findings, gate, not-run checks and packages', async () => {
    const scan = await scanProject(path.join(FIXTURES, 'unsafe-app'), { offline: true });
    expect(scan.summary.gate).to.equal('fail');
    expect(scan.summary.notRun.map((n) => n.id).sort()).to.deep.equal(['new-release', 'osv', 'vendored']);
    const findings = findingsFromSarif(scan.sarif);
    expect(findings[0].severity).to.equal('critical');
    expect(findings.map((f) => f.ruleId)).to.include.members([
      'tj-code/no-external-fetch',
      'secretlint/database-connection-string',
    ]);
    expect(findings.find((f) => f.ruleId === 'tj-code/no-external-fetch')?.location).to.match(
      /^frontend\/src\/Exfil\.tsx:\d+$/
    );
    expect(scan.dependencies.map((d) => d.name)).to.include('react');
  });

  it('writes SARIF when asked, and passes the safe project', async () => {
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tj-scan-')), 'scan.sarif');
    const scan = await scanProject(path.join(FIXTURES, 'safe-app'), { offline: true, sarifOut: out });
    expect(scan.summary.gate).to.equal('pass');
    expect(JSON.parse(fs.readFileSync(out, 'utf8')).version).to.equal('2.1.0');
  });

  it('uploads a dev scan with its packages to the app version', async () => {
    const scan = await scanProject(path.join(FIXTURES, 'safe-app'), { offline: true });
    let body: { source?: string; dependencies?: unknown[]; sarif?: { version?: string } } = {};
    nock(BASE_URL)
      .post('/api/apps/app-1/versions/v-1/scan-results', (b) => {
        body = b;
        return true;
      })
      .reply(201, { gate: 'pass' });
    await uploadScan(session(), { appId: 'app-1', versionId: 'v-1' }, scan, 'dev');
    expect(body.source).to.equal('dev');
    expect(body.sarif?.version).to.equal('2.1.0');
    expect(body.dependencies).to.have.length(6);
  });

  it('sends the project files for the publish scan and reads blocking findings from the status', async () => {
    let files: { path: string }[] = [];
    nock(BASE_URL)
      .post('/api/apps/app-1/versions/v-1/security/publish-scan', (b) => {
        files = b.files;
        return true;
      })
      .reply(200, {
        gate: 'fail',
        findings: [
          {
            ruleId: 'tj-code/no-external-fetch',
            severity: 'high',
            status: 'open',
            source: 'dev',
            blocking: true,
            message: 'm',
            tool: 'eslint',
            toolVersion: '9',
            location: { uri: 'frontend/src/App.tsx', line: 3 },
          },
          {
            ruleId: 'x',
            severity: 'low',
            status: 'exception',
            blocking: false,
            message: 'm',
            tool: 't',
            toolVersion: '1',
            location: {},
          },
        ],
      });
    const status = await requestPublishScan(session(), {
      appId: 'app-1',
      versionId: 'v-1',
      root: path.join(FIXTURES, 'safe-app'),
    });
    expect(files.map((f) => f.path)).to.include.members(['app.json', 'frontend/package.json', 'frontend/src/App.tsx']);
    expect(findingsFromStatus(status)).to.deep.equal([
      {
        ruleId: 'tj-code/no-external-fetch',
        severity: 'high',
        message: 'm',
        location: 'frontend/src/App.tsx:3',
        tool: 'eslint 9',
        blocking: true,
      },
    ]);
    // The status merges every scan source; publish lists only its own.
    expect(findingsFromStatus(status, 'publish')).to.deep.equal([]);
  });

  it('vets packages before they are added: the blocklist fails the gate, network checks report not run offline', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-vet-'));
    const policy = path.join(dir, 'policy.json');
    fs.writeFileSync(policy, JSON.stringify({ dependencies: { block: ['event-stream@3.3.6'] } }));
    const blocked = await vetPackages([{ name: 'event-stream', version: '3.3.6' }], {
      offline: true,
      policyFile: policy,
    });
    expect(blocked.summary.gate).to.equal('fail');
    const finding = findingsFromSarif(blocked.sarif).find((f) => f.ruleId === 'tj-deps/blocked-package');
    expect(finding).to.include({ severity: 'high', blocking: true, package: 'event-stream@3.3.6' });
    expect(finding?.message).to.equal('event-stream@3.3.6 is on the workspace dependency blocklist.');
    expect(blocked.summary.notRun.map((n) => n.id).sort()).to.deep.equal(['licenses', 'new-release', 'osv']);
    const fine = await vetPackages([{ name: 'react', version: '18.3.1' }], { offline: true, policyFile: policy });
    expect(fine.summary.gate).to.equal('pass');
  });

  describe('a scan that does not complete', () => {
    const previous = process.env.TOOLJET_APP_SCANNER_BIN;
    afterEach(() => {
      if (previous === undefined) delete process.env.TOOLJET_APP_SCANNER_BIN;
      else process.env.TOOLJET_APP_SCANNER_BIN = previous;
    });

    it('reports a scanner crash (exit 1 without a report) instead of reading a missing file', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-fake-scanner-'));
      const bin = path.join(dir, 'scan.js');
      fs.writeFileSync(bin, `console.error('Cannot find package "acorn"'); process.exit(1);`);
      process.env.TOOLJET_APP_SCANNER_BIN = bin;
      let message = '';
      await scanProject(path.join(FIXTURES, 'safe-app'), { offline: true }).catch((err) => (message = err.message));
      expect(message).to.equal('The security scan did not run: Cannot find package "acorn"');
    });

    it('uploads as every check errored with the reason, and reads back as "Scan failed"', () => {
      const sarif = failedScanSarif('Cannot find package "acorn"');
      expect(sarif.runs.map((r) => r.properties.checkId)).to.include.members(['code-lint', 'secrets', 'osv']);
      expect(sarif.runs.every((r) => r.properties.status === 'error' && r.results.length === 0)).to.equal(true);
      expect(failureLine({ failure: { source: 'publish', reason: 'scanner stopped', failedChecks: [] } })).to.equal(
        'Scan failed: scanner stopped (no check finished)'
      );
      expect(
        failureLine({ failure: { source: 'dev', reason: 'OSV answered 503', failedChecks: [{ checkId: 'osv' }] } })
      ).to.equal('Scan failed: OSV answered 503 (osv did not finish)');
      expect(failureLine({ failure: { source: 'dev', reason: 'x' } }, 'publish')).to.equal(null);
      expect(failureLine({ failure: null })).to.equal(null);
    });
  });
});

describe('scannerBin', () => {
  it('tells a missing scanner apart from a scan that failed, and says ToolJet still scans on publish', () => {
    const saved = process.env.TOOLJET_APP_SCANNER_BIN;
    const loader = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
    const resolve = loader._resolveFilename;
    delete process.env.TOOLJET_APP_SCANNER_BIN;
    loader._resolveFilename = function (request, ...rest) {
      if (request === '@tooljet/app-scanner') throw new Error('not found');
      return resolve.call(this, request, ...rest);
    };
    try {
      expect(() => scannerBin()).to.throw(ScannerNotInstalledError, /ToolJet scans it when you publish/);
    } finally {
      loader._resolveFilename = resolve;
      if (saved !== undefined) process.env.TOOLJET_APP_SCANNER_BIN = saved;
    }
  });
});
