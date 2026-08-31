import { AbilityBuilder, Ability } from '@casl/ability';
import { App } from 'src/entities/app.entity';
import { FEATURE_KEY } from 'src/modules/data-queries/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { APP_TYPES } from 'src/modules/apps/constants';
import { UserAllPermissions } from 'src/modules/app/types';
import { defineDataQueryAppAbility } from 'src/modules/data-queries/ability/app/data-query-app.ability';
import { FeatureAbility } from 'src/modules/data-queries/ability/app';

// ---------------------------------------------------------------------------
// Regression coverage for two bugs in defineDataQueryAppAbility:
//  1. `app?.type === MODULE && isBuilder` unconditionally granted full data-query
//     CRUD on every module's queries — stale bypass predating module granular
//     permissions.
//  2. Permissions were always read from MODULES.APP even for module-type apps,
//     instead of resolving MODULES.MODULES (the bucket module granular
//     permissions actually populate).
// ---------------------------------------------------------------------------

function buildAbility(permissions: Partial<UserAllPermissions>, app: App): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  defineDataQueryAppAbility(can as any, permissions as UserAllPermissions, app);
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

describe('defineDataQueryAppAbility — module apps', () => {
  it('builder with NO module data-source permissions cannot CREATE/UPDATE/DELETE queries on a module', () => {
    const ability = buildAbility(makePermissions(), moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.UPDATE, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.DELETE, App)).toBe(false);
  });

  it('builder with moduleCreate=true CAN CREATE queries on a module (moduleCreate, not appCreate, gates it)', () => {
    const permissions = makePermissions({
      userPermission: { ...baseUserPermission(), moduleCreate: true } as any,
    });
    const ability = buildAbility(permissions, moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(true);
  });

  it('builder with appCreate=true (front-end bucket) does NOT get module query access', () => {
    const permissions = makePermissions({
      userPermission: { ...baseUserPermission(), appCreate: true } as any,
    });
    const ability = buildAbility(permissions, moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(false);
  });

  it('builder with MODULES.isAllEditable=true CAN edit queries on a module', () => {
    const permissions = makePermissions({
      userPermission: {
        ...baseUserPermission(),
        [MODULES.MODULES]: { isAllEditable: true, editableAppsId: [], isAllViewable: false, viewableAppsId: [] },
      } as any,
    });
    const ability = buildAbility(permissions, moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.UPDATE, App)).toBe(true);
  });

  it('admin can always CRUD queries on a module regardless of granular permissions', () => {
    const permissions = makePermissions({
      isAdmin: true,
      userPermission: { ...baseUserPermission(), isAdmin: true } as any,
    });
    const ability = buildAbility(permissions, moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.DELETE, App)).toBe(true);
  });
});
