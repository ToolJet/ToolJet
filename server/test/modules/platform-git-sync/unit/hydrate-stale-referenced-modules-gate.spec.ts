/**
 * Regression: opening an app must not re-clone git for referenced modules that are already
 * materialized.
 *
 * hydrateStaleReferencedModules used to route EVERY ModuleViewer target through hydrateStubApp
 * ("always ask git"), so a host app with N referenced modules paid N clones on every open — its
 * tree-SHA early-out still had to clone to find out. It now does what its contract says: hydrate
 * only modules that still have an `is_stub` version on the branch. Provider auth (used for pinned
 * version tags) is resolved lazily so an all-materialized app never talks to the provider either.
 *
 * @group gitsync
 */
/// <reference types="jest" />
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn(),
  getConnectionInstance: jest.fn(),
}));

import { dbTransactionWrap } from '@helpers/database.helper';
import { PlatformGitPullService } from '@ee/platform-git-sync/pull.service';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';

const BRANCH_ID = 'branch-1';
const parentApp = { id: 'host-1', organizationId: 'org-1', type: 'front-end' } as any;
const user = { id: 'user-1', organizationId: 'org-1' } as any;

const moduleViewer = (coRelationId: string, versionName?: string) => ({
  type: 'ModuleViewer',
  properties: {
    moduleAppId: { value: coRelationId },
    ...(versionName ? { moduleVersionId: { versionName } } : {}),
  },
});

/**
 * One fake manager for every dbTransactionWrap callback the method makes:
 *   AppVersion + isStub:false → the parent app's materialized version
 *   AppVersion + isStub:true  → the module's stub (null = already materialized)
 *   App                       → the module's App row
 * The component query returns whatever ModuleViewers the case wires up.
 */
const wireManager = (components: any[], moduleStub: any) => {
  const manager = {
    findOne: jest.fn(async (entity: any, options: any) => {
      if (entity === AppVersion) {
        return options?.where?.isStub === true ? moduleStub : { id: 'parent-version-1' };
      }
      if (entity === App) return { id: 'module-app-1', organizationId: 'org-1', type: 'module' };
      return null;
    }),
    createQueryBuilder: jest.fn(() => {
      const chain: any = {
        innerJoin: () => chain,
        where: () => chain,
        andWhere: () => chain,
        select: () => chain,
        getMany: async () => components,
      };
      return chain;
    }),
  };
  (dbTransactionWrap as jest.Mock).mockImplementation(async (cb: any) => cb(manager));
  return manager;
};

const makeService = () => {
  const svc = Object.create(PlatformGitPullService.prototype) as any;
  svc.hydrateStubApp = jest.fn().mockResolvedValue({ app: {}, draftVersionId: 'version-1' });
  svc.transactionLogger = { log: jest.fn(), error: jest.fn() };
  svc.organizationGitSyncRepository = { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(null) };
  svc.httpsGitSyncUtilService = {
    resolveHttpsConfigs: jest.fn(),
    getAuthenticatedOctokitForInstallation: jest.fn(),
    parseDetailsFromUrl: jest.fn(),
  };
  return svc;
};

describe('PlatformGitPullService.hydrateStaleReferencedModules — stub-only gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not hydrate a referenced module that is already materialized', async () => {
    wireManager([moduleViewer('co-rel-1')], null);
    const svc = makeService();

    await svc.hydrateStaleReferencedModules(parentApp, user, BRANCH_ID);

    expect(svc.hydrateStubApp).not.toHaveBeenCalled();
    // …and it never reaches for provider credentials on that path (auth is lazy).
    expect(svc.organizationGitSyncRepository.findOrgGitByOrganizationId).not.toHaveBeenCalled();
  });

  it('hydrates a referenced module that still has a stub version on the branch', async () => {
    wireManager([moduleViewer('co-rel-1')], { id: 'module-stub-1' });
    const svc = makeService();

    await svc.hydrateStaleReferencedModules(parentApp, user, BRANCH_ID);

    expect(svc.hydrateStubApp).toHaveBeenCalledTimes(1);
    expect(svc.hydrateStubApp).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'module-app-1' }),
      user,
      BRANCH_ID,
      undefined,
      undefined
    );
  });

  it('skips a materialized module even when its ModuleViewer pins a version tag', async () => {
    wireManager([moduleViewer('co-rel-1', 'v2')], null);
    const svc = makeService();

    await svc.hydrateStaleReferencedModules(parentApp, user, BRANCH_ID);

    expect(svc.hydrateStubApp).not.toHaveBeenCalled();
    // The pinned-tag lookup is what needs auth — skipping the module skips that round trip too.
    expect(svc.organizationGitSyncRepository.findOrgGitByOrganizationId).not.toHaveBeenCalled();
  });

  it('is a no-op when the app has no ModuleViewer components', async () => {
    const manager = wireManager([], null);
    const svc = makeService();

    await svc.hydrateStaleReferencedModules(parentApp, user, BRANCH_ID);

    expect(svc.hydrateStubApp).not.toHaveBeenCalled();
    expect(manager.findOne).not.toHaveBeenCalledWith(App, expect.anything());
  });
});
