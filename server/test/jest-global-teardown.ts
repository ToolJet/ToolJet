/**
 * Jest globalTeardown — runs once after all workers finish.
 * Drops the TOOLJET_DB tenant schemas this run created (see reset-tooljet-db-schemas.ts)
 * so `workspace_*` schemas stop accumulating across local test runs.
 */
import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalTeardown() {
  if (process.env.NODE_ENV !== 'test') return;
  // Mirrors globalSetup's shard skip — no snapshot was taken, so there's nothing to diff.
  if (process.env.SKIP_GLOBAL_SETUP) return;

  execSync(
    `npx ts-node -r tsconfig-paths/register --transpile-only ${path.resolve(__dirname, '../scripts/reset-tooljet-db-schemas.ts')} clean`,
    { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } }
  );
}
