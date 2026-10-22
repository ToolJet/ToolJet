import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';

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
    NODE_ENV: 'test', PG_HOST: url.hostname, PG_PORT: url.port || '5432', PG_USER: decodeURIComponent(url.username),
    PG_PASS: decodeURIComponent(url.password), PG_DB: url.pathname.slice(1),
    TOOLJET_DB_HOST: url.hostname, TOOLJET_DB_PORT: url.port || '5432', TOOLJET_DB_USER: decodeURIComponent(url.username),
    TOOLJET_DB_PASS: decodeURIComponent(url.password), TOOLJET_DB: url.pathname.slice(1),
  });
  const bootstrap = new DataSource({ type: 'postgres', url: connection });
  await bootstrap.initialize();
  try {
    await bootstrap.query('DROP SCHEMA IF EXISTS oauth_test CASCADE');
    await bootstrap.query('CREATE SCHEMA oauth_test');
  } finally { await bootstrap.destroy(); }
  const db = new DataSource({
    type: 'postgres', url: connection, schema: 'oauth_test', synchronize: false,
    extra: { options: '-c search_path=oauth_test,public' },
    entities: [join(__dirname, '../src/**/*.entity.ts'), join(__dirname, '../ee/**/*.entity.ts')],
    migrations: [join(__dirname, '../migrations/*.ts')],
  });
  await db.initialize();
  try {
    const applied = await db.runMigrations({ transaction: 'all' });
    console.log(`OAuth integration database: applied ${applied.length} real ToolJet migrations`);
  } finally { await db.destroy(); }
}
prepare().catch(error => { console.error(error); process.exit(1); });
