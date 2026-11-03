import { randomUUID } from 'crypto';
import { execFileSync } from 'child_process';
import { join } from 'path';
import { Client } from 'pg';
import { assertOAuthTestDatabase } from './oauth-test-database';

/** Each normal E2E suite gets its own database, including parallel Jest shards. */
export async function createOAuthTestFixture() {
  const url = assertOAuthTestDatabase(process.env.MCP_OAUTH_TEST_DATABASE_URL);
  const database = `tooljet_oauth_test_${randomUUID().replace(/-/g, '')}`;
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
  } catch (error) {
    await admin.end();
    throw error;
  }
  url.pathname = `/${database}`;
  const destroy = async () => {
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    } finally {
      await admin.end();
    }
  };
  try {
    // Migrations run in a child process so historical env changes cannot redirect
    // the regular test runner's connections. The preparation script rejects dotenv.
    execFileSync(
      process.execPath,
      [
        require.resolve('ts-node/dist/bin.js'),
        '-r',
        'tsconfig-paths/register',
        '--transpile-only',
        join(__dirname, '../prepare-mcp-oauth-db.ts'),
      ],
      {
        cwd: join(__dirname, '../..'),
        env: { ...process.env, MCP_OAUTH_TEST_DATABASE_URL: url.toString() },
        stdio: 'pipe',
        timeout: 180000,
        maxBuffer: 16 * 1024 * 1024,
      }
    );
    return { connection: url.toString(), destroy };
  } catch (error) {
    await destroy();
    throw error;
  }
}
