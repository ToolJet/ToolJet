/**
 * @group workflows
 *
 * GATE 8, Step 8.4b (phase-8-implementation.md "## Verification — GATE 8", Step 8.4 Tests
 * section): "The data migration (8.4b): seed rows with apps.workflow_enabled = true for a
 * workflow and a non-workflow, run it, assert only workflow versions were written." Direct
 * coverage of `BackfillWorkflowEnabledOnAppVersions1787800000000` (`data-migrations/
 * 1787800000000-BackfillWorkflowEnabledOnAppVersions.ts`), invoked here the same way the CLI
 * invokes it — `up(queryRunner)` — since a data migration otherwise only runs once, on
 * deployment, with no natural hook to exercise from an HTTP or repository test.
 *
 * Mechanism, read directly from the migration before writing any assertion:
 *   - `:17` the source query scopes to `apps.type = 'workflow'` — the claim under test.
 *   - `:32-38` keyset pages by `av.id`, same scope.
 *   - `:44-51` the UPDATE carries an `IS DISTINCT FROM` guard, making a second run a no-op —
 *     asserted directly by running `up()` twice.
 */
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
  findEntityOrFail,
  getDefaultDataSource,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { BackfillWorkflowEnabledOnAppVersions1787800000000 } from '../../../../data-migrations/1787800000000-BackfillWorkflowEnabledOnAppVersions';

jest.setTimeout(60_000);

describe('BackfillWorkflowEnabledOnAppVersions1787800000000 (GATE 8, Step 8.4b)', () => {
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
    try {
      const migration = new BackfillWorkflowEnabledOnAppVersions1787800000000();
      await migration.up(queryRunner);

      const workflowVersionAfter = await findEntityOrFail(AppVersion, { id: workflowVersion.id });
      expect(workflowVersionAfter.workflowEnabled).toBe(true);

      const frontEndVersionAfter = await findEntityOrFail(AppVersion, { id: frontEndVersion.id });
      expect(frontEndVersionAfter.workflowEnabled).toBe(false);

      // Idempotent: a second run must not error and must leave the same values in place.
      await migration.up(queryRunner);
      const workflowVersionSecondRun = await findEntityOrFail(AppVersion, { id: workflowVersion.id });
      expect(workflowVersionSecondRun.workflowEnabled).toBe(true);
    } finally {
      await queryRunner.release();
    }
  });
});
