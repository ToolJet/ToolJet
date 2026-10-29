import { AbilityBuilder, Ability } from '@casl/ability';
import { App } from 'src/entities/app.entity';
import { FEATURE_KEY } from 'src/modules/app-git/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { APP_TYPES } from 'src/modules/apps/constants';
import { UserAllPermissions } from 'src/modules/app/types';
import { AppGitAbility, FeatureAbilityFactory } from 'src/modules/app-git/ability';

// ---------------------------------------------------------------------------
// Regression coverage for the stale "any builder gets full git-sync access to
// every module app" bypass (`appType === MODULE && isBuilder`) that predated
// the module granular permission model and was removed alongside the
// folder-apps fixes.
// ---------------------------------------------------------------------------

function buildAbility(permissions: Partial<UserAllPermissions>, request?: Record<string, unknown>): AppGitAbility {
  const { can, build } = new AbilityBuilder<AppGitAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions, { moduleName: '', features: [] }, request);
  return build();
}

function baseUserPermission() {
  return {
    appCreate: false,
    appDelete: false,
    moduleCreate: false,
    moduleDelete: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser: false,
    isSuperAdmin: false,
  };
}

function makePermissions(overrides: Partial<UserAllPermissions> = {}): UserAllPermissions {
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser: false,
    user: { id: 'user-1' } as any,
    resource: [{ resourceType: MODULES.MODULES }],
    userPermission: baseUserPermission() as any,
    ...overrides,
  };
}

function moduleAppInstance(id: string): App {
  const a = new App();
  (a as any).id = id;
  (a as any).type = APP_TYPES.MODULE;
  return a;
}

describe('FeatureAbilityFactory — app-git ability (module apps)', () => {
  it('builder with NO module git-sync permissions cannot GIT_UPDATE_APP on a module', () => {
    const permissions = makePermissions();
    const ability = buildAbility(permissions, { tj_app: moduleAppInstance('mod-1'), tj_resource_id: 'mod-1' });
    expect(ability.can(FEATURE_KEY.GIT_UPDATE_APP, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.GIT_SYNC_APP, App)).toBe(false);
  });

  it('builder with NO module create permission cannot GIT_CREATE_APP on a module', () => {
    const permissions = makePermissions();
    const ability = buildAbility(permissions, { tj_app: moduleAppInstance('mod-1'), tj_resource_id: 'mod-1' });
    expect(ability.can(FEATURE_KEY.GIT_CREATE_APP, App)).toBe(false);
  });

  it('builder WITH MODULES.isAllEditable=true CAN GIT_UPDATE_APP on a module', () => {
    const permissions = makePermissions({
      userPermission: {
        ...baseUserPermission(),
        [MODULES.MODULES]: { isAllEditable: true, editableAppsId: [] },
      } as any,
    });
    const ability = buildAbility(permissions, { tj_app: moduleAppInstance('mod-1'), tj_resource_id: 'mod-1' });
    expect(ability.can(FEATURE_KEY.GIT_UPDATE_APP, App)).toBe(true);
  });

  it('admin can always GIT_UPDATE_APP on a module regardless of granular permissions', () => {
    const permissions = makePermissions({
      isAdmin: true,
      userPermission: { ...baseUserPermission(), isAdmin: true } as any,
    });
    const ability = buildAbility(permissions, { tj_app: moduleAppInstance('mod-1'), tj_resource_id: 'mod-1' });
    expect(ability.can(FEATURE_KEY.GIT_UPDATE_APP, App)).toBe(true);
  });
});
