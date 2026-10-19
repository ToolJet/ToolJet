import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { initTestApp, closeTestApp, createSuperAdmin, createAdmin, getDefaultDataSource } from 'test-helper';
import { MigrationRunsService } from '@modules/app/migration-runs/service';

/** @group platform */
describe('MigrationRunsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
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

  describe('POST /api/migration-runs/retry | retry a failed run', () => {
    it('should reject a workspace admin with 403', async () => {
      const admin = await createAdmin(app, 'migration-retry-admin@tooljet.io');

      const response = await request(app.getHttpServer())
        .post('/api/migration-runs/retry')
        .set('Cookie', admin.cookie)
        .set('tj-workspace-id', admin.workspace.id);

      expect(response.statusCode).toBe(403);
    });

    it('should answer 409 to a super admin when there is nothing to retry', async () => {
      const superAdmin = await createSuperAdmin(app, 'migration-retry-super@tooljet.io');

      const response = await request(app.getHttpServer())
        .post('/api/migration-runs/retry')
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
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS migration_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), from_version text, to_version text NOT NULL,
        status text NOT NULL, current_migration text, progress text, migrations jsonb NOT NULL DEFAULT '[]',
        log_tail text[] NOT NULL DEFAULT '{}', error text, triggered_by text NOT NULL,
        started_at timestamptz NOT NULL DEFAULT now(), heartbeat_at timestamptz NOT NULL DEFAULT now(),
        finished_at timestamptz)`);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM migration_runs');
  });

  afterAll(async () => {
    process.env.MIGRATION_MODE = originalMode;
    await dataSource.query('DROP TABLE IF EXISTS migration_runs');
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
    });
    await expect(service.status()).resolves.toMatchObject({ state: 'failed', toVersion: '3.21.75' });
  });

  it('should refuse a retry while the latest run succeeded', async () => {
    await dataSource.query(
      `INSERT INTO migration_runs (to_version, status, triggered_by, finished_at) VALUES ('3.21.75', 'succeeded', 'boot', now())`
    );

    await expect(service.retry('admin@tooljet.io')).rejects.toMatchObject({ status: 409 });
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
