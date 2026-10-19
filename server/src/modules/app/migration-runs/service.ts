import { ConflictException, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { createInterface } from 'readline';
import { Pool } from 'pg';
import {
  applyLogLine,
  emptyRunProgress,
  errorSummary,
  markFailed,
  MigrationStep,
  RunProgress,
} from '../../../migration-helpers/migration-run-log';
import { isAsyncMigrationMode, setupCommand } from '../../../migration-helpers/migration-status';
import { mainDbConnectionConfig } from '../../../migration-helpers/async-mode';

export type MigrationRunStatus = 'running' | 'failed' | 'succeeded';
export type MigrationState = 'idle' | MigrationRunStatus;

export interface MigrationStatus {
  state: MigrationState;
  startedAt?: string;
  toVersion?: string;
}

export interface MigrationRun {
  id: string;
  fromVersion: string | null;
  toVersion: string;
  status: MigrationRunStatus;
  currentMigration: string | null;
  progress: string | null;
  migrationsDone: number;
  migrationsTotal: number;
  migrations: MigrationStep[];
  logTail: string[];
  error: string | null;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
}

interface MigrationRunRow {
  id: string;
  from_version: string | null;
  to_version: string;
  status: MigrationRunStatus;
  current_migration: string | null;
  progress: string | null;
  migrations: MigrationStep[];
  log_tail: string[];
  error: string | null;
  triggered_by: string;
  started_at: Date;
  heartbeat_at: Date;
  finished_at: Date | null;
}

const HEARTBEAT_MS = 2000;
// Unchanged runs still write this often, so the row never looks stale.
const IDLE_WRITE_MS = 10_000;
// A running row with no heartbeat for this long lost its pod (SIGKILL, node loss).
const STALE_AFTER_MS = 30_000;
const KEEP_RUNS = 50;
const STATUS_CACHE_MS = 5000;

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS migration_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_version text,
    to_version text NOT NULL,
    status text NOT NULL,
    current_migration text,
    progress text,
    migrations jsonb NOT NULL DEFAULT '[]',
    log_tail text[] NOT NULL DEFAULT '{}',
    error text,
    triggered_by text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    heartbeat_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
  )`;

function effectiveStatus(row: MigrationRunRow): MigrationRunStatus {
  const stale = row.status === 'running' && Date.now() - new Date(row.heartbeat_at).getTime() > STALE_AFTER_MS;
  return stale ? 'failed' : row.status;
}

function toRun(row: MigrationRunRow): MigrationRun {
  const status = effectiveStatus(row);
  return {
    id: row.id,
    fromVersion: row.from_version,
    toVersion: row.to_version,
    status,
    currentMigration: row.current_migration,
    progress: row.progress,
    migrationsDone: row.migrations.filter((step) => step.status === 'done').length,
    migrationsTotal: row.migrations.length,
    migrations: row.migrations,
    logTail: row.log_tail,
    error: status === 'failed' && !row.error ? 'The migrating server stopped without reporting a result.' : row.error,
    triggeredBy: row.triggered_by,
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at ? row.finished_at.toISOString() : null,
  };
}

type Query = <T>(sql: string, params?: unknown[]) => Promise<T[]>;

/**
 * MIGRATION_MODE=async: runs the migration runner as a child of the serving process and
 * tracks it in `migration_runs`. Own small pg pool: progress stays visible while the
 * migration transaction is open, and heartbeats stay out of TypeORM's query log.
 */
@Injectable()
export class MigrationRunsService implements OnApplicationShutdown {
  private readonly enabled = isAsyncMigrationMode(process.env);
  private child: ChildProcess | null = null;
  private cachedStatus: { at: number; value: MigrationStatus } | null = null;
  private pool: Pool | null = null;

  private query: Query = async <T>(sql: string, params?: unknown[]) => {
    this.pool ??= new Pool({ ...mainDbConnectionConfig(), max: 2 });
    return (await this.pool.query(sql, params)).rows as T[];
  };

  /** Called from main.ts once the server listens. */
  async start(triggeredBy = 'boot'): Promise<void> {
    if (!this.enabled || this.child) return;
    await this.query(CREATE_TABLE).catch((error: { code?: string }) => {
      // Two pods racing CREATE TABLE IF NOT EXISTS: one loses on the type's unique index.
      if (error.code !== '23505' && error.code !== '42P07') throw error;
    });
    this.runChild(triggeredBy);
  }

  async retry(triggeredBy: string): Promise<void> {
    if (!this.enabled) throw new ConflictException('Async migration mode is not enabled.');
    const [latest] = await this.runs(1);
    if (this.child || !latest || latest.status !== 'failed') {
      throw new ConflictException('There is no failed migration to retry.');
    }
    this.runChild(triggeredBy);
  }

  async status(): Promise<MigrationStatus> {
    if (!this.enabled) return { state: 'idle' };
    if (this.cachedStatus && Date.now() - this.cachedStatus.at < STATUS_CACHE_MS) return this.cachedStatus.value;
    const [latest] = await this.runs(1).catch(() => [] as MigrationRun[]);
    const value: MigrationStatus = latest
      ? { state: latest.status, startedAt: latest.startedAt, toVersion: latest.toVersion }
      : { state: 'idle' };
    this.cachedStatus = { at: Date.now(), value };
    return value;
  }

  async runs(limit = KEEP_RUNS): Promise<MigrationRun[]> {
    if (!this.enabled) return [];
    const rows = await this.query<MigrationRunRow>('SELECT * FROM migration_runs ORDER BY started_at DESC LIMIT $1', [
      limit,
    ]);
    return rows.map(toRun);
  }

  async onApplicationShutdown(): Promise<void> {
    // Detached group: kill npm and the runner under it. The open transaction rolls back.
    if (this.child?.pid) process.kill(-this.child.pid, 'SIGTERM');
    await this.pool?.end().catch(() => undefined);
  }

  private runChild(triggeredBy: string): void {
    const child = spawn(setupCommand(process.env), {
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, MIGRATION_LOCK_MAX_WAIT_MINUTES: '0' },
    });
    this.child = child;
    let run = emptyRunProgress();
    let runId: string | null = null;
    let dirty = false;
    let lastWriteAt = 0;
    let writing = Promise.resolve();
    // Serialise writes: a heartbeat must never land after the final status.
    const write = (task: () => Promise<void>) => {
      writing = writing.then(task).catch((error: Error) => {
        console.warn(`[migrations] Could not record migration progress: ${error.message}`);
      });
      return writing;
    };

    const onLine = (stream: NodeJS.WriteStream) => (line: string) => {
      stream.write(`${line}\n`);
      const hadWork = run.hasPendingWork;
      const next = applyLogLine(run, line);
      dirty ||= next !== run;
      run = next;
      if (!hadWork && run.hasPendingWork) {
        write(async () => {
          runId = await this.insertRun(triggeredBy);
        });
      }
    };
    createInterface({ input: child.stdout }).on('line', onLine(process.stdout));
    createInterface({ input: child.stderr }).on('line', onLine(process.stderr));

    const heartbeat = setInterval(() => {
      if (!runId || (!dirty && Date.now() - lastWriteAt < IDLE_WRITE_MS)) return;
      dirty = false;
      lastWriteAt = Date.now();
      write(() => this.updateRun(runId, run, 'running'));
    }, HEARTBEAT_MS);
    heartbeat.unref();

    child.on('exit', (code) => {
      clearInterval(heartbeat);
      this.child = null;
      this.cachedStatus = null;
      const succeeded = code === 0;
      if (!succeeded) {
        run = markFailed(run);
        console.error(
          `[migrations] Async migration failed (exit ${code}). Nothing was committed; this server keeps serving.`
        );
      }
      // A failed child that never reached "pending" still gets a row, so the failure is visible.
      write(async () => {
        if (!runId && (run.hasPendingWork || !succeeded)) runId = await this.insertRun(triggeredBy);
        if (runId)
          await this.updateRun(runId, run, succeeded ? 'succeeded' : 'failed', succeeded ? null : errorSummary(run));
      });
    });
  }

  private async insertRun(triggeredBy: string): Promise<string> {
    const [previous] = await this.query<{ to_version: string }>(
      `SELECT to_version FROM migration_runs WHERE status = 'succeeded' ORDER BY started_at DESC LIMIT 1`
    );
    const [{ id }] = await this.query<{ id: string }>(
      `INSERT INTO migration_runs (from_version, to_version, status, triggered_by)
       VALUES ($1, $2, 'running', $3) RETURNING id`,
      [previous?.to_version ?? null, globalThis.TOOLJET_VERSION ?? 'unknown', triggeredBy]
    );
    await this.query(
      `DELETE FROM migration_runs WHERE id NOT IN (SELECT id FROM migration_runs ORDER BY started_at DESC LIMIT $1)`,
      [KEEP_RUNS]
    );
    return id;
  }

  private async updateRun(
    id: string,
    run: RunProgress,
    status: MigrationRunStatus,
    error: string | null = null
  ): Promise<void> {
    const finished = status !== 'running';
    await this.query(
      `UPDATE migration_runs
         SET status = $2, current_migration = $3, progress = $4, migrations = $5::jsonb, log_tail = $6,
             error = $7, heartbeat_at = now(), finished_at = CASE WHEN $8 THEN now() ELSE NULL END
       WHERE id = $1`,
      [id, status, run.currentMigration, run.progress, JSON.stringify(run.migrations), run.logTail, error, finished]
    );
  }
}
