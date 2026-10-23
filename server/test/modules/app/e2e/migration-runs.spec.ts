import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initTestApp, closeTestApp, createSuperAdmin, createAdmin, getDefaultDataSource } from 'test-helper';
import { WorkerHost } from '@nestjs/bullmq';
import { MIGRATION_RUNS_DDL, MigrationRunsService } from '@modules/app/migration-runs/service';
import { MIGRATION_ACTIVE_LOCK_KEY, MIGRATION_ADVISORY_LOCK_KEY } from 'src/migration-helpers/migrations-table-gate';

type Internals = {
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  runChild: jest.Mock;
  deadRunTimer: NodeJS.Timeout | null;
  started: boolean;
  bootHold: boolean;
  cachedStatus: unknown;
};

/** @group platform */
describe('MigrationRunsController', () => {
  const originalMode = process.env.MIGRATION_MODE;
  let app: INestApplication;

  beforeAll(async () => {
    // These cases describe the default mode. Set, not deleted: the .env loader only fills missing keys.
    process.env.MIGRATION_MODE = 'blocking';
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    process.env.MIGRATION_MODE = originalMode;
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/migration-status | banner poll', () => {
    it('should answer idle without authentication when async mode is off', async () => {
      const response = await request(app.getHttpServer()).get('/api/migration-status');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ state: 'idle' });
    });
  });

  describe('GET /api/migration-runs | run history', () => {
    it('should reject an unauthenticated request with 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/migration-runs');

      expect(response.statusCode).toBe(401);
    });

    it('should reject a workspace admin who is not a super admin with 403', async () => {
      const admin = await createAdmin(app, 'migration-runs-admin@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id);

      expect(response.statusCode).toBe(403);
    });

    it('should return an empty history to a super admin when async mode is off', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-runs-super@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs')
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ runs: [] });
    });
  });

  describe('GET /api/migration-runs/:id/log | full log', () => {
    it('should reject a workspace admin with 403', async () => {
      const admin = await createAdmin(app, 'migration-log-admin@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs/00000000-0000-4000-8000-000000000000/log')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id);

      expect(response.statusCode).toBe(403);
    });

    it('should answer 400 to a run id that is not a uuid', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-log-super@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs/not-a-uuid/log')
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(400);
    });

    it('should answer 400 to a migration name longer than any migration class name', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-log-long@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs/00000000-0000-4000-8000-000000000000/log')
        .query({ migration: 'A'.repeat(256) })
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(400);
    });

    it('should return an empty log for one migration of a run when async mode is off', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-log-one@tooljet.io');

      const response = await request(app.getHttpServer())
        .get('/api/migration-runs/00000000-0000-4000-8000-000000000000/log')
        .query({ migration: 'AddThing1' })
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ log: '' });
    });
  });

  describe('POST /api/migration-runs/run | no manual retry', () => {
    it('should answer 404: a failed run is retried by the next server that boots', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-retry-super@tooljet.io');

      const response = await request(app.getHttpServer())
        .post('/api/migration-runs/run')
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(404);
    });
  });
});

describe('MigrationRunsService | async mode against real Postgres', () => {
  const originalMode = process.env.MIGRATION_MODE;
  let dataSource: DataSource;
  let app: INestApplication;
  let service: MigrationRunsService;

  /** A booted server's service, its own pool routed through the suite transaction so seeded rows are visible. */
  const newServer = () => {
    const server = new MigrationRunsService();
    (server as unknown as Internals).started = true;
    (server as unknown as Internals).bootHold = false;
    (server as unknown as Internals).query = async (sql, params) => {
      const result = await dataSource.query(sql, params);
      // TypeORM answers UPDATE/DELETE with [rows, count]; the service's pg pool answers with rows.
      return /^\s*(UPDATE|DELETE)/i.test(sql) ? result[0] : result;
    };
    return server;
  };
  const stubRunChild = (server: MigrationRunsService) => ((server as unknown as Internals).runChild = jest.fn());
  const holding = async (key: number, fn: () => Promise<void>) => {
    await dataSource.query('SELECT pg_advisory_lock($1)', [key]);
    try {
      await fn();
    } finally {
      await dataSource.query('SELECT pg_advisory_unlock($1)', [key]);
    }
  };
  const version = (): string => globalThis.TOOLJET_VERSION ?? 'unknown';
  // start() arms a timer that would restart runs behind a case's back; cases call restartDeadRun themselves.
  const stopDeadRunWatch = (server: MigrationRunsService) => {
    const internals = server as unknown as Internals;
    if (internals.deadRunTimer) clearInterval(internals.deadRunTimer);
    internals.deadRunTimer = null;
  };
  const seedDeadRun = () =>
    dataSource.query(
      // Back-dated: the suite transaction freezes now(), and the run that replaces it must sort above it.
      `INSERT INTO migration_runs (to_version, status, triggered_by, started_at, heartbeat_at)
       VALUES ($1, 'running', 'boot', now() - interval '6 minutes', now() - interval '5 minutes')`,
      [version()]
    );

  beforeAll(async () => {
    ({ app } = await initTestApp());
    dataSource = getDefaultDataSource();
    process.env.MIGRATION_MODE = 'async';
    service = newServer();
    await dataSource.query(MIGRATION_RUNS_DDL);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM migration_runs');
    // Some cases stub runChild on this shared instance; every case starts from the real one.
    Object.assign(service, { cachedStatus: null, runChild: MigrationRunsService.prototype['runChild'] });
    stopDeadRunWatch(service);
  });

  afterAll(async () => {
    stopDeadRunWatch(service);
    process.env.MIGRATION_MODE = originalMode;
    await dataSource.query('DROP TABLE IF EXISTS migration_run_logs, migration_runs');
    await closeTestApp(app);
  }, 60_000);

  it('should report a running row whose heartbeat stopped as failed, so it can be retried', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at, migrations)
       VALUES ('3.21.75', 'running', 'boot', now() - interval '5 minutes', '[{"name":"A","status":"done"},{"name":"B","status":"running"}]')`
    );

    const [run] = await service.runs();

    expect(run).toMatchObject({
      status: 'failed',
      migrationsDone: 1,
      migrationsTotal: 2,
      error: expect.any(String),
      triggeredBy: 'boot',
      migrations: [
        { name: 'A', status: 'done' },
        { name: 'B', status: 'failed' },
      ],
      finishedAt: expect.any(String),
    });
    await expect(service.status()).resolves.toMatchObject({ state: 'failed', toVersion: '3.21.75' });
  });

  it('should keep a running row running while its migration lock is held, however old its heartbeat', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at) VALUES ('3.21.75', 'running', 'boot', now() - interval '5 minutes')`
    );

    await holding(MIGRATION_ADVISORY_LOCK_KEY, async () => {
      await expect(service.runs()).resolves.toMatchObject([{ status: 'running' }]);
    });
  });

  describe('a booting server | its own writes wait for its data run', () => {
    const booting = () =>
      Object.assign(newServer() as unknown as Internals, { bootHold: true }) as unknown as MigrationRunsService;
    const fresh = (server: MigrationRunsService) => {
      (server as unknown as Internals).cachedStatus = null;
      return server;
    };

    it('should answer running before its data run takes the lock, and follow the lock once it has', async () => {
      const server = booting();

      await expect(server.status()).resolves.toEqual({ state: 'running' });
      await holding(MIGRATION_ACTIVE_LOCK_KEY, async () => {
        await expect(fresh(server).status()).resolves.toEqual({ state: 'running' });
      });
      await expect(fresh(server).status()).resolves.toEqual({ state: 'idle' });
    });

    it('should retry on boot a failed run of this version, so a restart or new image is the fix', async () => {
      await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at) VALUES ($1, 'failed', 'boot', now())`,
        [version()]
      );
      const server = booting();
      const runChild = stubRunChild(server);

      await server.start();
      stopDeadRunWatch(server);

      expect(runChild).toHaveBeenCalledWith('boot');
    });

    it('should release the hold when start() cannot run, failing open like the gate', async () => {
      const server = booting();
      const internals = server as unknown as Internals;
      const query = internals.query;
      internals.query = (sql, params) =>
        sql === MIGRATION_RUNS_DDL ? Promise.reject(new Error('connection refused')) : query(sql, params);

      await expect(server.start()).rejects.toThrow('connection refused');
      stopDeadRunWatch(server);

      await expect(server.status()).resolves.toEqual({ state: 'idle' });
    });
  });

  it("should report another server's migration from its lock before any run row exists", async () => {
    await holding(MIGRATION_ACTIVE_LOCK_KEY, async () => {
      await expect(newServer().status()).resolves.toEqual({ state: 'running' });
    });
    await expect(newServer().status()).resolves.toEqual({ state: 'idle' });
  });

  it('should report running while another migrator holds the active lock, whatever the latest row says', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', 'succeeded', 'boot')`
    );

    await holding(MIGRATION_ACTIVE_LOCK_KEY, async () => {
      await expect(newServer().status()).resolves.toMatchObject({ state: 'running', toVersion: '3.21.75' });
    });
  });

  it('should answer a burst of status reads with one read', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', 'succeeded', 'boot')`
    );
    const server = newServer();
    const query = jest.spyOn(server as unknown as Internals, 'query');

    await Promise.all(Array.from({ length: 20 }, () => server.status()));

    // The locks and the latest run: one read of each for the whole burst.
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('should fail open when the status cannot be read', async () => {
    const server = newServer();
    (server as unknown as Internals).query = () => Promise.reject(new Error('connection refused'));

    await expect(server.status()).resolves.toEqual({ state: 'idle' });
  });

  it("should not boot or restart a newer release's run, whose migrations this build cannot see", async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, error) VALUES ('999.0.0', 'failed', 'boot', $1)`,
      ['The migrating server stopped without reporting a result.']
    );
    const server = newServer();
    const runChild = stubRunChild(server);

    await server.start();
    stopDeadRunWatch(server);
    await server.restartDeadRun();

    expect(runChild).not.toHaveBeenCalled();
    await expect(dataSource.query('SELECT status FROM migration_runs')).resolves.toEqual([{ status: 'failed' }]);
  });

  it("should not refuse writes on an older server for a newer release's failed run", async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('999.0.0', 'failed', 'boot')`
    );
    const server = newServer();
    stubRunChild(server);
    await server.start();
    stopDeadRunWatch(server);

    await expect(server.status()).resolves.toMatchObject({ state: 'idle' });
  });

  it('should start the boot run from the dead-run check when start() failed at boot', async () => {
    const server = newServer();
    const internals = server as unknown as Internals;
    const query = internals.query;
    internals.started = false;
    internals.query = () => Promise.reject(new Error('connection refused'));
    await expect(server.start()).rejects.toThrow('connection refused');
    stopDeadRunWatch(server);
    internals.query = query;
    const runChild = stubRunChild(server);

    await server.restartDeadRun();

    expect(runChild).toHaveBeenCalledWith('recovery');
  });

  it('should start one runner when the dead-run check fires during a slow boot start()', async () => {
    const server = newServer();
    (server as unknown as Internals).started = false;
    const runChild = stubRunChild(server);

    await Promise.all([server.start(), server.restartDeadRun()]);
    stopDeadRunWatch(server);

    expect(runChild.mock.calls).toEqual([['boot']]);
  });

  it('should rerun on boot a run whose server stopped, since the migration itself did not fail', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at) VALUES ($1, 'running', 'boot', now() - interval '5 minutes')`,
      [version()]
    );
    const runChild = stubRunChild(service);

    await service.start();

    expect(runChild).toHaveBeenCalledWith('boot');
  });

  describe('restartDeadRun | a run whose server stopped after the other servers booted', () => {
    it('should claim the stopped run on one server only, without waiting for a boot', async () => {
      await seedDeadRun();
      const servers = [newServer(), newServer()];
      const runChildren = servers.map(stubRunChild);

      await Promise.all(servers.map((server) => server.restartDeadRun()));

      const calls = runChildren.flatMap((runChild) => runChild.mock.calls);
      expect(calls).toEqual([['recovery', { runId: expect.any(String) }]]);
      await expect(service.runs()).resolves.toMatchObject([
        { status: 'running', triggeredBy: 'recovery' },
        { status: 'failed', error: 'The migrating server stopped without reporting a result.' },
      ]);
    });

    it('should leave it while a migrator holds the migration lock', async () => {
      await seedDeadRun();
      await dataSource.query(
        `UPDATE migration_runs SET status = 'failed', error = 'The migrating server stopped without reporting a result.'`
      );
      const runChild = stubRunChild(service);

      await holding(MIGRATION_ADVISORY_LOCK_KEY, () => service.restartDeadRun());

      expect(runChild).not.toHaveBeenCalled();
    });

    it('should leave a run whose migration failed to the next boot', async () => {
      await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by, error) VALUES ($1, 'failed', 'boot', 'relation "x" already exists')`,
        [version()]
      );
      const runChild = stubRunChild(service);

      await service.restartDeadRun();

      expect(runChild).not.toHaveBeenCalled();
    });
  });

  describe('workers (WORKER=true) | background jobs wait while writes are refused', () => {
    const originalWorker = process.env.WORKER;
    afterEach(() => {
      process.env.WORKER = originalWorker;
      jest.useRealTimers();
    });

    it('should pause every queue worker from boot and resume once migrations succeed', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      process.env.WORKER = 'true';
      const worker = { pause: jest.fn().mockResolvedValue(undefined), resume: jest.fn() };
      const host = Object.assign(Object.create(WorkerHost.prototype), { _worker: worker });
      const server = new MigrationRunsService({ getProviders: () => [{ instance: host }, { instance: {} }] } as never);
      const status = jest.spyOn(server, 'status').mockResolvedValue({ state: 'running' });

      (server as unknown as { holdJobsWhileMigrating: () => void }).holdJobsWhileMigrating();
      expect(worker.pause).toHaveBeenCalledWith(true);

      await jest.advanceTimersByTimeAsync(5000);
      expect(worker.resume).not.toHaveBeenCalled();

      status.mockResolvedValue({ state: 'succeeded' });
      await jest.advanceTimersByTimeAsync(5000);
      expect(worker.resume).toHaveBeenCalledTimes(1);
      await server.onApplicationShutdown();
    });
  });

  it("should return one migration's log lines, or the whole run's", async () => {
    const [{ id }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', 'running', 'boot') RETURNING id`
    );
    await dataSource.query(
      `INSERT INTO migration_run_logs (run_id, migration, line) VALUES
         ($1, NULL, '[migrations] 2 migration(s) pending: A, B'), ($1, 'A', 'A: [PROGRESS] 1/2'), ($1, 'B', 'B: [PROGRESS] 1/9')`,
      [id]
    );

    await expect(service.log(id, 'A')).resolves.toBe('A: [PROGRESS] 1/2');
    await expect(service.log(id)).resolves.toBe(
      '[migrations] 2 migration(s) pending: A, B\nA: [PROGRESS] 1/2\nB: [PROGRESS] 1/9'
    );
  });

  it("should drop earlier runs' logs once a run succeeds, keeping their history rows", async () => {
    const [{ id: older }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, log_tail) VALUES ('3.21.74', 'failed', 'boot', '{boom}') RETURNING id`
    );
    const [{ id: latest }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', 'succeeded', 'boot') RETURNING id`
    );
    await dataSource.query(`INSERT INTO migration_run_logs (run_id, line) VALUES ($1, 'old'), ($2, 'new')`, [
      older,
      latest,
    ]);

    await (service as unknown as { dropEarlierLogs: (id: string) => Promise<void> }).dropEarlierLogs(latest);

    await expect(service.log(older)).resolves.toBe('');
    await expect(service.log(latest)).resolves.toBe('new');
    expect((await service.runs()).map((run) => run.logTail)).toEqual([[], []]);
  });

  describe('a real runner process | what the page reads back', () => {
    const runner = `node ${require.resolve('../../migrations/fixtures/fake-runner/runner.js')}`;
    const originalCommand = process.env.MIGRATION_SETUP_COMMAND;

    afterEach(() => {
      process.env.MIGRATION_SETUP_COMMAND = originalCommand;
    });

    async function waitForRow(): Promise<void> {
      while ((await dataSource.query('SELECT 1 FROM migration_runs')).length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    async function runToExit(args = ''): Promise<void> {
      process.env.MIGRATION_SETUP_COMMAND = `${runner} ${args}`;
      await service.start();
      const internals = service as unknown as { child: unknown; finalWrite: Promise<void> | null };
      while (internals.child) await new Promise((resolve) => setTimeout(resolve, 50));
      await internals.finalWrite;
    }

    it('should record a successful run with per-migration durations and logs', async () => {
      await runToExit();

      const [run] = await service.runs();
      expect(run).toMatchObject({
        status: 'succeeded',
        migrations: [
          { name: 'AddThing1', status: 'done', durationMs: 12 },
          { name: 'BackfillThing2', status: 'done', durationMs: 40 },
        ],
      });
      await expect(service.log(run.id, 'BackfillThing2')).resolves.toBe(
        '[migrations] START BackfillThing2\nBackfillThing2: [PROGRESS] 5/10 (50%)\n[migrations] DONE BackfillThing2 40ms'
      );
    });

    it('should release the boot hold once a runner with nothing pending exits', async () => {
      Object.assign(service, { bootHold: true });

      await runToExit('none');

      await expect(service.status()).resolves.toEqual({ state: 'idle' });
    });

    it('should record success when a stopped run had already committed, so writes are no longer refused', async () => {
      await seedDeadRun();

      await runToExit('none');

      await expect(service.status()).resolves.toMatchObject({ state: 'succeeded' });
    });

    it('should mark a run stopped by this server shutting down as stopped, not failed, so the next boot retries it', async () => {
      process.env.MIGRATION_SETUP_COMMAND = `${runner} slow`;
      await service.start();
      await waitForRow();

      await service.onApplicationShutdown();

      const [run] = await service.runs();
      expect(run).toMatchObject({
        status: 'failed',
        error: 'The migrating server stopped without reporting a result.',
      });
      Object.assign(service, { shuttingDown: false, pool: null });
    });

    it('should take over the row of a pod killed seconds ago, so the run that does the work is recorded', async () => {
      // Heartbeat too fresh for the dead-run rule: the pod restarted before the row went stale.
      await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by, started_at, heartbeat_at)
         VALUES ($1, 'running', 'boot', now() - interval '6 seconds', now() - interval '5 seconds')`,
        [version()]
      );

      await runToExit();

      const [run, killed] = await service.runs();
      expect(run).toMatchObject({ status: 'succeeded', migrationsDone: 2, triggeredBy: 'boot' });
      expect(killed).toMatchObject({
        status: 'failed',
        error: 'The migrating server stopped without reporting a result.',
      });
      await expect(service.log(run.id, 'AddThing1')).resolves.toContain('DONE AddThing1');
    });

    it('should leave a finished row as it is, and keep the logs, when its claimed runner later succeeds', async () => {
      // A recovery claim whose row a boot runner took over: the boot run did the work and owns the logs.
      const [{ id: claimed }] = await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by, error, started_at, finished_at)
         VALUES ($1, 'failed', 'recovery', $2, now() - interval '1 minute', now()) RETURNING id`,
        [version(), 'The migrating server stopped without reporting a result.']
      );
      const [{ id: worker }] = await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at)
         VALUES ($1, 'succeeded', 'boot', now()) RETURNING id`,
        [version()]
      );
      await dataSource.query(`INSERT INTO migration_run_logs (run_id, line) VALUES ($1, 'did the work')`, [worker]);
      process.env.MIGRATION_SETUP_COMMAND = `${runner} none`;

      (service as unknown as { runChild: (by: string, opts: { runId: string }) => void }).runChild('recovery', {
        runId: claimed,
      });
      const internals = service as unknown as { child: unknown; finalWrite: Promise<void> | null };
      while (internals.child) await new Promise((resolve) => setTimeout(resolve, 50));
      await internals.finalWrite;

      await expect(
        dataSource.query('SELECT status, error FROM migration_runs WHERE id = $1', [claimed])
      ).resolves.toEqual([{ status: 'failed', error: 'The migrating server stopped without reporting a result.' }]);
      await expect(service.log(worker)).resolves.toBe('did the work');
    });

    it('should record nothing when another server holds the lock and this runner skips', async () => {
      await runToExit('skip');

      await expect(service.runs()).resolves.toEqual([]);
    });

    it('should record a failed run with the failing migration and error', async () => {
      await runToExit('fail');

      const [run] = await service.runs();
      expect(run).toMatchObject({
        status: 'failed',
        error: expect.stringContaining('deadlock detected'),
        migrations: [
          { name: 'AddThing1', status: 'done' },
          { name: 'BackfillThing2', status: 'failed', percent: 50 },
        ],
      });
    });
  });

  it('should list runs newest first', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, started_at) VALUES
         ('3.21.74', 'succeeded', 'boot', now() - interval '1 day'),
         ('3.21.75', 'running', 'boot', now())`
    );

    const runs = await service.runs();

    expect(runs.map((run) => run.toVersion)).toEqual(['3.21.75', '3.21.74']);
  });
});
