import { ConflictException, Injectable, OnApplicationShutdown, Optional } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { WorkerHost } from '@nestjs/bullmq';
import { ChildProcess, spawn } from 'child_process';
import { createInterface } from 'readline';
import { Pool } from 'pg';
import * as semver from 'semver';
import {
  applyLogLine,
  emptyRunProgress,
  errorSummary,
  markFailed,
  MigrationStep,
  RunProgress,
} from '../../../migration-helpers/migration-run-log';
import { isServerManagedMigrationMode, setupCommand } from '../../../migration-helpers/migration-status';
import { mainDbConnectionConfig } from '../../../migration-helpers/async-mode';
import { HELD_MIGRATION_LOCKS_SQL, SKIPPED_EXIT_CODE } from '../../../migration-helpers/migrations-table-gate';

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
  /** Measured by the database, so pod clock skew cannot fake a dead run. */
  heartbeat_age_ms: number;
  /** Some session holds the migration lock: whoever runs this row is alive. */
  lock_held: boolean;
}

const HEARTBEAT_MS = 2000;
// Unchanged runs still write this often, so the row never looks stale.
const IDLE_WRITE_MS = 10_000;
// A running row whose migration lock is free and whose heartbeat is this old lost its pod (SIGKILL,
// node loss). The heartbeat only covers the seconds before a fresh runner takes the lock.
const STALE_AFTER_MS = 30_000;
const KEEP_RUNS = 50;
// The write gate reads this on every write: one query per second per server, whatever the load.
const STATUS_CACHE_MS = 1000;
const SHUTDOWN_WAIT_MS = 10_000;
const JOBS_CHECK_MS = 5000;
const DEAD_RUN_CHECK_MS = 10_000;
// Background jobs would run new code against an old or half-migrated schema in these states.
const HOLD_JOBS_STATES: MigrationState[] = ['running', 'failed'];

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
  -- One running run at a time, across every server: claims race here, not in memory.
  CREATE UNIQUE INDEX IF NOT EXISTS migration_runs_one_active ON migration_runs ((true))
    WHERE status = 'running';
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
  const dead = row.status === 'running' && !row.lock_held && Number(row.heartbeat_age_ms) > STALE_AFTER_MS;
  return dead ? 'failed' : row.status;
}

/** The run's server stopped, not its migration: the next boot retries it. */
const DEAD_RUN_ERROR = 'The migrating server stopped without reporting a result.';

/** Only the latest run is shown in detail; older ones are history rows, so their steps and log stay home. */
function toRun(row: MigrationRunRow, detailed = true): MigrationRun {
  const status = effectiveStatus(row);
  // A pod that died mid-run leaves its row "running": show it as stopped where its heartbeat stopped.
  const died = status !== row.status;
  const migrations =
    status === 'failed' ? markFailed({ ...emptyRunProgress(), migrations: row.migrations }).migrations : row.migrations;
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
    error: died && !row.error ? DEAD_RUN_ERROR : row.error,
    triggeredBy: row.triggered_by,
    startedAt: row.started_at.toISOString(),
    finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
  };
}

type Query = <T>(sql: string, params?: unknown[]) => Promise<T[]>;

const currentVersion = (): string => globalThis.TOOLJET_VERSION ?? 'unknown';

/** Mid-rollout, an older pod's runner cannot see this release's migrations: it would find nothing and record a success. */
const isNewerRelease = (version: string): boolean =>
  !!semver.valid(version) && !!semver.valid(currentVersion()) && semver.gt(version, currentVersion());

/**
 * MIGRATION_MODE=async: runs the migration runner as a child of the serving process and
 * tracks it in `migration_runs`.
 * Every mode: `status()` also reports a migration another server runs, from its advisory lock.
 * Own small pg pool: progress stays visible while the migration transaction is open, and
 * heartbeats stay out of TypeORM's query log.
 */
@Injectable()
export class MigrationRunsService implements OnApplicationShutdown {
  private readonly enabled = isServerManagedMigrationMode(process.env);
  private child: ChildProcess | null = null;
  private cachedStatus: { at: number; value: MigrationStatus } | null = null;
  private statusRead: Promise<MigrationStatus> | null = null;
  private pool: Pool | null = null;
  private childExit: Promise<void> | null = null;
  private finalWrite: Promise<void> | null = null;
  private shuttingDown = false;
  private jobsTimer: NodeJS.Timeout | null = null;
  private deadRunTimer: NodeJS.Timeout | null = null;
  private restartingDeadRun = false;
  /** start() got as far as deciding whether to run; until then the dead-run check retries it. */
  private started = false;
  /** Async boot: this pod's own writes wait until its data run takes the active lock or ends. */
  private bootHold = this.enabled;

  constructor(@Optional() private readonly discovery?: DiscoveryService) {}

  private query: Query = async <T>(sql: string, params?: unknown[]) => {
    if (!this.pool) {
      this.pool = new Pool({ ...mainDbConnectionConfig(), max: 2, connectionTimeoutMillis: 5000 });
      // An idle client dropped by Postgres emits 'error' on the pool; unhandled, it would crash the server.
      this.pool.on('error', (error) => console.warn(`[migrations] Tracking connection lost: ${error.message}`));
    }
    return (await this.pool.query(sql, params)).rows as T[];
  };

  /** Called from main.ts once the server listens. */
  async start(triggeredBy = 'boot'): Promise<void> {
    if (!this.enabled || this.child) return;
    try {
      await this.startRun(triggeredBy);
    } catch (error) {
      this.releaseBootHold();
      throw error;
    }
  }

  private async startRun(triggeredBy: string): Promise<void> {
    this.holdJobsWhileMigrating();
    this.watchForDeadRuns();
    await this.query(MIGRATION_RUNS_DDL).catch((error: { code?: string }) => {
      // Two pods racing CREATE TABLE IF NOT EXISTS: one loses on the type's unique index.
      if (error.code !== '23505' && error.code !== '42P07') throw error;
    });
    await this.reapDeadRuns();
    const [latest] = await this.runs(1);
    this.started = true;
    // An older pod mid-rollout, or the previous image after a rollback: its runner would find nothing and record a success.
    if (latest && isNewerRelease(latest.toVersion)) {
      console.warn(
        `[migrations] Release ${latest.toVersion} owns the latest migration run; this server leaves it alone.`
      );
      this.releaseBootHold();
      return;
    }
    // A failed migration is retried by a super admin, never by the next server that boots. A new release may
    // carry the fix, and a run whose server stopped (rollout, scale-down, node loss) did not fail: both run again.
    if (latest?.status === 'failed' && latest.toVersion === currentVersion() && latest.error !== DEAD_RUN_ERROR) {
      console.warn(
        '[migrations] The last migration run of this version failed; waiting for a super admin to retry it.'
      );
      this.releaseBootHold();
      return;
    }
    this.runChild(triggeredBy);
  }

  /** Retries a failed run. The one-active-run index lets only one server claim it. */
  async run(triggeredBy: string): Promise<void> {
    if (!this.enabled) throw new ConflictException('Migrations are not managed by the server in this mode.');
    if (this.child) throw new ConflictException('A migration is already running.');
    await this.reapDeadRuns();
    const [latest] = await this.runs(1);
    if (latest?.status !== 'failed') throw new ConflictException('Only a failed migration run can be retried.');
    if (isNewerRelease(latest.toVersion)) {
      throw new ConflictException(
        'This server runs an older release than the failed run. Retry from an upgraded server.'
      );
    }
    const runId = await this.insertRun(triggeredBy);
    if (!runId) throw new ConflictException('A migration is already running.');
    this.cachedStatus = null;
    this.runChild(triggeredBy, { runId });
  }

  /** Ends the boot hold. A start() that cannot run fails open, like the gate. */
  private releaseBootHold(): void {
    this.bootHold = false;
    this.cachedStatus = null;
  }

  /** Latest run, or a migration another server runs before this one boots. Fails open: the gate reads it. */
  async status(): Promise<MigrationStatus> {
    if (this.cachedStatus && Date.now() - this.cachedStatus.at < STATUS_CACHE_MS) return this.cachedStatus.value;
    // Single flight: a burst of requests on a cold cache shares one query.
    this.statusRead ??= this.readStatus().finally(() => {
      this.statusRead = null;
    });
    return this.statusRead;
  }

  private async readStatus(): Promise<MigrationStatus> {
    let value: MigrationStatus = { state: 'idle' };
    try {
      // The active lock wins over the row: a server in blocking mode, or a `db:migrate` run by hand, migrates untracked.
      const [{ migrating }] = await this.query<{ migrating: boolean }>(HELD_MIGRATION_LOCKS_SQL);
      const [latest] = await this.runs(1);
      // A newer release's failed run is not this server's to wait on: its code runs on the schema it knows.
      const newerFailure = latest?.status === 'failed' && isNewerRelease(latest.toVersion);
      if (latest && !newerFailure)
        value = { state: latest.status, startedAt: latest.startedAt, toVersion: latest.toVersion };
      if (migrating) value = { ...value, state: 'running' };
      if (this.bootHold && migrating) this.bootHold = false;
      else if (this.bootHold) value = { ...value, state: 'running' };
    } catch (error) {
      console.warn(`[migrations] Could not read the migration status: ${(error as Error).message}`);
    }
    this.cachedStatus = { at: Date.now(), value };
    return value;
  }

  async runs(limit = KEEP_RUNS): Promise<MigrationRun[]> {
    if (!this.enabled) return [];
    const rows = await this.query<MigrationRunRow>(
      `SELECT r.*, EXTRACT(EPOCH FROM now() - r.heartbeat_at) * 1000 AS heartbeat_age_ms, held.running AS lock_held
         FROM migration_runs r CROSS JOIN (${HELD_MIGRATION_LOCKS_SQL}) held
        ORDER BY r.started_at DESC LIMIT $1`,
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
    this.shuttingDown = true;
    if (this.jobsTimer) clearInterval(this.jobsTimer);
    if (this.deadRunTimer) clearInterval(this.deadRunTimer);
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
   * A boot run gets a row only once it finds work, and skips if another server holds the lock.
   * A claimed run (`runId`) already owns its row, so it waits for the lock instead: the holder is
   * a run that finishes before this one re-reads what is pending.
   */
  private runChild(triggeredBy: string, { runId: claimedRunId }: { runId?: string } = {}): void {
    const child = spawn(setupCommand(process.env), {
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MIGRATION_SKIP_IF_LOCKED: String(!claimedRunId),
        // Schema already applied at boot (migrateSchemaBeforeBoot); data rolls back on its own.
        MIGRATION_PHASE: 'data',
      },
    });
    this.child = child;
    this.childExit = new Promise((resolve) => child.once('close', () => resolve()));
    this.cachedStatus = null;
    const keepQueries = !!process.env.ORM_LOGGING && process.env.ORM_LOGGING !== 'false';
    let run = emptyRunProgress();
    let runId: string | null = claimedRunId ?? null;
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
        runId = await this.insertRun(triggeredBy);
      });

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
      if (!runId || (!dirty && Date.now() - lastWriteAt < IDLE_WRITE_MS)) return;
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
      this.releaseBootHold();
      if (code === SKIPPED_EXIT_CODE) return;
      const succeeded = code === 0;
      if (!succeeded) {
        run = markFailed(run);
        console.error(
          `[migrations] Async migration failed (exit ${code}). The data migrations were rolled back; this server keeps serving.`
        );
      }
      // A failed child that never reached "pending" still gets a row, so the failure is visible.
      this.finalWrite = write(async () => {
        // Inserted as failed, not running: a failure must not wait on the one-active-run index.
        if (!runId && !succeeded) runId = await this.insertRun(triggeredBy, 'failed');
        if (!runId && run.hasPendingWork) runId = await this.insertRun(triggeredBy);
        // Nothing pending, yet the latest run failed: the database is current (a run that committed just
        // before its server died, or a db:migrate run by hand). Recorded, or writes stay refused.
        if (!runId && succeeded && (await this.runs(1))[0]?.status === 'failed') {
          runId = await this.insertRun(triggeredBy);
        }
        if (!runId) return;
        await saveLines();
        // Stopped by this server's shutdown: the migration did not fail, so the next boot retries it.
        if (!succeeded) {
          return this.updateRun(runId, run, 'failed', this.shuttingDown ? DEAD_RUN_ERROR : errorSummary(run));
        }
        await this.updateRun(runId, run, 'succeeded');
        await this.dropEarlierLogs(runId);
      });
    });
  }

  /**
   * Workers (WORKER=true) pause their BullMQ queues while writes are refused, and resume once the
   * migrations succeed: their jobs would otherwise run new code against the old schema. Jobs wait
   * in Redis. Held from boot, so nothing runs before the first status read.
   */
  private holdJobsWhileMigrating(): void {
    if (process.env.WORKER !== 'true' || !this.discovery || this.jobsTimer) return;
    const workers = this.discovery
      .getProviders()
      .map(({ instance }) => instance)
      .filter((instance): instance is WorkerHost => instance instanceof WorkerHost)
      .flatMap((host) => {
        try {
          return [host.worker];
        } catch {
          return []; // not initialised: not registered on this server
        }
      });
    if (!workers.length) return;
    let held = false;
    const hold = (next: boolean) => {
      if (next === held) return;
      held = next;
      console.log(
        next
          ? '[migrations] Pausing background jobs until migrations finish.'
          : '[migrations] Resuming background jobs.'
      );
      workers.forEach((worker) => (next ? void worker.pause(true).catch(() => undefined) : worker.resume()));
    };
    hold(true);
    this.jobsTimer = setInterval(
      () => void this.status().then(({ state }) => hold(HOLD_JOBS_STATES.includes(state))),
      JOBS_CHECK_MS
    );
    this.jobsTimer.unref();
  }

  /**
   * A run whose server stopped after the others booted (scale-down, node loss) would otherwise wait for
   * the next boot, with writes refused. Every server looks for one; the one-active-run index lets one
   * claim it.
   */
  private watchForDeadRuns(): void {
    if (this.deadRunTimer) return;
    this.deadRunTimer = setInterval(() => void this.restartDeadRun(), DEAD_RUN_CHECK_MS);
    this.deadRunTimer.unref();
  }

  async restartDeadRun(): Promise<void> {
    if (this.child || this.shuttingDown || this.restartingDeadRun) return;
    this.restartingDeadRun = true;
    try {
      const [{ running }] = await this.query<{ running: boolean }>(HELD_MIGRATION_LOCKS_SQL);
      if (running) return;
      // Boot's start() failed (database unreachable): without this, this server never runs its data migrations.
      if (!this.started) return await this.start('recovery');
      await this.reapDeadRuns();
      const [latest] = await this.runs(1);
      if (latest?.status !== 'failed' || latest.error !== DEAD_RUN_ERROR) return;
      console.log('[migrations] The migrating server stopped; starting the run again.');
      await this.run('recovery');
    } catch (error) {
      // Lost the claim to another server (409), or the database is unreachable: the next check retries.
      if (!(error instanceof ConflictException)) {
        console.warn(`[migrations] Could not check for a stopped run: ${(error as Error).message}`);
      }
    } finally {
      this.restartingDeadRun = false;
    }
  }

  private async reapDeadRuns(): Promise<void> {
    await this.query(
      `UPDATE migration_runs
          SET status = 'failed', finished_at = heartbeat_at, error = COALESCE(error, $2)
        WHERE status = 'running' AND now() - heartbeat_at > $1 * interval '1 millisecond'
          AND NOT (SELECT running FROM (${HELD_MIGRATION_LOCKS_SQL}) held)`,
      [STALE_AFTER_MS, DEAD_RUN_ERROR]
    );
  }

  /** After a success the earlier runs' logs no longer help anyone; their history rows stay. */
  private async dropEarlierLogs(runId: string): Promise<void> {
    await this.query('DELETE FROM migration_run_logs WHERE run_id <> $1', [runId]);
    await this.query(`UPDATE migration_runs SET log_tail = '{}' WHERE id <> $1`, [runId]);
  }

  /** Null when another run is already running (the one-active-run index). */
  private async insertRun(triggeredBy: string, status: MigrationRunStatus = 'running'): Promise<string | null> {
    const [previous] = await this.query<{ to_version: string }>(
      `SELECT to_version FROM migration_runs WHERE status = 'succeeded' ORDER BY started_at DESC LIMIT 1`
    );
    const [inserted] = await this.query<{ id: string }>(
      `INSERT INTO migration_runs (from_version, to_version, status, triggered_by)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id`,
      [previous?.to_version ?? null, currentVersion(), status, triggeredBy]
    );
    if (!inserted) return null;
    const { id } = inserted;
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
