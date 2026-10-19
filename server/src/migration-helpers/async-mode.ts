import { spawn } from 'child_process';
import { Client, ClientConfig } from 'pg';
import ormconfig from '../../ormconfig';
import { isAsyncMigrationMode, setupCommand } from './migration-status';

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
 * Async mode skips setup in the entrypoint. A fresh install still has to migrate before Nest
 * boots, so run it here, blocking, exactly like blocking mode would have.
 */
export async function migrateFirstIfFreshInstall(env: Env = process.env): Promise<void> {
  if (!isAsyncMigrationMode(env) || !(await isFreshInstall())) return;
  console.log('[migrations] Async mode on a fresh install: migrating before the server starts.');
  const exitCode = await new Promise<number>((resolve) => {
    spawn(setupCommand(env), { shell: true, stdio: 'inherit' }).on('exit', (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`Initial database setup failed (exit ${exitCode}).`);
}
