'use strict';

/**
 * Shared fixtures for the smoke and integration tests: a fake Cypress `on`
 * registrar and a canonical run lifecycle (1 spec, 1 failing test, a DOM
 * snapshot arriving via the task, and a failure screenshot).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// 1x1 transparent PNG
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5CYII=',
  'base64'
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeTempProject(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clr-smoke-'));
  fs.writeFileSync(path.join(dir, 'clr.config.json'), JSON.stringify(config));
  return dir;
}

function fakeRegistrar() {
  const handlers = {};
  return {
    on: (event, fn) => {
      handlers[event] = fn;
    },
    handlers,
  };
}

/**
 * Fires the full Cypress lifecycle against captured handlers:
 * before:run → before:spec → clr:events task batch (test:start, artifact:dom,
 * test:attempt:end) → after:screenshot → after:spec → after:run.
 * Resolves once after:run (the bounded final flush) completes.
 */
async function fireLifecycle(handlers, screenshotPath) {
  await handlers['before:run']({
    specs: [{ relative: 'cypress/e2e/login.cy.js' }],
    browser: { name: 'chrome', version: '126.0' },
    cypressVersion: '13.7.0',
  });

  handlers['before:spec']({ relative: 'cypress/e2e/login.cy.js' });

  handlers['task']['clr:events']([
    {
      type: 'test:start',
      testId: 'login > shows an error on bad password',
      title: 'shows an error on bad password',
      attempt: 1,
      state: 'running',
      ts: new Date().toISOString(),
    },
    {
      type: 'artifact:dom',
      testId: 'login > shows an error on bad password',
      attempt: 1,
      html: '<!DOCTYPE html>\n<html><body><h1>boom</h1></body></html>',
      pageUrl: 'http://localhost:3000/login',
      viewportWidth: 1280,
      viewportHeight: 720,
    },
    {
      type: 'test:attempt:end',
      testId: 'login > shows an error on bad password',
      state: 'failed',
      attempt: 1,
      willRetry: false,
      duration: 137,
      error: 'expected error banner',
    },
  ]);

  const details = {
    path: screenshotPath,
    // real Cypress hands failure screenshots EMPTY titles — the plugin must
    // still attribute this to the running test via its test:start tracking
    titles: [],
    name: 'login -- shows an error on bad password (failed) (attempt 2)',
    dimensions: { width: 1, height: 1 },
    takenAt: new Date().toISOString(),
    specName: 'login.cy.js',
  };
  const returned = handlers['after:screenshot'](details);

  handlers['after:spec'](
    { relative: 'cypress/e2e/login.cy.js' },
    {
      stats: { duration: 900, tests: 1, passes: 0, failures: 1, pending: 0, skipped: 0 },
      tests: [
        {
          title: ['login', 'shows an error on bad password'],
          state: 'failed',
          displayError: 'AssertionError: expected error banner',
          attempts: [{ state: 'failed', duration: 137 }],
        },
      ],
      video: null,
    }
  );

  const flushStart = Date.now();
  await handlers['after:run']({
    totalFailed: 1,
    totalPassed: 0,
    totalPending: 0,
    totalSkipped: 0,
    totalTests: 1,
    totalDuration: 1200,
    runs: [{}],
  });
  return { details, returned, flushMs: Date.now() - flushStart };
}

module.exports = { PNG_BYTES, sleep, makeTempProject, fakeRegistrar, fireLifecycle };
