/**
 * Jest globalSetup — runs once before all workers.
 * Truncates all tables to clear stale data from previous test runs.
 * After this, suite transactions + rollback keep the DB clean.
 */
import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalSetup() {
  if (process.env.NODE_ENV !== 'test') return;
  // Shards skip global setup — the shard runner pre-resets the DB once via truncate-test-db.ts.
  if (process.env.SKIP_GLOBAL_SETUP) return;

  execSync(
    `npx ts-node -r tsconfig-paths/register --transpile-only ${path.resolve(__dirname, '../scripts/truncate-test-db.ts')}`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } }
  );
}
