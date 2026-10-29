/**
 * @group workflows
 *
 * GATE 8, Step 8.4 (phase-8-implementation.md "## Verification — GATE 8", Step 8.4 Tests
 * section) — server-side coverage for the two DB triggers `migrations/
 * 1787700000000-AddWorkflowEnabledToAppVersions.ts` added when webhook enablement moved from
 * `apps.workflow_enabled` to `app_versions.workflow_enabled`. This is unit/service-level coverage;
 * `tooljet-qa-suite`'s `gate-8/04` Playwright spec proves the same mechanism end-to-end over a
 * real push/merge/pull, which this suite cannot substitute for. See `docs/server-specs.md`
 * (tooljet-qa-suite repo) for the tracked gap this file closes.
 *
 * Mechanism, read directly from the migration before writing any assertion:
 *   - `propagate_workflow_enabled()` (AFTER UPDATE OF workflow_enabled, is_stub / AFTER INSERT)
 *     only PROCEEDS when the changed row itself is a non-stub DRAFT VERSION-type row belonging to
 *     a `type = 'workflow'` app (:31-32); when it proceeds, it fans the value onto every OTHER
 *     non-stub `version_type = 'version'` row of that same app_id (:33-35) — published rows
 *     included, BRANCH-type rows excluded by the `version_type = 'version'` predicate, stub rows
 *     excluded by `is_stub = false`.
 *   - `sync_published_workflow_enabled_from_draft()` (BEFORE INSERT OR UPDATE OF workflow_enabled,
 *     status) only proceeds for a non-stub PUBLISHED VERSION-type row of a workflow app (:44-45),
 *     and then copies in the value from that app's latest DRAFT (:46-49) — a BEFORE trigger, so it
 *     mutates NEW before the row is written, not after.
 *   - Both guards check `apps.type = 'workflow'` (:32, :45) — any other app type is a structural
 *     no-op, asserted directly in the third describe block rather than assumed from reading the
 *     SQL.
 */
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  updateEntity,
  saveEntity,
  findEntityOrFail,
  resolveOrSeedDefaultBranch,
} from 'test-helper';
import { App } from 'src/entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';

jest.setTimeout(120_000);

describe('workflow_enabled propagation triggers (GATE 8, Step 8.4)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  describe('propagate_workflow_enabled() — a DRAFT flip fans to sibling VERSION rows, never to BRANCH rows', () => {
    it('updates every non-stub VERSION row of the app (draft + published), skips the BRANCH row, the stub row, and a different app entirely', async () => {
      const admin = await createAdmin(nestApp, `g8-propagate-${Date.now()}@tooljet.io`);
      const orgId = admin.user.organizationId;
      const defaultBranch = await resolveOrSeedDefaultBranch(orgId);
      const featureBranch = await saveEntity(WorkspaceBranch, {
        organizationId: orgId,
        name: `feat-${Date.now()}`,
        isDefault: false,
      });

      const workflow = await createApplication(nestApp, {
        name: 'g8-propagate-wf',
        user: admin.user,
        type: 'workflow',
      });

      // The row the write lands on: the default branch's DRAFT.
      const draft = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
      await updateEntity(AppVersion, draft.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
      });

      // A sibling PUBLISHED row — must receive the fan-out.
      const published = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
      await updateEntity(AppVersion, published.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.PUBLISHED,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
      });

      // A BRANCH-type row on a feature branch — version_type excludes it from the UPDATE.
      const branchRow = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
      await updateEntity(AppVersion, branchRow.id, {
        branchId: featureBranch.id,
        versionType: AppVersionType.BRANCH,
        isStub: false,
        workflowEnabled: false,
      });

      // A stub VERSION row — is_stub excludes it from the UPDATE.
      const stubRow = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
      await updateEntity(AppVersion, stubRow.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        isStub: true,
        workflowEnabled: false,
      });

      // A different workflow app entirely — app_id scoping excludes it.
      const otherWorkflow = await createApplication(nestApp, {
        name: 'g8-propagate-other-wf',
        user: admin.user,
        type: 'workflow',
      });
      const otherDraft = await createApplicationVersion(nestApp, otherWorkflow as App & { organizationId: string });
      await updateEntity(AppVersion, otherDraft.id, {
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
      });

      // The write: flip the default branch's DRAFT. This is what a real toggle
      // (WorkflowWebhooksService.updateWorkflow) does at versions/util.service.ts level.
      await updateEntity(AppVersion, draft.id, { workflowEnabled: true });

      const publishedAfter = await findEntityOrFail(AppVersion, { id: published.id });
      expect(publishedAfter.workflowEnabled).toBe(true);

      const branchRowAfter = await findEntityOrFail(AppVersion, { id: branchRow.id });
      expect(branchRowAfter.workflowEnabled).toBe(false);

      const stubRowAfter = await findEntityOrFail(AppVersion, { id: stubRow.id });
      expect(stubRowAfter.workflowEnabled).toBe(false);

      const otherDraftAfter = await findEntityOrFail(AppVersion, { id: otherDraft.id });
      expect(otherDraftAfter.workflowEnabled).toBe(false);
    });
  });

  describe('sync_published_workflow_enabled_from_draft() — a freshly-inserted PUBLISHED row inherits the DRAFT, overriding whatever was passed in', () => {
    it('overwrites workflow_enabled: false on insert with the latest DRAFT’s true value', async () => {
      const admin = await createAdmin(nestApp, `g8-publish-inherit-${Date.now()}@tooljet.io`);
      const orgId = admin.user.organizationId;
      const defaultBranch = await resolveOrSeedDefaultBranch(orgId);

      const workflow = await createApplication(nestApp, {
        name: 'g8-publish-inherit-wf',
        user: admin.user,
        type: 'workflow',
      });

      const draft = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
      await updateEntity(AppVersion, draft.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: true,
      });

      // Inserted with workflowEnabled: false — the BEFORE INSERT trigger must override this
      // before the row is written, because the app's current DRAFT is enabled.
      const inserted = await saveEntity(AppVersion, {
        appId: workflow.id,
        name: `g8-published-${Date.now()}`,
        branchId: defaultBranch.id,
        status: AppVersionStatus.PUBLISHED,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
        appName: (workflow as App).name,
        slug: workflow.id,
      });

      const reloaded = await findEntityOrFail(AppVersion, { id: inserted.id });
      expect(reloaded.workflowEnabled).toBe(true);
    });
  });

  describe('both triggers are a structural no-op for a non-workflow app', () => {
    it('does not propagate workflow_enabled between a front-end app’s versions', async () => {
      const admin = await createAdmin(nestApp, `g8-non-workflow-${Date.now()}@tooljet.io`);
      const defaultBranch = await resolveOrSeedDefaultBranch(admin.user.organizationId);

      const frontEndApp = await createApplication(nestApp, {
        name: 'g8-non-workflow-app',
        user: admin.user,
        type: 'front-end',
      });

      const draft = await createApplicationVersion(nestApp, frontEndApp as App & { organizationId: string });
      await updateEntity(AppVersion, draft.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
      });

      const published = await createApplicationVersion(nestApp, frontEndApp as App & { organizationId: string });
      await updateEntity(AppVersion, published.id, {
        branchId: defaultBranch.id,
        status: AppVersionStatus.PUBLISHED,
        versionType: AppVersionType.VERSION,
        isStub: false,
        workflowEnabled: false,
      });

      // Column exists on every app_version row regardless of app type — flipping it directly
      // must still not cascade, since the trigger's own guard checks apps.type = 'workflow'.
      await updateEntity(AppVersion, draft.id, { workflowEnabled: true });

      const publishedAfter = await findEntityOrFail(AppVersion, { id: published.id });
      expect(publishedAfter.workflowEnabled).toBe(false);
    });
  });
});
