import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';

async function prepare() {
  const connection = process.env.MCP_OAUTH_TEST_DATABASE_URL;
  if (!connection) {
    if (process.env.CI) throw new Error('CI requires MCP_OAUTH_TEST_DATABASE_URL; database tests must not skip');
    return;
  }
  const url = new URL(connection);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !/^\/tooljet_oauth_test_[a-z0-9_]+$/.test(url.pathname))
    throw new Error('Use a dedicated local database named tooljet_oauth_test_*');
  // Some historical migrations open a second ToolJet Database connection. Pin every
  // connection to this same disposable database and reject dotenv overrides.
  if (existsSync(join(process.cwd(), '../.env')) || existsSync(join(process.cwd(), '../.env.test')))
    throw new Error('Run OAuth migration tests from an isolated checkout without dotenv files');
  delete process.env.DATABASE_URL;
  delete process.env.TOOLJET_DB_URL;
  Object.assign(process.env, {
    NODE_ENV: 'test',
    PG_HOST: url.hostname,
    PG_PORT: url.port || '5432',
    PG_USER: decodeURIComponent(url.username),
    PG_PASS: decodeURIComponent(url.password),
    PG_DB: url.pathname.slice(1),
    TOOLJET_DB_HOST: url.hostname,
    TOOLJET_DB_PORT: url.port || '5432',
    TOOLJET_DB_USER: decodeURIComponent(url.username),
    TOOLJET_DB_PASS: decodeURIComponent(url.password),
    TOOLJET_DB: url.pathname.slice(1),
  });
  const bootstrap = new DataSource({ type: 'postgres', url: connection });
  await bootstrap.initialize();
  try {
    // The database name and host are checked above. Historical migrations target
    // public explicitly, so isolation must be at the database boundary.
    await bootstrap.query('DROP SCHEMA public CASCADE');
    await bootstrap.query('CREATE SCHEMA public');
  } finally {
    await bootstrap.destroy();
  }
  // Reuse the production runner, including enum-safe fresh installs and data migrations.
  execFileSync(
    process.execPath,
    [
      require.resolve('ts-node/dist/bin.js'),
      '-r',
      'tsconfig-paths/register',
      '--transpile-only',
      join(__dirname, '../src/migration-helpers/run-all-migrations.ts'),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        TOOLJET_EDITION: 'ce',
        SECRET_KEY_BASE: randomBytes(32).toString('hex'),
        LOCKBOX_MASTER_KEY: randomBytes(32).toString('hex'),
      },
      stdio: 'inherit',
    }
  );
}
prepare().catch((error) => {
  console.error(error);
  process.exit(1);
});
