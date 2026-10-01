/**
 * Regression guard for Phase 2 Step 2.1 (workflow-git-sync).
 *
 * Removing the `isWorkflow` short-circuit from AppsSubscriber means a workflow App entity loaded on a
 * GIT-ON workspace no longer carries `editingVersion` — the subscriber deliberately leaves it unset so
 * callers branch-resolve. `resolveReleasedVersionId` was the only workflow-exclusive consumer of that
 * hydration, and its `app?.editingVersion?.id` fallback silently became `null` for a workflow that has
 * never been released. Reachable by triggering an unreleased workflow in a git-enabled workspace.
 *
 * It now falls back to an explicit default-branch VERSION lookup. These tests pin all three tiers so a
 * later "simplification" can't collapse them back.
 *
 * resolveReleasedVersionId is private and touches only appsRepository + gitSyncConfigsUtilService, so
 * the real method is driven off the prototype with just those set — no DI graph needed. Same approach as
 * apps-service-delete-git-lock.spec.ts.
 *
 * @group workflows
 */
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';
import { AppVersionType } from '@entities/app_version.entity';

type ResolveFn = (appId: string, manager?: unknown) => Promise<string | null>;

const DEFAULT_BRANCH_ID = 'branch-default';

const makeSvc = (opts: {
  app: Record<string, unknown> | null;
  defaultBranchId?: string | null;
  defaultBranchVersion?: { id: string } | null;
}) => {
  const findOneAppVersion = jest.fn().mockResolvedValue(opts.defaultBranchVersion ?? null);
  const getDetails = jest.fn().mockResolvedValue({
    options: { defaultBranch: opts.defaultBranchId === null ? undefined : { id: opts.defaultBranchId } },
  });

  const svc = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
  (svc as any).appsRepository = {
    findOne: jest.fn().mockResolvedValue(opts.app),
    manager: { findOne: findOneAppVersion },
  };
  (svc as any).gitSyncConfigsUtilService = { getDetails };

  const resolve = (svc as any).resolveReleasedVersionId.bind(svc) as ResolveFn;
  return { resolve, findOneAppVersion, getDetails };
};

const workflowApp = (over: Record<string, unknown> = {}) => ({
  id: 'wf-1',
  organizationId: 'org-1',
  currentVersionId: null,
  ...over,
});

describe('EE WorkflowExecutionsService | resolveReleasedVersionId', () => {
  afterEach(() => jest.resetAllMocks());

  it('should return App.currentVersionId when the workflow has been released', async () => {
    const { resolve, getDetails } = makeSvc({ app: workflowApp({ currentVersionId: 'v-released' }) });

    await expect(resolve('wf-1')).resolves.toBe('v-released');
    // Released is the first tier — no git config read, no version query.
    expect(getDetails).not.toHaveBeenCalled();
  });

  it('should fall back to the subscriber-hydrated editing version when git is off', async () => {
    const { resolve, getDetails } = makeSvc({
      app: workflowApp({ editingVersion: { id: 'v-editing' } }),
    });

    await expect(resolve('wf-1')).resolves.toBe('v-editing');
    expect(getDetails).not.toHaveBeenCalled();
  });

  it('should resolve the default-branch version when git is on and editingVersion is absent', async () => {
    const { resolve, findOneAppVersion, getDetails } = makeSvc({
      app: workflowApp(),
      defaultBranchId: DEFAULT_BRANCH_ID,
      defaultBranchVersion: { id: 'v-default-branch' },
    });

    // The Phase 2 Step 2.1 regression: this returned null before the explicit lookup was added.
    await expect(resolve('wf-1')).resolves.toBe('v-default-branch');
    expect(getDetails).toHaveBeenCalledWith('org-1');
    expect(findOneAppVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: expect.objectContaining({
          appId: 'wf-1',
          branchId: DEFAULT_BRANCH_ID,
          versionType: AppVersionType.VERSION,
          isStub: false,
        }),
      })
    );
  });

  it('should return null when git is on but the workspace has no default branch', async () => {
    const { resolve, findOneAppVersion } = makeSvc({ app: workflowApp(), defaultBranchId: null });

    await expect(resolve('wf-1')).resolves.toBeNull();
    expect(findOneAppVersion).not.toHaveBeenCalled();
  });

  it('should return null when the default branch has no non-stub VERSION row', async () => {
    const { resolve } = makeSvc({
      app: workflowApp(),
      defaultBranchId: DEFAULT_BRANCH_ID,
      defaultBranchVersion: null,
    });

    await expect(resolve('wf-1')).resolves.toBeNull();
  });

  it('should return null when the app does not exist', async () => {
    const { resolve, getDetails } = makeSvc({ app: null, defaultBranchId: DEFAULT_BRANCH_ID });

    await expect(resolve('wf-1')).resolves.toBeNull();
    expect(getDetails).not.toHaveBeenCalled();
  });
});
