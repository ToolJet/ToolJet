/// <reference types="jest" />
import { buildConnectionOptions } from 'ormconfig';

// Regression for tj-ee#5209: an orphaned "idle in transaction" session held locks on the
// `layouts` table for ~2 days and froze the app-builder. The app DB connection must set
// Postgres' idle_in_transaction_session_timeout so abandoned transactions get rolled back
// automatically. This guards the config that makes that happen.
/** @group platform */
describe('buildConnectionOptions — idle_in_transaction_session_timeout (app DB)', () => {
  // Minimal env for a valid connection; the function only reads these keys off `data`.
  const baseEnv = {
    PG_DB: 'tooljet_test',
    PG_USER: 'postgres',
    PG_PASS: 'postgres',
    PG_HOST: 'localhost',
    PG_PORT: '5432',
    NODE_ENV: 'test',
  };

  const idleTimeout = (env: Record<string, unknown>): unknown =>
    (buildConnectionOptions(env).extra as Record<string, unknown>).idle_in_transaction_session_timeout;

  it('defaults to 1 hour (3600000ms) when PG_IDLE_IN_TRANSACTION_TIMEOUT is unset', () => {
    expect(idleTimeout(baseEnv)).toBe(3600000);
  });

  it('honours PG_IDLE_IN_TRANSACTION_TIMEOUT when set to a numeric string', () => {
    expect(idleTimeout({ ...baseEnv, PG_IDLE_IN_TRANSACTION_TIMEOUT: '60000' })).toBe(60000);
  });

  it('falls back to the default when PG_IDLE_IN_TRANSACTION_TIMEOUT is non-numeric', () => {
    expect(idleTimeout({ ...baseEnv, PG_IDLE_IN_TRANSACTION_TIMEOUT: 'not-a-number' })).toBe(3600000);
  });

  it('falls back to the default when PG_IDLE_IN_TRANSACTION_TIMEOUT is 0 (disabling would reintroduce the bug)', () => {
    expect(idleTimeout({ ...baseEnv, PG_IDLE_IN_TRANSACTION_TIMEOUT: '0' })).toBe(3600000);
  });
});
