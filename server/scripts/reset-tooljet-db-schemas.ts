/**
 * Cleans up `workspace_*` tenant schemas that tests leave behind in TOOLJET_DB.
 *
 * TOOLJET_DB is the same physical database for dev (.env) and test (.env.test) - so
 * this can't just drop every `workspace_*` schema it finds, that would also take out
 * a developer's real local workspace. Instead it brackets a test run: `snapshot` records
 * which schemas exist before tests start touching the DB, `clean` drops whatever
 * `workspace_*` schemas showed up since - i.e. what this run created - and leaves
 * everything that was already there alone.
 *
 * Shared by: jest-global-setup.ts (snapshot) / jest-global-teardown.ts (clean).
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --transpile-only scripts/reset-tooljet-db-schemas.ts snapshot
 *   npx ts-node -r tsconfig-paths/register --transpile-only scripts/reset-tooljet-db-schemas.ts clean
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

const SNAPSHOT_PATH = path.join(os.tmpdir(), 'tooljet-test-tenant-schema-snapshot.json');

async function workspaceSchemas(client: Client): Promise<string[]> {
  const { rows } = await client.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace\\_%' ESCAPE '\\'`
  );
  return rows.map((r: { schema_name: string }) => r.schema_name);
}

(async () => {
  const mode = process.argv[2];
  if (mode !== 'snapshot' && mode !== 'clean') {
    console.error(`Usage: reset-tooljet-db-schemas.ts <snapshot|clean>`);
    process.exit(1);
  }

  const client = new Client({
    host: process.env.TOOLJET_DB_HOST || 'localhost',
    port: Number(process.env.TOOLJET_DB_PORT) || 5432,
    user: process.env.TOOLJET_DB_USER,
    password: process.env.TOOLJET_DB_PASSWORD || '',
    database: process.env.TOOLJET_DB,
  });
  await client.connect();

  try {
    if (mode === 'snapshot') {
      const existing = await workspaceSchemas(client);
      fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(existing));
      console.log(`Snapshotted ${existing.length} pre-existing tenant schema(s)`);
      return;
    }

    // clean: no snapshot means this run's setup never took one (e.g. a shard that
    // skips globalSetup) - do nothing rather than guess and risk dropping a real
    // workspace nothing here created.
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      console.log('No tenant schema snapshot found, skipping cleanup');
      return;
    }

    const before: string[] = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    const beforeSet = new Set(before);
    const after = await workspaceSchemas(client);
    const created = after.filter((name) => !beforeSet.has(name));

    for (const schema of created) {
      await client.query(`DROP SCHEMA IF EXISTS "${schema.replace(/"/g, '""')}" CASCADE`);
    }
    fs.unlinkSync(SNAPSHOT_PATH);
    console.log(`Dropped ${created.length} tenant schema(s) created during this test run`);
  } finally {
    await client.end();
  }
})();
