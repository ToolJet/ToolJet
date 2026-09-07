'use strict';

/**
 * Postgres integration test for cypress-live-reporter. Runs the full
 * lifecycle in pg mode against a REAL database and asserts what landed in
 * clr_events and what the dashboard views report.
 *
 * Requirements:
 *   - CLR_PG_URL pointing at a database with schema.sql applied
 *   - the `pg` package installed (npm install --no-save pg)
 *
 * Run: CLR_PG_URL=postgres://... node tools/cypress-live-reporter/test/integration-pg.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { PNG_BYTES, makeTempProject, fakeRegistrar, fireLifecycle } = require('./helpers');
const { livePlugin } = require('../plugin');

const PG_URL = process.env.CLR_PG_URL;
if (!PG_URL) {
  console.error('CLR_PG_URL is required for the integration test');
  process.exit(1);
}

const RUN_ID = process.env.CLR_RUN_ID || 'a3bb189e-8bf9-4888-9912-ace4e6543002';
process.env.CLR_RUN_ID = RUN_ID;
delete process.env.CLR_WEBHOOK_URL;

process.on('unhandledRejection', (err) => {
  console.error('FAIL: unhandled rejection escaped the plugin:', err);
  process.exit(1);
});

(async () => {
  const { Client } = require('pg');

  const projectRoot = makeTempProject({
    performance: { finalFlushMs: 8000, timeoutMs: 3000 },
  });
  const screenshotPath = path.join(
    projectRoot,
    'login -- shows an error on bad password (failed) (attempt 2).png'
  );
  fs.writeFileSync(screenshotPath, PNG_BYTES);

  const { on, handlers } = fakeRegistrar();
  const config = { projectRoot, env: {} };
  livePlugin(on, config);
  assert.strictEqual(config.env.clr.enabled, true, 'plugin active in pg mode');

  // fires before:run → ... → after:run; after:run awaits the bounded flush,
  // so by the time this resolves every event must be committed (or dropped)
  await fireLifecycle(handlers, screenshotPath);

  const client = new Client({ connectionString: PG_URL });
  await client.connect();
  try {
    // clean slate assertion guard: this test owns its RUN_ID rows
    const { rows: events } = await client.query(
      'SELECT seq, type FROM clr_events WHERE run_id = $1 ORDER BY seq',
      [RUN_ID]
    );
    assert.strictEqual(events.length, 8, `expected 8 events, got ${events.length}`);
    assert.deepStrictEqual(
      events.map((e) => e.seq),
      [1, 2, 3, 4, 5, 6, 7, 8],
      'seq is monotonic 1..8'
    );
    console.log('  ok - 8 events landed with monotonic seq');

    const { rows: runs } = await client.query(
      'SELECT status, total_specs, failed, browser FROM clr_runs WHERE run_id = $1',
      [RUN_ID]
    );
    assert.strictEqual(runs.length, 1);
    assert.strictEqual(runs[0].status, 'failed');
    assert.strictEqual(runs[0].total_specs, 1);
    assert.strictEqual(runs[0].failed, 1);
    assert.strictEqual(runs[0].browser, 'chrome');
    console.log('  ok - clr_runs reports the run as failed with totals');

    const { rows: tests } = await client.query(
      'SELECT state, attempt, error FROM clr_tests_live WHERE run_id = $1',
      [RUN_ID]
    );
    assert.strictEqual(tests.length, 1);
    assert.strictEqual(tests[0].state, 'failed');
    assert.strictEqual(tests[0].attempt, 1);
    assert.strictEqual(tests[0].error, 'expected error banner');
    console.log('  ok - clr_tests_live shows the failed test');

    const { rows: specs } = await client.query(
      'SELECT status, failures FROM clr_specs WHERE run_id = $1',
      [RUN_ID]
    );
    assert.strictEqual(specs[0].status, 'failed');
    assert.strictEqual(specs[0].failures, 1);
    console.log('  ok - clr_specs shows the failed spec');

    const { rows: arts } = await client.query(
      'SELECT type, screenshot_base64, dom_gzip_base64, page_url FROM clr_artifacts WHERE run_id = $1 ORDER BY seq',
      [RUN_ID]
    );
    const dom = arts.find((a) => a.type === 'artifact:dom');
    const html = zlib.gunzipSync(Buffer.from(dom.dom_gzip_base64, 'base64')).toString('utf8');
    assert.ok(html.includes('<h1>boom</h1>'), 'DOM gunzips back from jsonb');
    assert.strictEqual(dom.page_url, 'http://localhost:3000/login');
    const shot = arts.find((a) => a.type === 'artifact:screenshot');
    assert.strictEqual(Buffer.from(shot.screenshot_base64, 'base64').length, PNG_BYTES.length);
    console.log('  ok - clr_artifacts holds gunzippable DOM + screenshot base64');

    // idempotency: replaying a (run_id, seq) pair must be a no-op
    await client.query(
      `INSERT INTO clr_events (run_id, seq, type, ts, payload)
       VALUES ($1, 1, 'run:start', now(), '{"dup":true}')
       ON CONFLICT (run_id, seq) DO NOTHING`,
      [RUN_ID]
    );
    const { rows: after } = await client.query(
      'SELECT count(*)::int AS n FROM clr_events WHERE run_id = $1',
      [RUN_ID]
    );
    assert.strictEqual(after[0].n, 8, 'duplicate (run_id, seq) insert was a no-op');
    console.log('  ok - (run_id, seq) idempotency holds');
  } finally {
    await client.end();
  }

  console.log('\npg integration: all assertions passed');
})().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
