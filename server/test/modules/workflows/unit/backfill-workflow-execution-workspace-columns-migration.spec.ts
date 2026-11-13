/**
 * @group workflows
 *
 * The backfill of workflow_executions' workspace columns is a data migration, so the schema
 * migration that adds the columns stays short. Run here the way the CLI runs it: `up(queryRunner)`.
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000 } from '../../../../data-migrations/1793450000000-BackfillWorkspaceColumnsOnWorkflowExecutions';

jest.setTimeout(60_000);

describe('BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  it('fills workspace, workflow, trigger and times on runs created before the columns existed', async () => {
    const admin = await createAdmin(nestApp, `run-columns-backfill-${Date.now()}@tooljet.io`);
    const workflow = await createApplication(nestApp, {
      name: 'run-columns-backfill',
      user: admin.user,
      type: 'workflow',
    });
    const version = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });

    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Pre-upgrade rows: the new columns are NULL.
      const insertRun = async (executed: boolean): Promise<string> =>
        (
          await queryRunner.query(
            `INSERT INTO workflow_executions (app_version_id, executed, created_at, updated_at)
             VALUES ($1, $2, '2026-01-01T00:00:00Z', '2026-01-01T00:05:00Z') RETURNING id`,
            [version.id, executed]
          )
        )[0].id;
      const finishedRun = await insertRun(true);
      const unfinishedRun = await insertRun(false);

      const readRun = async (id: string) =>
        (
          await queryRunner.query(
            `SELECT organization_id, app_id, trigger_type, started_at, finished_at FROM workflow_executions WHERE id = $1`,
            [id]
          )
        )[0];

      const migration = new BackfillWorkspaceColumnsOnWorkflowExecutions1793450000000();
      await migration.up(queryRunner);

      // created_at/updated_at have no time zone; the backfill reads them in the session's zone.
      const [times] = await queryRunner.query(
        `SELECT created_at::timestamptz AS started_at, updated_at::timestamptz AS finished_at
         FROM workflow_executions WHERE id = $1`,
        [finishedRun]
      );
      expect(await readRun(finishedRun)).toEqual({
        organization_id: workflow.organizationId,
        app_id: workflow.id,
        trigger_type: 'unknown',
        started_at: times.started_at,
        finished_at: times.finished_at,
      });
      expect(await readRun(unfinishedRun)).toMatchObject({
        organization_id: workflow.organizationId,
        app_id: workflow.id,
        finished_at: null,
      });

      // A second run finds nothing left to fill and changes nothing.
      const before = await readRun(finishedRun);
      await migration.up(queryRunner);
      expect(await readRun(finishedRun)).toEqual(before);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });
});
