/**
 * Truncates all test DB tables (except migrations/instance_settings).
 * Shared by: jest-global-setup.ts, run-e2e.sh pre-reset.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --transpile-only scripts/truncate-test-db.ts
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.test') });

const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASS || '',
    database: process.env.PG_DB,
  });
  await client.connect();

  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const skip = new Set(['instance_settings', 'migrations', 'typeorm_metadata']);
  const tables = rows
    .map((r: { table_name: string }) => r.table_name)
    .filter((t: string) => !skip.has(t))
    .map((t: string) => `"${t}"`);

  if (tables.length) {
    await client.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
  }
  await client.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);
  await client.end();

  console.log(`Truncated ${tables.length} tables`);
})();
