import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initTestApp, closeTestApp, createSuperAdmin, createAdmin, getDefaultDataSource } from 'test-helper';
import { MIGRATION_RUNS_DDL, MigrationRunsService } from '@modules/app/migration-runs/service';

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

  beforeAll(async () => {
    ({ app } = await initTestApp());
    dataSource = getDefaultDataSource();
    process.env.MIGRATION_MODE = 'async';
    service = new MigrationRunsService();
    // Route the service's own pool through the suite transaction so seeded rows are visible.
    (service as unknown as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> }).query = (sql, params) =>
      dataSource.query(sql, params);
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

  it('should refuse to run while the latest run succeeded', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at) VALUES ('3.21.75', 'succeeded', 'boot', now())`
    );

    await expect(service.run('admin@tooljet.io')).rejects.toMatchObject({ status: 409 });
  });

  it('should start only one runner when two run requests arrive together', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at) VALUES ('3.21.75', 'failed', 'boot', now())`
    );
    const runChild = jest.fn();
    (service as unknown as { runChild: jest.Mock }).runChild = runChild;

    const results = await Promise.allSettled([service.run('a@tooljet.io'), service.run('b@tooljet.io')]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(runChild).toHaveBeenCalledTimes(1);
  });

  it('should keep a manual-mode pending run pending however old its heartbeat, and start it on request', async () => {
    const [{ id }] = await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, heartbeat_at)
       VALUES ('3.21.75', 'pending', 'boot', now() - interval '2 days') RETURNING id`
    );
    const runChild = jest.fn();
    (service as unknown as { runChild: jest.Mock }).runChild = runChild;

    await expect(service.status()).resolves.toMatchObject({ state: 'pending' });
    await service.run('admin@tooljet.io');

    expect(runChild).toHaveBeenCalledWith('admin@tooljet.io', { pendingRunId: id, recordNow: true });
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
