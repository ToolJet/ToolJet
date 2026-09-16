'use strict';

/**
 * Smoke test for cypress-live-reporter. Plain Node, no framework, no network
 * dependencies beyond localhost.
 *
 * Scenarios:
 *   A. Full lifecycle against a LOCAL capture server — asserts payload
 *      contents (runId override, monotonic seq, DOM gzip round-trip,
 *      screenshot base64, details passthrough).
 *   B. Same lifecycle against an UNREACHABLE webhook — asserts no crash and
 *      that the final flush completes within its hard cap.
 *   C. No sink env vars — asserts exactly one warning + self-disable.
 *
 * Run: node tools/cypress-live-reporter/test/smoke.js
 */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const { PNG_BYTES, sleep, makeTempProject, fakeRegistrar, fireLifecycle } = require('./helpers');
const { livePlugin } = require('../plugin');

let failures = 0;
process.on('unhandledRejection', (err) => {
  console.error('FAIL: unhandled rejection escaped the plugin:', err);
  failures++;
});
process.on('uncaughtException', (err) => {
  console.error('FAIL: uncaught exception escaped the plugin:', err);
  process.exit(1);
});

function ok(name, fn) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL - ${name}: ${err.message}`);
  }
}

async function scenarioCaptureServer(projectRoot, screenshotPath) {
  console.log('\nScenario A: full lifecycle against a local capture server');
  const received = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        received.push(JSON.parse(body));
      } catch (e) {
        /* ignore */
      }
      res.writeHead(200);
      res.end('{}');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const RUN_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  process.env.CLR_WEBHOOK_URL = `http://127.0.0.1:${port}/hook`;
  process.env.CLR_WEBHOOK_TOKEN = 'secret-token';
  process.env.CLR_RUN_ID = RUN_ID;
  process.env.GITHUB_ACTOR = 'octocat';
  process.env.GITHUB_REF = 'refs/pull/42/merge';
  delete process.env.CLR_PG_URL;

  const { on, handlers } = fakeRegistrar();
  const config = { projectRoot, env: {} };
  const returnedConfig = livePlugin(on, config);

  ok('livePlugin returns the config object', () => assert.strictEqual(returnedConfig, config));
  ok('browser slice injected into config.env.clr', () => {
    assert.strictEqual(config.env.clr.enabled, true);
    assert.strictEqual(config.env.clr.events.liveTests, true);
    assert.strictEqual(config.env.clr.dom.enabled, true);
  });
  ok('task map exposed as config.__clrTasks', () =>
    assert.strictEqual(typeof config.__clrTasks['clr:events'], 'function')
  );
  ok('all lifecycle handlers registered', () => {
    for (const evt of ['before:run', 'before:spec', 'after:spec', 'after:run', 'after:screenshot', 'task']) {
      assert.strictEqual(typeof handlers[evt], evt === 'task' ? 'object' : 'function', evt);
    }
  });

  const { details, returned } = await fireLifecycle(handlers, screenshotPath);
  ok('after:screenshot returns details unchanged', () => {
    assert.strictEqual(returned, details);
    assert.strictEqual(returned.path, screenshotPath);
  });

  // wait for all 8 events to arrive (run:start, spec:start, 3 task events,
  // screenshot, spec:end, run:end)
  const deadline = Date.now() + 5000;
  while (received.length < 8 && Date.now() < deadline) await sleep(50);
  server.close();

  ok('all 8 events delivered', () => assert.strictEqual(received.length, 8));
  ok('every event carries the CLR_RUN_ID override + ISO ts', () => {
    for (const ev of received) {
      assert.strictEqual(ev.runId, RUN_ID);
      assert.ok(!isNaN(Date.parse(ev.ts)), 'ts parses');
    }
  });
  ok('seq is monotonic and unique 1..8', () => {
    const seqs = received.map((e) => e.seq).sort((a, b) => a - b);
    assert.deepStrictEqual(seqs, [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  const byType = {};
  for (const ev of received) (byType[ev.type] = byType[ev.type] || []).push(ev);

  ok('run:start has specs/browser/ci', () => {
    const ev = byType['run:start'][0];
    assert.deepStrictEqual(ev.specs, ['cypress/e2e/login.cy.js']);
    assert.strictEqual(ev.totalSpecs, 1);
    assert.strictEqual(ev.browser.name, 'chrome');
    assert.strictEqual(typeof ev.ci.machine, 'string');
  });
  ok('run:start ci carries PR number + triggeredBy', () => {
    const ev = byType['run:start'][0];
    assert.strictEqual(ev.ci.pr, '42', 'PR parsed from refs/pull/42/merge');
    assert.strictEqual(ev.ci.triggeredBy, 'octocat', 'from GITHUB_ACTOR');
  });
  ok('artifact:dom was gzipped on Node (raw html removed, round-trips)', () => {
    const ev = byType['artifact:dom'][0];
    assert.strictEqual(ev.html, undefined);
    const html = zlib.gunzipSync(Buffer.from(ev.htmlGzipBase64, 'base64')).toString('utf8');
    assert.ok(html.includes('<h1>boom</h1>'));
    assert.strictEqual(ev.pageUrl, 'http://localhost:3000/login');
  });
  ok('artifact:screenshot maps to it-block + attempt despite empty titles', () => {
    const ev = byType['artifact:screenshot'][0];
    assert.strictEqual(Buffer.from(ev.base64, 'base64').length, PNG_BYTES.length);
    // titles were EMPTY — testId must come from the running test (test:start)
    assert.strictEqual(ev.testId, 'login > shows an error on bad password');
    assert.strictEqual(ev.attempt, 2, 'attempt parsed from "(attempt 2)" in path');
    assert.strictEqual(ev.width, 1);
  });
  ok('spec:end carries stats + per-test array', () => {
    const ev = byType['spec:end'][0];
    assert.strictEqual(ev.stats.failures, 1);
    assert.strictEqual(ev.tests[0].testId, 'login > shows an error on bad password');
    assert.strictEqual(ev.tests[0].attempts, 1);
  });
  ok('run:end has failed status + totals', () => {
    const ev = byType['run:end'][0];
    assert.strictEqual(ev.status, 'failed');
    assert.strictEqual(ev.totals.failed, 1);
  });

  delete process.env.CLR_RUN_ID;
  delete process.env.CLR_WEBHOOK_TOKEN;
  delete process.env.GITHUB_ACTOR;
  delete process.env.GITHUB_REF;
}

async function scenarioUnreachable(projectRoot, screenshotPath) {
  console.log('\nScenario B: full lifecycle against an unreachable webhook');
  // port 9 (discard) — nothing listens there
  process.env.CLR_WEBHOOK_URL = 'http://127.0.0.1:9/hook';
  delete process.env.CLR_PG_URL;

  const { on, handlers } = fakeRegistrar();
  const config = { projectRoot, env: {} };

  let flushMs = null;
  await (async () => {
    livePlugin(on, config);
    const result = await fireLifecycle(handlers, screenshotPath);
    flushMs = result.flushMs;
  })();

  ok('full lifecycle survives an unreachable sink without throwing', () => assert.ok(true));
  ok('final flush completes within finalFlushMs cap (3000ms + slack)', () => {
    assert.ok(flushMs !== null, 'after:run resolved');
    assert.ok(flushMs < 3000 + 2000, `flush took ${flushMs}ms`);
  });
}

async function scenarioSelfDisable() {
  console.log('\nScenario C: no sink env vars → warn once + self-disable');
  delete process.env.CLR_WEBHOOK_URL;
  delete process.env.CLR_PG_URL;

  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));

  const { on, handlers } = fakeRegistrar();
  const config = { projectRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'clr-smoke-')), env: {} };
  let returned;
  try {
    returned = livePlugin(on, config);
  } finally {
    console.warn = origWarn;
  }

  ok('returns config without throwing', () => assert.strictEqual(returned, config));
  ok('prints exactly one warning', () => {
    const clrWarnings = warnings.filter((w) => w.includes('cypress-live-reporter'));
    assert.strictEqual(clrWarnings.length, 1, `got: ${JSON.stringify(warnings)}`);
    assert.ok(clrWarnings[0].includes('disabled'));
  });
  ok('injects enabled:false so support.js stays inert', () =>
    assert.strictEqual(config.env.clr.enabled, false)
  );
  ok('registers no lifecycle handlers', () =>
    assert.strictEqual(Object.keys(handlers).length, 0)
  );
  ok('still exposes a no-op task map for merge safety', () =>
    assert.strictEqual(typeof config.__clrTasks['clr:events'], 'function')
  );
}

(async () => {
  const projectRoot = makeTempProject({
    performance: { finalFlushMs: 3000, timeoutMs: 1000 },
  });
  const screenshotPath = path.join(
    projectRoot,
    'login -- shows an error on bad password (failed) (attempt 2).png'
  );
  fs.writeFileSync(screenshotPath, PNG_BYTES);

  await scenarioCaptureServer(projectRoot, screenshotPath);
  await scenarioUnreachable(projectRoot, screenshotPath);
  await scenarioSelfDisable();

  // give any stray fire-and-forget promise a beat to surface as a rejection
  await sleep(300);

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll smoke tests passed.');
})();
