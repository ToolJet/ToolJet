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
  unrefAllPoolConnections,
  closeAllCachedApps,
} from './helpers/setup';

// Deferred shutdown: after the last spec file in the worker, close cached apps
// so the worker can exit gracefully. If another spec starts before the timer
// fires, the timer is cancelled and the apps stay alive.
let _shutdownTimer: ReturnType<typeof setTimeout> | undefined;

// NOTE: No beforeAll hook for beginSuiteTransaction(). It starts lazily inside
// beginTestTransaction() on the first call. This is because setupFilesAfterEnv
// beforeAll runs BEFORE the spec's beforeAll (where initTestApp sets up the
// DataSource). The lazy start waits until the DataSource is available.
beforeEach(async () => {
  // Cancel deferred shutdown — another spec file is starting.
  if (_shutdownTimer) { clearTimeout(_shutdownTimer); _shutdownTimer = undefined; }
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
  // Unref pg pool connections so they don't prevent graceful process exit.
  unrefAllPoolConnections();
  // Schedule cached app teardown. If this was the last spec file in the
  // worker, the timer fires and closes apps → worker exits gracefully.
  // If another spec starts, beforeEach cancels the timer.
  if (_shutdownTimer) clearTimeout(_shutdownTimer);
  _shutdownTimer = setTimeout(() => { closeAllCachedApps().catch(() => {}); }, 0);
  _shutdownTimer.unref();
});
