/**
 * Shared plumbing for the migration e2e specs: scratch databases and simulated pods.
 *
 * A "pod" is a real OS process running `pod.ts`, which runs the real `run()` against a scratch
 * database and the fixture migration set. Separate processes (not threads) are the point —
 * each gets its own connection pool and its own exit code.
 */
import { ChildProcess, spawn } from 'child_process';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

export const SERVER_ROOT = resolve(__dirname, '../../../..');
const POD_SCRIPT = join(SERVER_ROOT, 'test/modules/migrations/fixtures/pod.ts');

export const postgres = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASS || 'postgres',
};

export interface PodResult {
  podId: string;
  error: string | null;
  durationMs: number;
}

export interface PodOutcome {
  podId: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  result: PodResult | null;
}

export interface PodOptions {
  podId: string;
  database: string;
  /** Shared wall-clock release instant, so start-up jitter cannot decide who wins a race. */
  startAt?: number;
  migrationSleepSeconds?: number;
  /** Fixture directory under `fixtures/` (default `concurrent-pods`) whose migrations the pod runs. */
  fixtureSet?: string;
  /** Extra env for the pod. Keys absent from `.env.test` survive `getEnvVars()`. */
  env?: Record<string, string>;
}

export interface RunningPod {
  child: ChildProcess;
  done: Promise<PodOutcome>;
}

export function spawnPod({
  podId,
  database,
  startAt,
  migrationSleepSeconds = 6,
  fixtureSet = 'concurrent-pods',
  env = {},
}: PodOptions): RunningPod {
  // `process.execPath` rather than `npx ts-node`: the child must BE the node process, so that
  // a signal the spec sends lands on the pod itself. An `npx` wrapper cannot forward SIGKILL —
  // it dies and orphans the real process, which then finishes normally.
  const child = spawn(
    process.execPath,
    ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', POD_SCRIPT],
    {
      cwd: SERVER_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TS_NODE_PROJECT: 'tsconfig.json',
        POD_ID: podId,
        START_AT: String(startAt ?? Date.now()),
        FIXTURE_MIGRATION_SLEEP_SECONDS: String(migrationSleepSeconds),
        FIXTURE_SET: fixtureSet,
        SCRATCH_PG_HOST: postgres.host,
        SCRATCH_PG_PORT: String(postgres.port),
        SCRATCH_PG_USER: postgres.username,
        SCRATCH_PG_PASS: postgres.password,
        SCRATCH_PG_DB: database,
        MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '2',
        ...env,
      },
    }
  );

  let stdout = '';
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stdout += chunk));

  const done = new Promise<PodOutcome>((resolvePod) => {
    child.on('close', (exitCode, signal) => {
      const marker = stdout.split('\n').find((line) => line.startsWith('__POD_RESULT__'));
      resolvePod({
        podId,
        exitCode,
        signal,
        stdout,
        result: marker ? JSON.parse(marker.replace('__POD_RESULT__', '')) : null,
      });
    });
  });

  return { child, done };
}

export function runPod(options: PodOptions): Promise<PodOutcome> {
  return spawnPod(options).done;
}

export async function withScratchConnection<T>(database: string, fn: (db: DataSource) => Promise<T>): Promise<T> {
  const db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  try {
    return await fn(db);
  } finally {
    await db.destroy().catch(() => undefined);
  }
}

export const withAdminConnection = <T>(fn: (admin: DataSource) => Promise<T>): Promise<T> =>
  withScratchConnection('postgres', fn);

export async function createScratchDatabase(name: string): Promise<string> {
  await withAdminConnection(async (admin) => {
    await admin.query(`DROP DATABASE IF EXISTS ${name}`);
    await admin.query(`CREATE DATABASE ${name}`);
  });
  return name;
}

export async function dropScratchDatabase(name: string): Promise<void> {
  await withAdminConnection(async (admin) => {
    // Pods that were SIGKILLed can leave a connection behind, which blocks DROP DATABASE.
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [name]);
    await admin.query(`DROP DATABASE IF EXISTS ${name}`);
  }).catch(() => undefined);
}

/** Polls until `condition` holds, so specs never race a background process on a fixed sleep. */
export async function waitFor<T>(
  describeWhat: string,
  read: () => Promise<T>,
  condition: (value: T) => boolean,
  { timeoutMs = 30_000, intervalMs = 100 } = {}
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: T;
  while (Date.now() < deadline) {
    last = await read();
    if (condition(last)) return last;
    await new Promise((resolveSleep) => setTimeout(resolveSleep, intervalMs));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${describeWhat}. Last value: ${JSON.stringify(last)}`);
}
