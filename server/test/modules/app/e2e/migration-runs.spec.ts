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
  recordPending: (triggeredBy: string) => Promise<string | null>;
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
  });

  describe('POST /api/migration-runs/run | start waiting or failed migrations', () => {
    it('should reject a workspace admin with 403', async () => {
      const admin = await createAdmin(app, 'migration-retry-admin@tooljet.io');

      const response = await request(app.getHttpServer())
        .post('/api/migration-runs/run')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id);

      expect(response.statusCode).toBe(403);
    });

    it('should answer 409 to a super admin when nothing is waiting to run', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-retry-super@tooljet.io');

      const response = await request(app.getHttpServer())
        .post('/api/migration-runs/run')
        .set('Cookie', superAdmin.cookie)
        .set('tj-workspace-id', superAdmin.workspace.id);

      expect(response.statusCode).toBe(409);
    });
  });
});

describe('MigrationRunsService | async mode against real Postgres', () => {
  const originalMode = process.env.MIGRATION_MODE;
  let dataSource: DataSource;
  let app: INestApplication;
  let service: MigrationRunsService;

  /** A service as one server would hold it, its own pool routed through the suite transaction so seeded rows are visible. */
  const newServer = () => {
    const server = new MigrationRunsService();
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
  });

  afterAll(async () => {
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

  it('should let a dead run be retried: it is marked failed and a new run claimed', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at) VALUES ('3.21.75', 'running', 'boot', now() - interval '5 minutes')`
    );
    const runChild = stubRunChild(service);

    await service.run('admin@tooljet.io');

    const statuses = await dataSource.query('SELECT status FROM migration_runs ORDER BY started_at');
    expect(statuses).toEqual([{ status: 'failed' }, { status: 'running' }]);
    expect(runChild).toHaveBeenCalledWith('admin@tooljet.io', { runId: expect.any(String) });
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

  it('should refuse to run while the latest run succeeded', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at) VALUES ('3.21.75', 'succeeded', 'boot', now())`
    );

    await expect(service.run('admin@tooljet.io')).rejects.toMatchObject({ status: 409 });
  });

  it.each([
    ['failed', 'a retry'],
    ['pending', 'a waiting run'],
  ])('should start only one runner when two servers are asked to start %s (%s) together', async (status) => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', $1, 'boot')`,
      [status]
    );
    const [first, second] = [newServer(), newServer()];
    const children = [stubRunChild(first), stubRunChild(second)];

    const results = await Promise.allSettled([first.run('a@tooljet.io'), second.run('b@tooljet.io')]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(children.reduce((count, runChild) => count + runChild.mock.calls.length, 0)).toBe(1);
  });

  it('should keep one pending row when servers booting together all find work', async () => {
    const ids = await Promise.all(
      [newServer(), newServer(), service].map((server) => (server as unknown as Internals).recordPending('boot'))
    );

    expect(new Set(ids).size).toBe(1);
    await expect(dataSource.query('SELECT count(*)::int FROM migration_runs')).resolves.toEqual([{ count: 1 }]);
  });

  it('should bring a waiting run back on top when a server boots after a newer run failed, so Run claims it', async () => {
    const [{ id }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, started_at) VALUES ('3.21.75', 'pending', 'boot', now() - interval '1 hour') RETURNING id`
    );
    // Not now(): the suite transaction would give it the same timestamp as the boot below.
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, started_at) VALUES ('3.21.75', 'failed', 'boot', now() - interval '1 minute')`
    );
    const runChild = stubRunChild(service);

    await expect((service as unknown as Internals).recordPending('boot')).resolves.toBe(id);
    await expect(newServer().status()).resolves.toMatchObject({ state: 'pending' });
    await service.run('admin@tooljet.io');
    expect(runChild).toHaveBeenCalledWith('admin@tooljet.io', { runId: id });
  });

  it('should rerun on boot a run whose server stopped, since the migration itself did not fail', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at) VALUES ($1, 'running', 'boot', now() - interval '5 minutes')`,
      [version()]
    );
    const runChild = stubRunChild(service);

    await service.start();

    expect(runChild).toHaveBeenCalledWith('boot', { checkOnly: false });
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

  it('should not rerun a failed run of this version when a server boots, but should for a new version', async () => {
    const runChild = stubRunChild(service);
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ($1, 'failed', 'boot')`,
      [version()]
    );

    await service.start();
    expect(runChild).not.toHaveBeenCalled();

    await dataSource.query(`UPDATE migration_runs SET to_version = '0.0.1'`);
    await service.start();
    expect(runChild).toHaveBeenCalledWith('boot', { checkOnly: false });
  });

  it('should keep a manual-mode pending run pending however old its heartbeat, and start it on request', async () => {
    const [{ id }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at)
       VALUES ('3.21.75', 'pending', 'boot', now() - interval '2 days') RETURNING id`
    );
    const runChild = stubRunChild(service);

    await expect(service.status()).resolves.toMatchObject({ state: 'pending' });
    await service.run('admin@tooljet.io');

    expect(runChild).toHaveBeenCalledWith('admin@tooljet.io', { runId: id });
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

    it('should clear a stale waiting run when a manual-mode check finds nothing pending', async () => {
      await dataSource.query(
        `INSERT INTO migration_runs (to_version, status, triggered_by) VALUES ('3.21.75', 'pending', 'boot')`
      );
      process.env.MIGRATION_MODE = 'manual';
      const manual = newServer();
      process.env.MIGRATION_MODE = 'async';
      process.env.MIGRATION_SETUP_COMMAND = `${runner} none`;

      await manual.start();
      const internals = manual as unknown as { child: unknown; finalWrite: Promise<void> | null };
      while (internals.child) await new Promise((resolve) => setTimeout(resolve, 50));
      await internals.finalWrite;

      await expect(manual.runs()).resolves.toEqual([]);
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
