/**
 * @group workflows
 *
 * GATE 8, Step 8.4f (phase-8-implementation.md "## Verification — GATE 8", Step 8.4 Tests
 * section): "blockedFields: 400 toggling on the default branch in multi-branch mode; success in
 * single-branch." Direct-service-call unit coverage of `WorkflowWebhooksService.updateWorkflow`
 * (`ee/workflows/services/workflow-webhooks.service.ts:133-212`) — the method this session's
 * `blockedFields` fix landed in (2026-09-12), which had zero unit coverage of its own before this
 * file (`docs/server-specs.md`, tooljet-qa-suite repo).
 *
 * `updateWorkflow` reads only three of its seven constructor dependencies — `manager`,
 * `_dataSource`, and `gitSyncConfigsUtilService` (verified by reading the method body in full) —
 * so this instantiates the service directly against the REAL test database (same `saveEntity`/
 * `updateEntity` helpers every other DB-backed spec in this repo uses) and stubs only
 * `gitSyncConfigsUtilService.getDetails`, the one external signal the method's branching logic
 * depends on. This is cheaper and more faithful than mocking the query-builder chains, and avoids
 * standing up a real org git-sync config + license (`workflow-lifecycle.e2e-spec.ts`'s pattern,
 * which needs a live git server) for logic that doesn't touch git at all.
 *
 * Mechanism, read directly from workflow-webhooks.service.ts before writing any assertion:
 *   - `:156-158` — `const { isEnabled: isGitSyncEnabled, isMultiBranchingEnabled } =
 *     await this.gitSyncConfigsUtilService.getDetails(...)`.
 *   - `:159-175` — gated on `isGitSyncEnabled && isMultiBranchingEnabled` (both true); within
 *     that, `onDefaultBranch` is `!branchId || branchId === defaultBranch.id`; within THAT, the
 *     block only throws when `versionToCheck?.isSynced !== false` — an explicitly unsynced draft
 *     (`isSynced === false`) is exempt, mirroring `apps/service.ts:376-388`'s exemption.
 *   - `:180-201` — `targetRow` resolves a BRANCH-type row for a feature branch, or the default
 *     branch's latest non-stub DRAFT VERSION-type row otherwise; `:203` 404s
 *     `'No editable version found for this workflow'` if neither exists.
 *   - `:204` writes `workflowEnabled` onto `targetRow.id` only — the propagation to sibling rows
 *     is the DB trigger's job (`workflow-enablement-triggers.e2e-spec.ts`), not this method's.
 *   - `:208-210` — mints a `workflowApiToken` lazily, unconditional of the enable/disable value,
 *     only when the app doesn't already have one.
 */
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
  getDefaultDataSource,
} from 'test-helper';
import { INestApplication } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
import { WorkflowWebhooksService } from '@ee/workflows/services/workflow-webhooks.service';

jest.setTimeout(60_000);

type GitDetails = { isEnabled: boolean; isMultiBranchingEnabled: boolean };

/** Builds the service with real DB access and a stubbed git-sync signal — see file header. */
function buildService(getDetails: () => Promise<GitDetails> | GitDetails) {
  const ds = getDefaultDataSource();
  const gitSyncConfigsUtilServiceStub = { getDetails: jest.fn().mockImplementation(getDetails) };
  return new WorkflowWebhooksService(
    ds.manager,
    {} as never,
    {} as never,
    ds,
    {} as never,
    {} as never,
    gitSyncConfigsUtilServiceStub as never
  );
}

describe('WorkflowWebhooksService.updateWorkflow — blockedFields (GATE 8, Step 8.4f)', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  async function seedWorkflow(namePrefix: string) {
    const admin = await createAdmin(nestApp, `${namePrefix}-${Date.now()}@tooljet.io`);
    const orgId = admin.user.organizationId;
    const defaultBranch = await resolveOrSeedDefaultBranch(orgId);
    const workflow = await createApplication(nestApp, { name: namePrefix, user: admin.user, type: 'workflow' });
    const draft = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
    await updateEntity(AppVersion, draft.id, {
      branchId: defaultBranch.id,
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.VERSION,
      isStub: false,
      workflowEnabled: false,
      isSynced: true,
    });
    return { orgId, workflow, defaultBranch, draft };
  }

  it('multi-branch mode rejects toggling a SYNCED default-branch draft with the exact message', async () => {
    const { workflow } = await seedWorkflow('g8-bf-multi-synced');
    const service = buildService(() => ({ isEnabled: true, isMultiBranchingEnabled: true }));

    await expect(service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, undefined)).rejects.toThrow(
      "Editing workflow_enabled isn't allowed on the default branch. Switch to a feature branch to update."
    );
  });

  it('multi-branch mode allows an UNSYNCED default-branch draft (never-pushed exemption)', async () => {
    const { workflow, draft } = await seedWorkflow('g8-bf-multi-unsynced');
    await updateEntity(AppVersion, draft.id, { isSynced: false });
    const service = buildService(() => ({ isEnabled: true, isMultiBranchingEnabled: true }));

    const result = await service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, undefined);

    expect(result).toEqual({ statusCode: 200 });
    const reloaded = await findEntityOrFail(AppVersion, { id: draft.id });
    expect(reloaded.workflowEnabled).toBe(true);
  });

  it('multi-branch mode allows a write scoped to a feature branch (not the default branch)', async () => {
    const { workflow, orgId } = await seedWorkflow('g8-bf-multi-feature');
    const featureBranch = await saveEntity(WorkspaceBranch, {
      organizationId: orgId,
      name: `feat-${Date.now()}`,
      isDefault: false,
    });
    const branchRow = await createApplicationVersion(nestApp, workflow as App & { organizationId: string });
    await updateEntity(AppVersion, branchRow.id, {
      branchId: featureBranch.id,
      versionType: AppVersionType.BRANCH,
      isStub: false,
      workflowEnabled: false,
    });
    const service = buildService(() => ({ isEnabled: true, isMultiBranchingEnabled: true }));

    const result = await service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, featureBranch.id);

    expect(result).toEqual({ statusCode: 200 });
    const reloaded = await findEntityOrFail(AppVersion, { id: branchRow.id });
    expect(reloaded.workflowEnabled).toBe(true);
  });

  it('single-branch mode allows toggling a synced default-branch draft (no branch context restriction)', async () => {
    const { workflow, draft } = await seedWorkflow('g8-bf-single-branch');
    const service = buildService(() => ({ isEnabled: true, isMultiBranchingEnabled: false }));

    const result = await service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, undefined);

    expect(result).toEqual({ statusCode: 200 });
    const reloaded = await findEntityOrFail(AppVersion, { id: draft.id });
    expect(reloaded.workflowEnabled).toBe(true);
  });

  it('git-off allows toggling a synced default-branch draft (no git config at all)', async () => {
    const { workflow, draft } = await seedWorkflow('g8-bf-git-off');
    const service = buildService(() => ({ isEnabled: false, isMultiBranchingEnabled: false }));

    const result = await service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, undefined);

    expect(result).toEqual({ statusCode: 200 });
    const reloaded = await findEntityOrFail(AppVersion, { id: draft.id });
    expect(reloaded.workflowEnabled).toBe(true);
  });

  it('mints a workflow_api_token lazily on first toggle, unconditional of enable/disable', async () => {
    const { workflow } = await seedWorkflow('g8-bf-token-mint');
    const before = await findEntityOrFail(App, { id: workflow.id });
    expect(before.workflowApiToken).toBeFalsy();
    const service = buildService(() => ({ isEnabled: false, isMultiBranchingEnabled: false }));

    await service.updateWorkflow(workflow.id, { isEnable: 'someOtherValue' }, undefined);

    const after = await findEntityOrFail(App, { id: workflow.id });
    expect(after.workflowApiToken).toBeTruthy();
  });

  it('404s when no editable version exists for the target branch', async () => {
    const { workflow, orgId } = await seedWorkflow('g8-bf-no-editable-version');
    const emptyFeatureBranch = await saveEntity(WorkspaceBranch, {
      organizationId: orgId,
      name: `feat-empty-${Date.now()}`,
      isDefault: false,
    });
    const service = buildService(() => ({ isEnabled: true, isMultiBranchingEnabled: true }));

    await expect(
      service.updateWorkflow(workflow.id, { isEnable: 'endPointTrigger' }, emptyFeatureBranch.id)
    ).rejects.toThrow('No editable version found for this workflow');
  });
});
