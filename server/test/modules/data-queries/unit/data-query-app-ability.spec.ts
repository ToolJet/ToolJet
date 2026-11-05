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

// ---------------------------------------------------------------------------
// Viewer runs (POST /data-queries/:id/run): an end user may run a query only through an app
// they can open. Role alone must never grant it — a blanket `isEndUser` grant used to let an end
// user run (and keep polling) queries of apps they had no access to, or had lost access to.
// ---------------------------------------------------------------------------

function frontEndAppInstance(id: string, overrides: Partial<App> = {}): App {
  return Object.assign(new App(), { id, type: APP_TYPES.FRONT_END, ...overrides });
}

function appBucket(overrides: Record<string, unknown> = {}) {
  return { isAllEditable: false, editableAppsId: [], isAllViewable: false, viewableAppsId: [], ...overrides };
}

function endUserPermissions(appPermissions = appBucket(), resourceType = MODULES.APP): UserAllPermissions {
  return makePermissions({
    isBuilder: false,
    isEndUser: true,
    resource: [{ resourceType }],
    userPermission: {
      ...baseUserPermission(),
      isBuilder: false,
      isEndUser: true,
      [MODULES.APP]: appPermissions,
      [MODULES.MODULES]: appBucket(),
    } as any,
  });
}

const VIEWER_RUN = [FEATURE_KEY.GET, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR];

describe('defineDataQueryAppAbility — end-user viewer runs', () => {
  describe('front-end app', () => {
    it('denies running queries of an app the end user has not been granted', () => {
      const ability = buildAbility(
        endUserPermissions(appBucket({ viewableAppsId: ['other-app'] })),
        frontEndAppInstance('app-1')
      );
      VIEWER_RUN.forEach((feature) => expect(ability.can(feature, App)).toBe(false));
    });

    it('denies an end user with no app grants at all (e.g. after the grant was removed)', () => {
      const ability = buildAbility(endUserPermissions(), frontEndAppInstance('app-1'));
      expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(false);
    });

    it('allows running queries of an app in the end user viewable apps', () => {
      const ability = buildAbility(
        endUserPermissions(appBucket({ viewableAppsId: ['app-1'] })),
        frontEndAppInstance('app-1')
      );
      VIEWER_RUN.forEach((feature) => expect(ability.can(feature, App)).toBe(true));
    });

    it('allows running queries when the end user can view all apps', () => {
      const ability = buildAbility(
        endUserPermissions(appBucket({ isAllViewable: true })),
        frontEndAppInstance('app-1')
      );
      expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
    });

    it('allows a viewer run of a public app without any grant, but nothing more', () => {
      const ability = buildAbility(endUserPermissions(), frontEndAppInstance('app-1', { isPublic: true }));
      expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.RUN_EDITOR, App)).toBe(false);
    });
  });

  describe('module embedded in an app', () => {
    const run = (appPermissions: ReturnType<typeof appBucket>, parents: { id: string; isPublic: boolean }[]) => {
      const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
      defineDataQueryAppAbility(
        can as any,
        endUserPermissions(appPermissions, MODULES.MODULES),
        moduleAppInstance('mod-1'),
        parents
      );
      return build();
    };

    it('allows running a module query through a parent app the end user can view', () => {
      const ability = run(appBucket({ viewableAppsId: ['parent-1'] }), [
        { id: 'parent-1', isPublic: false },
        { id: 'parent-2', isPublic: false },
      ]);
      VIEWER_RUN.forEach((feature) => expect(ability.can(feature, App)).toBe(true));
    });

    it('allows running a module query through a public parent app', () => {
      const ability = run(appBucket(), [{ id: 'parent-1', isPublic: true }]);
      expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
    });

    it('denies a module query when no parent app embedding it is viewable', () => {
      const ability = run(appBucket({ viewableAppsId: ['unrelated-app'] }), [{ id: 'parent-1', isPublic: false }]);
      VIEWER_RUN.forEach((feature) => expect(ability.can(feature, App)).toBe(false));
    });

    it('denies a module query when the module is not embedded in any released app', () => {
      const ability = run(appBucket({ isAllViewable: true }), []);
      expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(false);
    });

    it('never grants editing a module query through a parent app', () => {
      const ability = run(appBucket({ editableAppsId: ['parent-1'] }), [{ id: 'parent-1', isPublic: false }]);
      expect(ability.can(FEATURE_KEY.UPDATE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(false);
    });
  });
});
