// server/test/modules/ability/unit/util.service.spec.ts
/** @group platform */
//
// AbilityUtilService (567L) is mostly QueryBuilder construction and a large
// DB-backed merge method (createUserAppsPermissions, via dbTransactionWrap +
// getConnectionInstance + real FolderApp/AppBase queries). None of that is
// meaningfully unit-testable without a real DB — it's covered by the module's
// e2e suites instead. The two pieces here are pure, observable-outcome logic
// with no DB dependency:
//   - canAccessAppInEnvironment: the OR-merge gate every env permission check goes through.
//   - getAppTypeConditions: resource-type → app-type SQL condition mapping (dedup + skip).
import { AbilityUtilService } from '@modules/ability/util.service';
import { UserAppsPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';

function basePermissions(overrides: Partial<UserAppsPermissions> = {}): UserAppsPermissions {
  return {
    editableAppsId: [],
    isAllEditable: false,
    viewableAppsId: [],
    isAllViewable: false,
    hiddenAppsId: [],
    hideAll: false,
    ownedAppsId: [],
    environmentAccess: { development: false, staging: false, production: false, released: false },
    appSpecificEnvironmentAccess: {},
    ...overrides,
  };
}

describe('AbilityUtilService.canAccessAppInEnvironment', () => {
  it('denies when neither app-specific nor default environment access is granted', () => {
    const perms = basePermissions();
    expect(AbilityUtilService.canAccessAppInEnvironment(perms, 'app-1', 'development')).toBe(false);
  });

  it('grants via default environmentAccess when app-specific access is absent', () => {
    const perms = basePermissions({
      environmentAccess: { development: true, staging: false, production: false, released: false },
    });
    expect(AbilityUtilService.canAccessAppInEnvironment(perms, 'app-1', 'development')).toBe(true);
  });

  it('grants via app-specific access when the default environmentAccess is false', () => {
    const perms = basePermissions({
      appSpecificEnvironmentAccess: {
        'app-1': { development: false, staging: true, production: false, released: false },
      },
    });
    expect(AbilityUtilService.canAccessAppInEnvironment(perms, 'app-1', 'staging')).toBe(true);
  });

  it('does not leak one app’s specific access onto a different appId', () => {
    const perms = basePermissions({
      appSpecificEnvironmentAccess: {
        'app-1': { development: true, staging: false, production: false, released: false },
      },
    });
    expect(AbilityUtilService.canAccessAppInEnvironment(perms, 'app-2', 'development')).toBe(false);
  });

  it('treats a missing environmentAccess / appSpecificEnvironmentAccess as false rather than throwing', () => {
    const perms = basePermissions({ environmentAccess: undefined, appSpecificEnvironmentAccess: undefined });
    expect(AbilityUtilService.canAccessAppInEnvironment(perms, 'app-1', 'production')).toBe(false);
  });
});

describe('AbilityUtilService.getAppTypeConditions (private)', () => {
  let service: AbilityUtilService;

  beforeEach(() => {
    service = new AbilityUtilService({} as any);
  });

  const call = (resourcesList: any[]) => (service as any).getAppTypeConditions(resourcesList);

  it('emits one condition per mapped resource type', () => {
    const { conditions, params } = call([{ resource: MODULES.APP }, { resource: MODULES.WORKFLOWS }]);

    expect(conditions).toHaveLength(2);
    expect(Object.values(params)).toEqual(expect.arrayContaining([expect.anything(), expect.anything()]));
  });

  it('dedupes repeated resource types into a single condition', () => {
    const { conditions } = call([{ resource: MODULES.APP }, { resource: MODULES.APP }, { resource: MODULES.APP }]);

    expect(conditions).toHaveLength(1);
  });

  it('skips resource types with no app-type mapping', () => {
    const { conditions, params } = call([{ resource: 'not-a-real-resource-type' as any }]);

    expect(conditions).toHaveLength(0);
    expect(Object.keys(params)).toHaveLength(0);
  });

  it('returns empty conditions/params for an empty resource list', () => {
    const { conditions, params } = call([]);

    expect(conditions).toEqual([]);
    expect(params).toEqual({});
  });
});
