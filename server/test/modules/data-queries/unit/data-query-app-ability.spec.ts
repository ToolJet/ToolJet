/// <reference types="jest" />
import { defineDataQueryAppAbility } from '@modules/data-queries/ability/app/data-query-app.ability';
import { FeatureAbility } from '@modules/data-queries/ability/app/index';
import { FEATURE_KEY } from '@modules/data-queries/constants';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { buildPermissions, makeAbilityBuilder, expectFeatures } from 'test-helper';

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

  describe('module-builder bypass', () => {
    it('grants full CRUD + run actions to a builder when the app is a MODULE', () => {
      const perms = buildPermissions({ isBuilder: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.MODULE }));
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('does not extend the module-builder bypass to a non-module (front-end) app', () => {
      const perms = buildPermissions({ isBuilder: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp({ type: APP_TYPES.FRONT_END }));
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
    it('grants the baseline view-only actions to a plain end user with no granular permissions', () => {
      const perms = buildPermissions({ isEndUser: true });
      const { can, build } = makeBuilder();
      defineDataQueryAppAbility(can, perms, makeApp());
      const ability = build();

      expectFeatures(ability, App, {
        allowed: VIEW_ONLY_ACTIONS,
        denied: [FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.CREATE],
      });
    });
  });
});
