/**
 * Two-level transaction isolation for test specs.
 *
 * Suite transaction (beforeAll/afterAll): wraps the entire spec — beforeAll
 * seed data + all tests. ROLLBACK in afterAll undoes everything.
 *
 * Test savepoints (beforeEach/afterEach): isolate individual tests within the
 * suite. beforeEach seed data builds on top of beforeAll data, then rolls back.
 *
 * The suite transaction starts lazily in the first beforeEach (after the spec's
 * beforeAll has called initTestApp and set up the DataSource).
 */
import {
  rollbackSuiteTransaction,
  beginTestTransaction,
  rollbackTestTransaction,
  closeAllCachedApps,
  destroyAllDataSources,
} from './helpers/setup';

// Capture esbuild ref at load time — require() fails after Jest tears down the module env.
let esbuildRef: { stop: () => void } | undefined;
try {
  esbuildRef = require('esbuild');
} catch {
  /* no-op */
}

// Deferred shutdown: after the last spec file in the worker, destroy
// DataSources so the worker can exit. If another spec starts before
// the timer fires, the timer is cancelled.
let _shutdownTimer: ReturnType<typeof setTimeout> | undefined;

// NOTE: No beforeAll hook for beginSuiteTransaction(). It starts lazily inside
// beginTestTransaction() on the first call. This is because setupFilesAfterEnv
// beforeAll runs BEFORE the spec's beforeAll (where initTestApp sets up the
// DataSource). The lazy start waits until the DataSource is available.
beforeEach(async () => {
  if (_shutdownTimer) {
    clearTimeout(_shutdownTimer);
    _shutdownTimer = undefined;
  }
  try {
    await beginTestTransaction();
  } catch (e) {
    console.error('[TXN] beginTestTransaction FAILED:', (e as Error).message);
  }
});

afterEach(async () => {
  try {
    await rollbackTestTransaction();
  } catch (e) {
    console.error('[TXN] rollbackTestTransaction FAILED:', (e as Error).message);
  }
});

afterAll(async () => {
  try {
    await rollbackSuiteTransaction();
  } catch (e) {
    console.error('[TXN] rollbackSuiteTransaction FAILED:', (e as Error).message);
  }
  try {
    esbuildRef?.stop();
  } catch {
    /* no-op */
  }
  // Deferred teardown: if no more spec files start, destroy DB pools and
  // close cached apps. destroyAllDataSources() kills pools directly (no
  // NestJS lifecycle hooks). closeAllCachedApps() runs full NestJS shutdown.
  // --forceExit in the runner handles any lingering handles from lifecycle.
  if (_shutdownTimer) clearTimeout(_shutdownTimer);
  _shutdownTimer = setTimeout(async () => {
    await destroyAllDataSources().catch(() => {});
    await closeAllCachedApps().catch(() => {});
  }, 0);
  _shutdownTimer.unref();
});
