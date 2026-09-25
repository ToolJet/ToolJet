/**
 * Regression: GET /apps/:id must never pull from git for a materialized (non-stub) draft.
 *
 * getOne used to re-clone the repo on EVERY open of a non-stub draft just to compare git's
 * current tree SHA against the draft's stored git_tree_sha — one clone per app open. Hydration
 * on open now fires ONLY when the branch has an `is_stub` version. Refreshing a draft the pull
 * flagged `outdated` is the pull path's job.
 *
 * getOne runs the stub lookup → (optional) hydrate → referenced-module cascade → editing-version
 * resolution, and only then calls `appsUtilService.overlayAppMetadata` as the first statement of
 * prepareResponse. We reject that with a sentinel so we can assert what the hydration phase did
 * without wiring the whole response pipeline, and drive the real method off the prototype.
 *
 * @group gitsync
 */
/// <reference types="jest" />
import { registerPlatformGitPullService } from '@helpers/platform-git-pull-registry';
import { AppsService } from '@ee/apps/service';
import { APP_TYPES } from '@modules/apps/constants';

const BRANCH_ID = 'branch-1';
const user = { id: 'user-1', organizationId: 'org-1' } as any;

// Version rows: the stub lookup is `where.isStub === true`; every other lookup (editing-version
// resolution) asks for the materialized row.
const versionFinder = (stubVersion: any) =>
  jest.fn(async (options: any) =>
    options?.where?.isStub === true ? stubVersion : { id: 'version-1', versionType: 'version' }
  );

const makeService = (stubVersion: any) => {
  const svc = Object.create(AppsService.prototype) as any;
  svc.versionRepository = { findOne: versionFinder(stubVersion) };
  svc.appsUtilService = { overlayAppMetadata: jest.fn().mockRejectedValue(new Error('prepare-reached')) };
  svc.transactionLogger = { log: jest.fn(), error: jest.fn() };
  svc.gitSyncConfigsUtilService = { getDetails: jest.fn() };
  return svc;
};

const makeApp = (type: string = APP_TYPES.FRONT_END) =>
  ({ id: 'app-1', type, organizationId: 'org-1', editingVersion: undefined }) as any;

describe('AppsService.getOne (EE) — app open never pulls from git', () => {
  let hydrateStubApp: jest.Mock;
  let hydrateStaleReferencedModules: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    hydrateStubApp = jest.fn(async (app: any) => ({ app, draftVersionId: 'version-1' }));
    hydrateStaleReferencedModules = jest.fn().mockResolvedValue(undefined);
    registerPlatformGitPullService({
      hydrateStubApp,
      hydrateStaleReferencedModules,
      extractAppNameFromPath: jest.fn(),
      pullModules: jest.fn(),
    } as any);
  });

  it('does not hydrate — no git call — when the branch has a materialized draft', async () => {
    const svc = makeService(null);

    await expect(svc.getOne(makeApp(), user, BRANCH_ID)).rejects.toThrow('prepare-reached');

    expect(hydrateStubApp).not.toHaveBeenCalled();
    // The stub lookup is the only thing that decides it: is_stub, nothing tree-SHA shaped.
    expect(svc.versionRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isStub: true, branchId: BRANCH_ID }) })
    );
  });

  it('hydrates when the branch has a stub version', async () => {
    const app = makeApp();
    const svc = makeService({ id: 'stub-1', isStub: true });

    await expect(svc.getOne(app, user, BRANCH_ID)).rejects.toThrow('prepare-reached');

    expect(hydrateStubApp).toHaveBeenCalledTimes(1);
    expect(hydrateStubApp).toHaveBeenCalledWith(app, user, BRANCH_ID);
  });

  it('still runs the referenced-module cascade for a non-module app (the gate lives inside it)', async () => {
    const svc = makeService(null);

    await expect(svc.getOne(makeApp(), user, BRANCH_ID)).rejects.toThrow('prepare-reached');

    expect(hydrateStaleReferencedModules).toHaveBeenCalledTimes(1);
    expect(hydrateStaleReferencedModules).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'app-1' }),
      user,
      BRANCH_ID
    );
  });

  it('skips the cascade for a module (it has no ModuleViewer parent to resolve)', async () => {
    const svc = makeService(null);

    await expect(svc.getOne(makeApp(APP_TYPES.MODULE), user, BRANCH_ID)).rejects.toThrow('prepare-reached');

    expect(hydrateStaleReferencedModules).not.toHaveBeenCalled();
  });
});
