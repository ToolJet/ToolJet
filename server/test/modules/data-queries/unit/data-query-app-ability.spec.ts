/// <reference types="jest" />
import { AbilityBuilder, Ability } from '@casl/ability';
import { defineDataQueryAppAbility } from '@modules/data-queries/ability/app/data-query-app.ability';
import { FeatureAbility } from '@modules/data-queries/ability/app/index';
import { FEATURE_KEY } from '@modules/data-queries/constants';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { buildPermissions, makeAbilityBuilder, expectFeatures } from 'test-helper';
import { UserAllPermissions } from '@modules/app/types';

const makeBuilder = () => makeAbilityBuilder<FeatureAbility>();

const makeApp = (overrides: Partial<App> = {}): App =>
  ({ id: 'app-1', isPublic: false, type: APP_TYPES.FRONT_END, ...overrides }) as App;

const EDIT_ACTIONS = [
  FEATURE_KEY.GET,
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.UPDATE_DATA_SOURCE,
  FEATURE_KEY.UPDATE_ONE,
  FEATURE_KEY.RUN_EDITOR,
  FEATURE_KEY.RUN_VIEWER,
  FEATURE_KEY.PREVIEW,
  FEATURE_KEY.DELETE,
  FEATURE_KEY.CREATE,
];
const VIEW_ONLY_ACTIONS = [FEATURE_KEY.GET, FEATURE_KEY.RUN_VIEWER, FEATURE_KEY.RUN_EDITOR];

/** @group platform */
describe('defineDataQueryAppAbility', () => {
  describe('public app', () => {
    it('grants RUN_VIEWER on a public app with no other permissions', () => {
      const perms = buildPermissions();
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ isPublic: true }));
      const ability = build();

      expectFeatures(ability, App, {
        allowed: [FEATURE_KEY.RUN_VIEWER],
        denied: [FEATURE_KEY.GET, FEATURE_KEY.UPDATE],
      });
    });

    it('grants nothing on a non-public app with no permissions', () => {
      const perms = buildPermissions();
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ isPublic: false }));
      const ability = build();

      expectFeatures(ability, App, { denied: [...EDIT_ACTIONS, FEATURE_KEY.RUN_VIEWER] });
    });
  });

  describe('admin / superAdmin bypass', () => {
    it('grants full CRUD + run actions to isAdmin regardless of granular permissions', () => {
      const perms = buildPermissions({ isAdmin: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('grants full CRUD + run actions to superAdmin regardless of granular permissions', () => {
      const perms = buildPermissions({ superAdmin: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });
  });

  describe('module permissions (MODULES.MODULES bucket)', () => {
    it('grants full edit+run bucket when isAllEditable is true for a MODULE app', () => {
      const perms = buildPermissions({ userPermission: { [MODULES.MODULES]: { isAllEditable: true } } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('grants full edit+run bucket when the user has global moduleCreate, even on an unrelated module', () => {
      const perms = buildPermissions({ userPermission: { moduleCreate: true } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('does not grant module edit actions from a plain isBuilder flag with no granular module permissions', () => {
      const perms = buildPermissions({ isBuilder: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });

    it('resolves a MODULE app against MODULES.MODULES, not MODULES.APP — an APP-bucket grant does not apply', () => {
      const perms = buildPermissions({ userPermission: { [MODULES.APP]: { isAllEditable: true } } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });
  });

  describe('editable-app grants (isAllEditable / appCreate / appDelete)', () => {
    it('grants full edit+run bucket when isAllEditable is true', () => {
      const perms = buildPermissions({ userPermission: { [MODULES.APP]: { isAllEditable: true } } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('grants full edit+run bucket when the user has global appCreate, even on an unrelated app', () => {
      const perms = buildPermissions({ userPermission: { appCreate: true } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('grants full edit+run bucket when the user has global appDelete, even on an unrelated app', () => {
      const perms = buildPermissions({ userPermission: { appDelete: true } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });
  });

  describe('granular editableAppsId', () => {
    it('grants the edit+run bucket when the app id is in editableAppsId', () => {
      const perms = buildPermissions({
        userPermission: { [MODULES.APP]: { editableAppsId: ['app-1'] } } as any,
      });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ id: 'app-1' }));
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('denies the edit bucket when the app id is not in editableAppsId', () => {
      const perms = buildPermissions({
        userPermission: { [MODULES.APP]: { editableAppsId: ['some-other-app'] } } as any,
      });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ id: 'app-1' }));
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });
  });

  describe('view-only grants (isAllViewable / viewableAppsId)', () => {
    it('grants view-only actions when isAllViewable is true', () => {
      const perms = buildPermissions({ userPermission: { [MODULES.APP]: { isAllViewable: true } } as any });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, {
        allowed: VIEW_ONLY_ACTIONS,
        denied: [FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.CREATE],
      });
    });

    it('grants view-only actions when the app id is in viewableAppsId', () => {
      const perms = buildPermissions({
        userPermission: { [MODULES.APP]: { viewableAppsId: ['app-1'] } } as any,
      });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ id: 'app-1' }));
      const ability = build();

      expectFeatures(ability, App, { allowed: VIEW_ONLY_ACTIONS, denied: [FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE] });
    });

    it('denies view-only actions when the app id is not in viewableAppsId', () => {
      const perms = buildPermissions({
        userPermission: { [MODULES.APP]: { viewableAppsId: ['some-other-app'] } } as any,
      });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ id: 'app-1' }));
      const ability = build();

      expectFeatures(ability, App, { denied: VIEW_ONLY_ACTIONS });
    });
  });

  describe('end user fallback', () => {
    it('grants a plain end user nothing on a regular app with no granular permissions', () => {
      const perms = buildPermissions({ isEndUser: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, {
        denied: [...VIEW_ONLY_ACTIONS, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.CREATE],
      });
    });

    it('grants the baseline view-only actions to a plain end user on a module app (transitive access)', () => {
      const perms = buildPermissions({ isEndUser: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, {
        allowed: VIEW_ONLY_ACTIONS,
        denied: [FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.CREATE],
      });
    });
  });
});

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

function appInstance(id: string, isPublic = false): App {
  const a = new App();
  (a as any).id = id;
  (a as any).type = APP_TYPES.FRONT_END;
  (a as any).isPublic = isPublic;
  return a;
}

function endUserPermissions(appBucket: Partial<Record<string, unknown>> = {}): UserAllPermissions {
  return makePermissions({
    isBuilder: false,
    isEndUser: true,
    resource: [{ resourceType: MODULES.APP }],
    userPermission: {
      ...baseUserPermission(),
      isBuilder: false,
      isEndUser: true,
      [MODULES.APP]: {
        isAllEditable: false,
        editableAppsId: [],
        isAllViewable: false,
        viewableAppsId: [],
        ...appBucket,
      },
    } as any,
  });
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

// End Users run a regular app's queries only when it is shared with them (isAllViewable/viewableAppsId).
describe('defineDataQueryAppAbility — End User RUN_VIEWER on regular apps', () => {
  it('End User CANNOT RUN_VIEWER a regular app not shared with them', () => {
    const ability = buildAbility(endUserPermissions(), appInstance('app-unshared'));
    expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.RUN_EDITOR, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.GET, App)).toBe(false);
  });

  it('End User CAN RUN_VIEWER a regular app in their viewableAppsId', () => {
    const ability = buildAbility(endUserPermissions({ viewableAppsId: ['app-shared'] }), appInstance('app-shared'));
    expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
  });

  it('End User CAN RUN_VIEWER a regular app when their group grants view-all (isAllViewable)', () => {
    const ability = buildAbility(endUserPermissions({ isAllViewable: true }), appInstance('any-app'));
    expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
  });

  it('End User CAN RUN_VIEWER a public app even when not shared', () => {
    const ability = buildAbility(endUserPermissions(), appInstance('public-app', true));
    expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
  });

  it('End User retains RUN_VIEWER on module queries (transitive access via embedding apps)', () => {
    const ability = buildAbility(endUserPermissions(), moduleAppInstance('mod-1'));
    expect(ability.can(FEATURE_KEY.RUN_VIEWER, App)).toBe(true);
  });
});
