/**
 * Jest globalSetup — runs once before all workers.
 * Truncates all tables to clear stale data from previous test runs, then snapshots
 * TOOLJET_DB's tenant schemas so jest-global-teardown.ts can drop whatever this run
 * creates - see reset-tooljet-db-schemas.ts for why it's a snapshot/diff, not a wipe.
 * After this, suite transactions + rollback keep the main DB clean.
 */
import { execSync } from 'child_process';
import * as path from 'path';

function run(script: string, arg?: string) {
  execSync(
    `npx ts-node -r tsconfig-paths/register --transpile-only ${path.resolve(__dirname, `../scripts/${script}`)}${arg ? ` ${arg}` : ''}`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } }
  );
}

export default async function globalSetup() {
  if (process.env.NODE_ENV !== 'test') return;
  // Shards skip global setup — the shard runner pre-resets the DB once via truncate-test-db.ts.
  if (process.env.SKIP_GLOBAL_SETUP) return;

  run('truncate-test-db.ts');
  run('reset-tooljet-db-schemas.ts', 'snapshot');
}
