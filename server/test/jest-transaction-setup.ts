/**
 * Global transaction-per-test setup for e2e tests.
 *
 * Loaded via jest-e2e.config.ts setupFilesAfterFramework. Wraps every test in a
 * database transaction that's rolled back in afterEach — instant cleanup
 * (~1ms) instead of TRUNCATE (~200ms).
 */
import { beginTestTransaction, rollbackTestTransaction } from './helpers/setup';

beforeEach(async () => {
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
