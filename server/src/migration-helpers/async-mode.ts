import { spawn } from 'child_process';
import { Client, ClientConfig } from 'pg';
import ormconfig from '../../ormconfig';
import { isServerManagedMigrationMode, setupCommand } from './migration-status';

type Env = Record<string, string | undefined>;

interface ConnectionFields {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: object;
}

/** Main database connection for plain pg, outside TypeORM's pool and query logging. */
export function mainDbConnectionConfig(): ClientConfig {
  const options = ormconfig as unknown as ConnectionFields;
  return {
    connectionString: options.url,
    host: options.host,
    port: options.port,
    user: options.username,
    password: options.password,
    database: options.database,
    ssl: options.ssl,
  };
}

/** No database, or no `migrations` table: the server cannot boot before migrating. */
async function isFreshInstall(): Promise<boolean> {
  const client = new Client(mainDbConnectionConfig());
  try {
    await client.connect();
    const [{ table }] = (await client.query(`SELECT to_regclass('migrations') AS table`)).rows;
    return table === null;
  } catch (error) {
    if ((error as { code?: string }).code === '3D000') return true; // database does not exist
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Async mode skips setup in the entrypoint, so Nest would boot on the old schema and crash
 * on any column the release adds. Apply schema migrations here first, blocking; data runs after boot.
 * A fresh install runs the full setup, exactly like blocking mode would have.
 */
export async function migrateSchemaBeforeBoot(env: Env = process.env): Promise<void> {
  if (!isServerManagedMigrationMode(env)) return;
  const freshInstall = await isFreshInstall();
  console.log(
    freshInstall
      ? '[migrations] Fresh install: migrating before the server starts.'
      : '[migrations] Applying pending schema migrations before the server starts.'
  );
  const exitCode = await new Promise<number>((resolve) => {
    spawn(setupCommand(env), {
      shell: true,
      stdio: 'inherit',
      env: freshInstall ? process.env : { ...process.env, MIGRATION_PHASE: 'schema' },
    }).on('exit', (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) {
    throw new Error(`${freshInstall ? 'Initial database setup' : 'Schema migrations'} failed (exit ${exitCode}).`);
  }
}
