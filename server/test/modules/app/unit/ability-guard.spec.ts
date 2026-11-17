// server/test/modules/app/unit/ability-guard.spec.ts
import { ForbiddenException, HttpException } from '@nestjs/common';
import { FeatureAbilityGuard as AppAbilityGuard } from '@modules/apps/ability/guard';
import { APP_TYPES } from '@modules/apps/constants';
import { MODULES } from '@modules/app/constants/modules';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { USER_TYPE } from '@modules/users/constants/lifecycle';
import { makeExecutionContext } from 'test-helper';

// test/helpers/setup.ts eagerly imports the whole AppModule (and therefore
// module-info.ts) before any per-spec jest.mock() call can register, so
// mocking this module doesn't reach AbilityGuard's own reference to it.
// MODULE_INFO is a plain mutable object shared by every consumer though, so
// we inject a dedicated namespace directly and clean it up afterwards.
const TEST_MODULE = 'TEST_MODULE__ability_guard_spec';

class TestAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return class {} as any;
  }
  protected getSubjectType() {
    return class Subject {};
  }
}

describe('AbilityGuard', () => {
  let guard: TestAbilityGuard;
  let reflector: { get: jest.Mock };
  let moduleRef: { resolve: jest.Mock };
  let licenseTermsService: { getLicenseTermsInstance: jest.Mock; getLicenseTerms: jest.Mock };
  let transactionLogger: { log: jest.Mock };
  let banListRepo: { findOne: jest.Mock };
  let orgRepo: { findOne: jest.Mock };
  let dataSource: { getRepository: jest.Mock };
  let ability: { can: jest.Mock };
  let abilityFactory: { createAbility: jest.Mock };

  const reflect = (module: string, features: string | string[]) => {
    reflector.get.mockImplementation((key: string) => {
      if (key === 'tjModuleId') return module;
      if (key === 'tjFeatureId') return features;
      return undefined;
    });
  };

  beforeAll(() => {
    (MODULE_INFO as any)[TEST_MODULE] = {
      NORMAL_FEATURE: {},
      PUBLIC_FEATURE: { isPublic: true },
      LICENSED_FEATURE: { license: 'appCount' },
      PUBLIC_LICENSED_FEATURE: { license: 'appCount', isPublic: true },
      SUPERADMIN_FEATURE: { isSuperAdminFeature: true },
      PUBLIC_APP_SENSITIVE_FEATURE: { shouldNotSkipPublicApp: true },
      DELETE_FOLDER: {},
    };
  });

  afterAll(() => {
    delete (MODULE_INFO as any)[TEST_MODULE];
  });

  beforeEach(() => {
    reflector = { get: jest.fn() };
    ability = { can: jest.fn().mockReturnValue(true) };
    abilityFactory = { createAbility: jest.fn().mockResolvedValue(ability) };
    moduleRef = { resolve: jest.fn().mockResolvedValue(abilityFactory) };
    licenseTermsService = {
      getLicenseTermsInstance: jest.fn().mockResolvedValue(true),
      getLicenseTerms: jest.fn().mockResolvedValue(true),
    };
    transactionLogger = { log: jest.fn() };
    banListRepo = { findOne: jest.fn().mockResolvedValue(null) };
    orgRepo = { findOne: jest.fn().mockResolvedValue(null) };
    dataSource = {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        // WorkspaceBanList vs Organization — differentiate by entity name.
        return entity?.name === 'Organization' ? orgRepo : banListRepo;
      }),
    };

    guard = new TestAbilityGuard(
      reflector as any,
      moduleRef as any,
      licenseTermsService as any,
      transactionLogger as any,
      dataSource as any
    );
    reflect(TEST_MODULE, ['NORMAL_FEATURE']);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns false when no tjFeatureId metadata is present', async () => {
    reflect(TEST_MODULE, undefined as any);
    const ctx = makeExecutionContext({ request: { headers: {}, user: { organizationId: 'org-1' } } });

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('throws HttpException 404 when the feature is absent from MODULE_INFO', async () => {
    reflect(TEST_MODULE, ['NO_SUCH_FEATURE']);
    const ctx = makeExecutionContext({ request: { headers: {}, user: { organizationId: 'org-1' } } });

    await expect(guard.canActivate(ctx)).rejects.toThrow(HttpException);
  });

  it('throws ForbiddenException with WORKSPACE_BANNED when the org is on the ban list', async () => {
    banListRepo.findOne.mockResolvedValue({ organizationId: 'org-1' });
    orgRepo.findOne.mockResolvedValue({ id: 'org-1', name: 'Acme' });
    const ctx = makeExecutionContext({ request: { headers: {}, user: { organizationId: 'org-1' } } });

    let caught: any;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ForbiddenException);
    const parsed = JSON.parse(caught.message);
    expect(parsed.errorType).toBe('WORKSPACE_BANNED');
    expect(parsed.workspaceName).toBe('Acme');
  });

  it('throws HttpException 451 for a public feature with no org and no instance license', async () => {
    reflect(TEST_MODULE, ['PUBLIC_LICENSED_FEATURE']);
    licenseTermsService.getLicenseTermsInstance.mockResolvedValue(false);
    const ctx = makeExecutionContext({ request: { headers: {}, user: undefined } });

    let caught: any;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect(caught.getStatus()).toBe(451);
  });

  it('returns true early when a licensed feature has no org at all (no app, no user org)', async () => {
    reflect(TEST_MODULE, ['LICENSED_FEATURE']);
    const ctx = makeExecutionContext({ request: { headers: {}, user: undefined } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws HttpException 451 when the org license does not cover the feature', async () => {
    reflect(TEST_MODULE, ['LICENSED_FEATURE']);
    licenseTermsService.getLicenseTerms.mockResolvedValue(false);
    const ctx = makeExecutionContext({ request: { headers: {}, user: { organizationId: 'org-1' } } });

    let caught: any;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect(caught.getStatus()).toBe(451);
  });

  it('returns true for a public feature without resolving the ability factory', async () => {
    reflect(TEST_MODULE, ['PUBLIC_FEATURE']);
    const ctx = makeExecutionContext({ request: { headers: {}, user: { organizationId: 'org-1' } } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(moduleRef.resolve).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException for a super-admin feature when the user is not a super admin', async () => {
    reflect(TEST_MODULE, ['SUPERADMIN_FEATURE']);
    const ctx = makeExecutionContext({
      request: { headers: {}, user: { organizationId: 'org-1', userType: USER_TYPE.WORKSPACE } },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows a super-admin feature when the user is a super admin', async () => {
    reflect(TEST_MODULE, ['SUPERADMIN_FEATURE']);
    const ctx = makeExecutionContext({
      request: { headers: {}, user: { organizationId: 'org-1', userType: USER_TYPE.INSTANCE } },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true when app is public and the feature does not require skipping the public-app check', async () => {
    reflect(TEST_MODULE, ['NORMAL_FEATURE']);
    const ctx = makeExecutionContext({
      request: { headers: {}, tj_app: { isPublic: true, organizationId: 'org-1' }, user: undefined },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns false when app is public, feature requires the check, and there is no user', async () => {
    reflect(TEST_MODULE, ['PUBLIC_APP_SENSITIVE_FEATURE']);
    const ctx = makeExecutionContext({
      request: { headers: {}, tj_app: { isPublic: true, organizationId: 'org-1' }, user: undefined },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('returns false when there is no user and the app is not public', async () => {
    reflect(TEST_MODULE, ['NORMAL_FEATURE']);
    const ctx = makeExecutionContext({
      request: { headers: {}, tj_app: { isPublic: false, organizationId: 'org-1' }, user: undefined },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('throws ForbiddenException carrying organizationId when the ability denies the feature', async () => {
    ability.can.mockReturnValue(false);
    const ctx = makeExecutionContext({
      request: {
        headers: {},
        tj_app: { isPublic: false, organizationId: 'org-1' },
        user: { organizationId: 'org-1' },
      },
    });

    let caught: any;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ForbiddenException);
    expect(caught.response.organizationId).toBe('org-1');
  });

  it('uses the grouped forbidden message for DELETE_FOLDER instead of the generic one', async () => {
    reflect(TEST_MODULE, ['DELETE_FOLDER']);
    ability.can.mockReturnValue(false);
    const ctx = makeExecutionContext({
      request: { headers: {}, user: { organizationId: 'org-1' } },
    });

    let caught: any;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      caught = e;
    }

    expect(caught.response.message).toBe('You do not have access to perform this action');
  });

  it('sets request.tj_ability when forwardAbility() is true', async () => {
    (guard as any).forwardAbility = () => true;
    const request: any = { headers: {}, user: { organizationId: 'org-1' } };
    const ctx = makeExecutionContext({ request });

    await guard.canActivate(ctx);

    expect(request.tj_ability).toBe(ability);
  });

  it('resolves organizationId precedence: app.organizationId over user.organizationId over header', async () => {
    const request: any = {
      headers: { 'tj-workspace-id': 'header-org' },
      user: { organizationId: 'user-org' },
      tj_app: { isPublic: false, organizationId: 'app-org' },
    };
    reflect(TEST_MODULE, ['LICENSED_FEATURE']);
    const ctx = makeExecutionContext({ request });

    await guard.canActivate(ctx);

    expect(licenseTermsService.getLicenseTerms).toHaveBeenCalledWith('appCount', 'app-org');
  });

  it('resolves organizationId from the tj-workspace-id header when array-valued, taking the first entry', async () => {
    // With no app and no user, only the ban-suspension check consults orgId — the
    // license check further down looks at app/user org only, so the array-header
    // parsing surfaces here via checkWorkspaceSuspended's repository lookup.
    const request: any = {
      headers: { 'tj-workspace-id': ['header-org-1', 'header-org-2'] },
      user: undefined,
    };
    reflect(TEST_MODULE, ['NORMAL_FEATURE']);
    const ctx = makeExecutionContext({ request });

    await guard.canActivate(ctx);

    expect(banListRepo.findOne).toHaveBeenCalledWith({ where: { organizationId: 'header-org-1' } });
  });

  describe('request resource isolation', () => {
    it.each([undefined, APP_TYPES.MODULE])(
      'keeps app authorization isolated from a concurrent request with type %s',
      async (secondType) => {
        const sharedGuard = new AppAbilityGuard(
          reflector as never,
          moduleRef as never,
          licenseTermsService as never,
          transactionLogger as never,
          dataSource as never
        );
        let releaseFirst: () => void;
        const firstPaused = new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
        banListRepo.findOne.mockImplementationOnce(() => firstPaused);
        abilityFactory.createAbility.mockImplementation((_user, _metadata, resources, request) => ({
          can: () =>
            !request.tj_app ||
            resources.some(
              ({ resourceType }) =>
                resourceType === (request.tj_app.type === APP_TYPES.MODULE ? MODULES.MODULES : MODULES.APP)
            ),
        }));
        const firstRequest = {
          headers: {},
          user: { organizationId: 'org-1' },
          tj_app: { type: APP_TYPES.FRONT_END, organizationId: 'org-1' },
        };
        const firstResult = sharedGuard
          .canActivate(makeExecutionContext({ request: firstRequest }))
          .catch((error: unknown) => error);
        const secondRequest = {
          headers: {},
          user: { organizationId: 'org-1' },
          ...(secondType ? { tj_app: { type: secondType, organizationId: 'org-1' } } : {}),
        };
        await expect(sharedGuard.canActivate(makeExecutionContext({ request: secondRequest }))).resolves.toBe(true);
        releaseFirst!();
        await expect(firstResult).resolves.toBe(true);
        expect(abilityFactory.createAbility).toHaveBeenCalledWith(
          firstRequest.user,
          expect.anything(),
          [{ resourceType: MODULES.APP }],
          firstRequest
        );
      }
    );
  });
});
