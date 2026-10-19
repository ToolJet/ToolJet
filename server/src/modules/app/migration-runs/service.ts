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
import {
  getMigrationMode,
  isServerManagedMigrationMode,
  setupCommand,
} from '../../../migration-helpers/migration-status';
import { mainDbConnectionConfig } from '../../../migration-helpers/async-mode';

/** pending: manual mode, found work and waits for a super admin to run it. */
export type MigrationRunStatus = 'pending' | 'running' | 'failed' | 'succeeded';
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
  /** Measured by the database, so pod clock skew cannot fake a dead run. */
  heartbeat_age_ms: number;
}

const HEARTBEAT_MS = 2000;
// Unchanged runs still write this often, so the row never looks stale.
const IDLE_WRITE_MS = 10_000;
// A running row with no heartbeat for this long lost its pod (SIGKILL, node loss).
const STALE_AFTER_MS = 30_000;
const KEEP_RUNS = 50;
const STATUS_CACHE_MS = 5000;
const SHUTDOWN_WAIT_MS = 10_000;

export const MIGRATION_RUNS_DDL = `
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
  );
  CREATE TABLE IF NOT EXISTS migration_run_logs (
    id bigserial PRIMARY KEY,
    run_id uuid NOT NULL REFERENCES migration_runs (id) ON DELETE CASCADE,
    migration text,
    line text NOT NULL
  );
  CREATE INDEX IF NOT EXISTS migration_run_logs_run_id ON migration_run_logs (run_id, id)`;

/** The migration a just-logged line belongs to: the running one, or the one whose DONE line it is. */
function owningMigration(run: RunProgress): string | null {
  const step = run.migrations.find(({ name }) => name === run.currentMigration);
  if (!step) return null;
  const line = run.logTail[run.logTail.length - 1];
  return step.status === 'running' || line.includes(`DONE ${step.name} `) ? step.name : null;
}

function effectiveStatus(row: MigrationRunRow): MigrationRunStatus {
  const stale = row.status === 'running' && Number(row.heartbeat_age_ms) > STALE_AFTER_MS;
  return stale ? 'failed' : row.status;
}

/** Only the latest run is shown in detail; older ones are history rows, so their steps and log stay home. */
function toRun(row: MigrationRunRow, detailed = true): MigrationRun {
  const status = effectiveStatus(row);
  // A pod that died mid-run leaves its row "running": show it as stopped where its heartbeat stopped.
  const died = status !== row.status;
  const migrations = died
    ? markFailed({ ...emptyRunProgress(), migrations: row.migrations }).migrations
    : row.migrations;
  const finishedAt = row.finished_at ?? (died ? row.heartbeat_at : null);
  return {
    id: row.id,
    fromVersion: row.from_version,
    toVersion: row.to_version,
    status,
    currentMigration: row.current_migration,
    progress: row.progress,
    migrationsDone: migrations.filter((step) => step.status === 'done').length,
    migrationsTotal: migrations.length,
    migrations: detailed ? migrations : [],
    logTail: detailed ? row.log_tail : [],
    error: status === 'failed' && !row.error ? 'The migrating server stopped without reporting a result.' : row.error,
    triggeredBy: row.triggered_by,
    startedAt: row.started_at.toISOString(),
    finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
  };
}

type Query = <T>(sql: string, params?: unknown[]) => Promise<T[]>;

/**
 * MIGRATION_MODE=async|manual: runs the migration runner as a child of the serving process and
 * tracks it in `migration_runs`. Manual mode only checks on boot; a super admin starts the run. Own small pg pool: progress stays visible while the
 * migration transaction is open, and heartbeats stay out of TypeORM's query log.
 */
@Injectable()
export class MigrationRunsService implements OnApplicationShutdown {
  private readonly enabled = isServerManagedMigrationMode(process.env);
  private readonly manual = getMigrationMode(process.env) === 'manual';
  private child: ChildProcess | null = null;
  private runClaimed = false;
  private cachedStatus: { at: number; value: MigrationStatus } | null = null;
  private pool: Pool | null = null;
  private childExit: Promise<void> | null = null;
  private finalWrite: Promise<void> | null = null;

  private query: Query = async <T>(sql: string, params?: unknown[]) => {
    if (!this.pool) {
      this.pool = new Pool({ ...mainDbConnectionConfig(), max: 2 });
      // An idle client dropped by Postgres emits 'error' on the pool; unhandled, it would crash the server.
      this.pool.on('error', (error) => console.warn(`[migrations] Tracking connection lost: ${error.message}`));
    }
    return (await this.pool.query(sql, params)).rows as T[];
  };

  /** Called from main.ts once the server listens. */
  async start(triggeredBy = 'boot'): Promise<void> {
    if (!this.enabled || this.child) return;
    await this.query(MIGRATION_RUNS_DDL).catch((error: { code?: string }) => {
      // Two pods racing CREATE TABLE IF NOT EXISTS: one loses on the type's unique index.
      if (error.code !== '23505' && error.code !== '42P07') throw error;
    });
    this.runChild(triggeredBy, { checkOnly: this.manual });
  }

  /** Starts a pending (manual mode) or failed run. */
  async run(triggeredBy: string): Promise<void> {
    if (!this.enabled) throw new ConflictException('Migrations are not managed by the server in this mode.');
    // Claimed before the await: two clicks must not spawn two runners.
    if (this.child || this.runClaimed) throw new ConflictException('A migration is already running.');
    this.runClaimed = true;
    try {
      const [latest] = await this.runs(1);
      if (latest?.status !== 'failed' && latest?.status !== 'pending') {
        throw new ConflictException('There are no migrations waiting to run.');
      }
      this.runChild(triggeredBy, {
        pendingRunId: latest.status === 'pending' ? latest.id : undefined,
        recordNow: true,
      });
    } finally {
      this.runClaimed = false;
    }
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
    const rows = await this.query<MigrationRunRow>(
      `SELECT *, EXTRACT(EPOCH FROM now() - heartbeat_at) * 1000 AS heartbeat_age_ms
         FROM migration_runs ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map((row, index) => toRun(row, index === 0));
  }

  /** Every redacted line of one run, or of one migration in it. Earlier runs' logs go once a run succeeds. */
  async log(runId: string, migration?: string): Promise<string> {
    if (!this.enabled) return '';
    const rows = await this.query<{ line: string }>(
      'SELECT line FROM migration_run_logs WHERE run_id = $1 AND ($2::text IS NULL OR migration = $2) ORDER BY id',
      [runId, migration ?? null]
    );
    return rows.map(({ line }) => line).join('\n');
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.child?.pid) {
      try {
        // Detached group: kill npm and the runner under it. The open transaction rolls back.
        process.kill(-this.child.pid, 'SIGTERM');
      } catch {
        // Already gone (ESRCH): its exit handler records the result.
      }
      // Let the exit handler record "failed" before the pool closes, so the row does not wait out the stale rule.
      await Promise.race([this.childExit, new Promise((resolve) => setTimeout(resolve, SHUTDOWN_WAIT_MS))]);
    }
    await this.finalWrite;
    await this.pool?.end().catch(() => undefined);
  }

  /**
   * A boot run gets a row only once it finds work; a started run gets one at once, so it replaces
   * the failed or pending row. checkOnly lists pending work and leaves the row `pending`.
   */
  private runChild(
    triggeredBy: string,
    {
      checkOnly = false,
      recordNow = false,
      pendingRunId,
    }: { checkOnly?: boolean; recordNow?: boolean; pendingRunId?: string } = {}
  ): void {
    const child = spawn(setupCommand(process.env), {
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, MIGRATION_SKIP_IF_LOCKED: 'true', MIGRATION_CHECK_ONLY: String(checkOnly) },
    });
    this.child = child;
    this.childExit = new Promise((resolve) => child.once('close', () => resolve()));
    this.cachedStatus = null;
    const keepQueries = !!process.env.ORM_LOGGING && process.env.ORM_LOGGING !== 'false';
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
    const record = () =>
      write(async () => {
        if (runId) return;
        if (checkOnly) runId = await this.recordPending(triggeredBy);
        else
          runId = pendingRunId
            ? await this.claimPendingRun(pendingRunId, triggeredBy)
            : await this.insertRun(triggeredBy);
      });
    if (recordNow) record();

    // Kept lines wait here until the run has a row, then go out with the next write.
    let unsavedLines: { migration: string | null; line: string }[] = [];
    const saveLines = async () => {
      if (!runId || unsavedLines.length === 0) return;
      const batch = unsavedLines;
      unsavedLines = [];
      // A lost log batch must never stop the run's status from being recorded.
      await this.query(
        'INSERT INTO migration_run_logs (run_id, migration, line) SELECT $1, * FROM unnest($2::text[], $3::text[])',
        [runId, batch.map(({ migration }) => migration), batch.map(({ line }) => line)]
      ).catch((error: Error) =>
        console.warn(`[migrations] Could not save ${batch.length} log line(s): ${error.message}`)
      );
    };

    const onLine = (stream: NodeJS.WriteStream) => (line: string) => {
      stream.write(`${line}\n`);
      const hadWork = run.hasPendingWork;
      const next = applyLogLine(run, line, { keepQueries });
      if (next.logTail !== run.logTail) {
        unsavedLines.push({ migration: owningMigration(next), line: next.logTail[next.logTail.length - 1] });
      }
      dirty ||= next !== run;
      run = next;
      if (!hadWork && run.hasPendingWork) record();
    };
    createInterface({ input: child.stdout }).on('line', onLine(process.stdout));
    createInterface({ input: child.stderr }).on('line', onLine(process.stderr));

    const heartbeat = setInterval(() => {
      if (checkOnly || !runId || (!dirty && Date.now() - lastWriteAt < IDLE_WRITE_MS)) return;
      dirty = false;
      lastWriteAt = Date.now();
      write(async () => {
        await saveLines();
        await this.updateRun(runId, run, 'running');
      });
    }, HEARTBEAT_MS);
    heartbeat.unref();

    // 'close', not 'exit': it fires after stdout and stderr are drained, so the last lines are already parsed.
    child.on('close', (code) => {
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
      this.finalWrite = write(async () => {
        if (!runId && (run.hasPendingWork || !succeeded)) runId = await this.insertRun(triggeredBy);
        if (!runId) return;
        await saveLines();
        if (!succeeded) return this.updateRun(runId, run, 'failed', errorSummary(run));
        await this.updateRun(runId, run, checkOnly ? 'pending' : 'succeeded');
        if (!checkOnly) await this.dropEarlierLogs(runId);
      });
    });
  }

  /** Pods booting together share one pending row. */
  private async recordPending(triggeredBy: string): Promise<string> {
    const [latest] = await this.runs(1);
    return latest?.status === 'pending' ? latest.id : this.insertRun(triggeredBy, 'pending');
  }

  private async claimPendingRun(id: string, triggeredBy: string): Promise<string> {
    await this.query(
      `UPDATE migration_runs
         SET status = 'running', triggered_by = $2, started_at = now(), heartbeat_at = now(), error = NULL
       WHERE id = $1`,
      [id, triggeredBy]
    );
    // ponytail: pods racing their boot check can leave a second pending row; it is never the latest after this.
    await this.query(`DELETE FROM migration_runs WHERE status = 'pending' AND id <> $1`, [id]);
    return id;
  }

  /** After a success the earlier runs' logs no longer help anyone; their history rows stay. */
  private async dropEarlierLogs(runId: string): Promise<void> {
    await this.query('DELETE FROM migration_run_logs WHERE run_id <> $1', [runId]);
    await this.query(`UPDATE migration_runs SET log_tail = '{}' WHERE id <> $1`, [runId]);
  }

  private async insertRun(triggeredBy: string, status: MigrationRunStatus = 'running'): Promise<string> {
    const [previous] = await this.query<{ to_version: string }>(
      `SELECT to_version FROM migration_runs WHERE status = 'succeeded' ORDER BY started_at DESC LIMIT 1`
    );
    const [{ id }] = await this.query<{ id: string }>(
      `INSERT INTO migration_runs (from_version, to_version, status, triggered_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [previous?.to_version ?? null, globalThis.TOOLJET_VERSION ?? 'unknown', status, triggeredBy]
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
    const finished = status !== 'running' && status !== 'pending';
    await this.query(
      `UPDATE migration_runs
         SET status = $2, current_migration = $3, progress = $4, migrations = $5::jsonb, log_tail = $6,
             error = $7, heartbeat_at = now(), finished_at = CASE WHEN $8 THEN now() ELSE NULL END
       WHERE id = $1`,
      [id, status, run.currentMigration, run.progress, JSON.stringify(run.migrations), run.logTail, error, finished]
    );
  }
}
