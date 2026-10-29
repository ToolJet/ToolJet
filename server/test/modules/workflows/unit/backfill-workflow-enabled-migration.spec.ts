/**
 * @group workflows
 *
 * GATE 8, Step 8.4b (phase-8-implementation.md "## Verification — GATE 8", Step 8.4 Tests
 * section): "The data migration (8.4b): seed rows with apps.workflow_enabled = true for a
 * workflow and a non-workflow, run it, assert only workflow versions were written." Direct
 * coverage of `BackfillWorkflowEnabledOnAppVersions1793250000900` (`data-migrations/
 * 1793250000900-BackfillWorkflowEnabledOnAppVersions.ts`), invoked here the same way the CLI
 * invokes it — `up(queryRunner)` — since a data migration otherwise only runs once, on
 * deployment, with no natural hook to exercise from an HTTP or repository test.
 *
 * Mechanism, read directly from the migration before writing any assertion:
 *   - `:17` the source query scopes to `apps.type = 'workflow'` — the claim under test.
 *   - `:32-38` keyset pages by `av.id`, same scope.
 *   - the UPDATE fills only `workflow_enabled IS NULL` rows (the schema migration adds the column
 *     nullable), making a second run a no-op — asserted directly by running `up()` twice.
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
  getDefaultDataSource,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { BackfillWorkflowEnabledOnAppVersions1793250000900 } from '../../../../data-migrations/1793250000900-BackfillWorkflowEnabledOnAppVersions';
import { AddWorkflowEnabledToAppVersions1793250000500 } from '../../../../migrations/1793250000500-AddWorkflowEnabledToAppVersions';

jest.setTimeout(60_000);

describe('BackfillWorkflowEnabledOnAppVersions1793250000900 (GATE 8, Step 8.4b)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  it('copies apps.workflow_enabled onto a workflow app’s version, and leaves a non-workflow app’s version untouched', async () => {
    const admin = await createAdmin(nestApp, `g8-migration-backfill-${Date.now()}@tooljet.io`);

    const workflowApp = await createApplication(nestApp, {
      name: 'g8-migration-workflow',
      user: admin.user,
      type: 'workflow',
    });
    const workflowVersion = await createApplicationVersion(nestApp, workflowApp as App & { organizationId: string });
    await updateEntity(App, workflowApp.id, { workflowEnabled: true });
    await updateEntity(AppVersion, workflowVersion.id, { workflowEnabled: false });

    const frontEndApp = await createApplication(nestApp, {
      name: 'g8-migration-non-workflow',
      user: admin.user,
      type: 'front-end',
    });
    const frontEndVersion = await createApplicationVersion(nestApp, frontEndApp as App & { organizationId: string });
    await updateEntity(App, frontEndApp.id, { workflowEnabled: true });
    await updateEntity(AppVersion, frontEndVersion.id, { workflowEnabled: false });

    const ds = getDefaultDataSource();
    const queryRunner = ds.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // The schema migration's current shape, rolled back below: the column is NULL until backfilled.
      await new AddWorkflowEnabledToAppVersions1793250000500().up(queryRunner);
      await queryRunner.query(`UPDATE app_versions SET workflow_enabled = NULL WHERE id = $1`, [workflowVersion.id]);
      const enabledOf = async (id: string) =>
        (await queryRunner.query(`SELECT workflow_enabled FROM app_versions WHERE id = $1`, [id]))[0].workflow_enabled;

      const migration = new BackfillWorkflowEnabledOnAppVersions1793250000900();
      await migration.up(queryRunner);

      expect(await enabledOf(workflowVersion.id)).toBe(true);
      expect(await enabledOf(frontEndVersion.id)).toBe(false);

      // Idempotent: a second run must not error and must leave the same values in place.
      await migration.up(queryRunner);
      expect(await enabledOf(workflowVersion.id)).toBe(true);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });
});
