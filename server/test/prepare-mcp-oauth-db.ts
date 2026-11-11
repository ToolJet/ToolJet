import { assertOAuthTestDatabase } from './helpers/oauth-test-database';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { randomBytes } from 'crypto';

async function prepare() {
  const connection = process.env.MCP_OAUTH_TEST_DATABASE_URL;
  const url = assertOAuthTestDatabase(connection);
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
  // Use the branch's normal schema and data migration entry point.
  execFileSync('npm', ['run', 'db:migrate'], {
    cwd: join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      TOOLJET_EDITION: 'ce',
      SECRET_KEY_BASE: randomBytes(32).toString('hex'),
      LOCKBOX_MASTER_KEY: randomBytes(32).toString('hex'),
    },
    stdio: 'inherit',
  });
}
prepare().catch((error) => {
  console.error(error);
  process.exit(1);
});
