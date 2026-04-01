/**
 * Global transaction-per-test setup for e2e tests.
 *
 * Loaded via jest-e2e.json setupFilesAfterFramework. Wraps every test in a
 * database transaction that's rolled back in afterEach — instant cleanup
 * (~1ms) instead of TRUNCATE (~200ms).
 */
import { beginTestTransaction, rollbackTestTransaction } from './helpers/setup';

beforeEach(async () => {
  await beginTestTransaction();
});

afterEach(async () => {
  await rollbackTestTransaction();
});
