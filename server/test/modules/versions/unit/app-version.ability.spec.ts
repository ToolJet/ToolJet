/// <reference types="jest" />
import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { FeatureAbility } from '@modules/versions/ability/index';
import { defineAppVersionAbility } from '@modules/versions/ability/app-version.ability';
import { FEATURE_KEY } from '@modules/versions/constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';

import { UserAllPermissions } from '@modules/app/types';
import { DEFAULT_USER_PERMISSIONS, DEFAULT_USER_APPS_PERMISSIONS } from '@modules/ability/constants';
import { User } from '@entities/user.entity';

const makeBuilder = () => new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);

const buildPermissions = (
  overrides: {
    superAdmin?: boolean;
    isAdmin?: boolean;
    isBuilder?: boolean;
    isEndUser?: boolean;
    isAllEditable?: boolean;
    isAllViewable?: boolean;
    editableAppsId?: string[];
    viewableAppsId?: string[];
    resourceType?: MODULES;
    appPromote?: boolean;
  } = {}
): UserAllPermissions => {
  const {
    superAdmin = false,
    isAdmin = false,
    isBuilder = false,
    isEndUser = false,
    isAllEditable = false,
    isAllViewable = false,
    editableAppsId = [],
    viewableAppsId = [],
    resourceType = MODULES.APP,
    appPromote = false,
  } = overrides;

  return {
    superAdmin,
    isAdmin,
    isBuilder,
    isEndUser,
    user: {} as User,
    resource: [{ resourceType }],
    userPermission: {
      ...DEFAULT_USER_PERMISSIONS,
      appPromote,
      [resourceType]: {
        ...DEFAULT_USER_APPS_PERMISSIONS,
        isAllEditable,
        isAllViewable,
        editableAppsId,
        viewableAppsId,
      },
    },
  };
};

/** @group platform */
describe('defineAppVersionAbility', () => {
  const ALL_ACTIONS = [
    FEATURE_KEY.GET,
    FEATURE_KEY.DELETE,
    FEATURE_KEY.CREATE,
    FEATURE_KEY.GET_ONE,
    FEATURE_KEY.UPDATE,
    FEATURE_KEY.UPDATE_SETTINGS,
    FEATURE_KEY.CREATE_COMPONENTS,
    FEATURE_KEY.UPDATE_COMPONENTS,
    FEATURE_KEY.UPDATE_COMPONENT_LAYOUT,
    FEATURE_KEY.DELETE_COMPONENTS,
    FEATURE_KEY.CREATE_PAGES,
    FEATURE_KEY.CLONE_PAGES,
    FEATURE_KEY.CLONE_GROUP,
    FEATURE_KEY.UPDATE_PAGES,
    FEATURE_KEY.DELETE_PAGE,
    FEATURE_KEY.REORDER_PAGES,
    FEATURE_KEY.GET_EVENTS,
    FEATURE_KEY.CREATE_EVENT,
    FEATURE_KEY.UPDATE_EVENT,
    FEATURE_KEY.DELETE_EVENT,
    FEATURE_KEY.APP_VERSION_CREATE,
    FEATURE_KEY.APP_VERSION_DELETE,
    FEATURE_KEY.APP_VERSION_UPDATE,
    FEATURE_KEY.APP_DRAFT_VERSION_CREATE,
  ];

  const VIEW_ACTIONS = [FEATURE_KEY.GET, FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_EVENTS];

  describe('MODULES resource type', () => {
    it('grants all edit actions + PROMOTE when isAllEditable is true (module editor, Builder role)', () => {
      const perms = buildPermissions({ isBuilder: true, isAllEditable: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('grants all edit actions + PROMOTE when resourceId is in editableAppsId (module editor, Builder role)', () => {
      const resourceId = 'module-uuid-1';
      const perms = buildPermissions({ isBuilder: true, editableAppsId: [resourceId], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, resourceId);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('denies edit actions when resourceId is not in editableAppsId (Builder role, wrong module)', () => {
      const perms = buildPermissions({ isBuilder: true, editableAppsId: ['other-uuid'], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, 'module-uuid-1');
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('grants view actions only (no PROMOTE, no draft-create) when isAllViewable is true (Build-with, Builder role)', () => {
      const perms = buildPermissions({ isBuilder: true, isAllViewable: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.APP_DRAFT_VERSION_CREATE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.UPDATE, App)).toBe(false);
    });

    it('grants view actions only when resourceId is in viewableAppsId (Build-with, Builder role)', () => {
      const resourceId = 'module-uuid-2';
      const perms = buildPermissions({ isBuilder: true, viewableAppsId: [resourceId], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, resourceId);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.APP_DRAFT_VERSION_CREATE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.UPDATE, App)).toBe(false);
    });

    it('denies all edit actions to isBuilder role alone, without per-module edit assignment', () => {
      const perms = buildPermissions({ isBuilder: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('grants edit actions + PROMOTE to isBuilder role when also per-module editable', () => {
      const resourceId = 'module-uuid-builder-editor';
      const perms = buildPermissions({
        isBuilder: true,
        editableAppsId: [resourceId],
        resourceType: MODULES.MODULES,
      });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, resourceId);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('denies all edit actions with no permissions (baseline preview-only access remains)', () => {
      const perms = buildPermissions({ resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      const editOnlyActions = ALL_ACTIONS.filter((a) => !VIEW_ACTIONS.includes(a));
      editOnlyActions.forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('ignores generic appPromote flag for modules — per-module edit access is the only gate', () => {
      const perms = buildPermissions({ appPromote: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
    });
  });

  describe('APP resource type (regression)', () => {
    it('grants all edit actions when isAllEditable is true', () => {
      const perms = buildPermissions({ isAllEditable: true, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      ALL_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('grants all edit actions when resourceId is in editableAppsId', () => {
      const resourceId = 'app-uuid-1';
      const perms = buildPermissions({ editableAppsId: [resourceId], resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, resourceId);
      const ability = build();

      ALL_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });
  });

  describe('end user', () => {
    it('denies all actions with no permissions', () => {
      const perms = buildPermissions({ isEndUser: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('grants view actions when isAllViewable is true', () => {
      const perms = buildPermissions({ isEndUser: true, isAllViewable: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('denies edit actions even when isAllViewable is true', () => {
      const perms = buildPermissions({ isEndUser: true, isAllViewable: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      const editOnlyActions = ALL_ACTIONS.filter((a) => !VIEW_ACTIONS.includes(a));
      editOnlyActions.forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('grants view actions when resourceId is in viewableAppsId', () => {
      const resourceId = 'app-uuid-end-user';
      const perms = buildPermissions({ isEndUser: true, viewableAppsId: [resourceId] });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, resourceId);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('denies view actions when resourceId is not in viewableAppsId', () => {
      const perms = buildPermissions({ isEndUser: true, viewableAppsId: ['other-uuid'] });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, 'app-uuid-end-user');
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('does not get builder component grant on MODULES resource type', () => {
      const perms = buildPermissions({ isEndUser: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE_COMPONENTS, App)).toBe(false);
    });

    it('denies PROMOTE regardless of resource type', () => {
      for (const resourceType of [MODULES.APP, MODULES.MODULES]) {
        const perms = buildPermissions({ isEndUser: true, resourceType });
        const { can, build } = makeBuilder();
        defineAppVersionAbility(can, perms);
        const ability = build();

        expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
      }
    });
  });

  describe('admin / superAdmin bypass', () => {
    it('grants all edit actions for isAdmin regardless of resource type', () => {
      for (const resourceType of [MODULES.APP, MODULES.MODULES]) {
        const perms = buildPermissions({ isAdmin: true, resourceType });
        const { can, build } = makeBuilder();
        defineAppVersionAbility(can, perms);
        const ability = build();

        ALL_ACTIONS.forEach((action) => {
          expect(ability.can(action, App)).toBe(true);
        });
      }
    });

    it('grants all edit actions for superAdmin regardless of resource type', () => {
      for (const resourceType of [MODULES.APP, MODULES.MODULES]) {
        const perms = buildPermissions({ superAdmin: true, resourceType });
        const { can, build } = makeBuilder();
        defineAppVersionAbility(can, perms);
        const ability = build();

        ALL_ACTIONS.forEach((action) => {
          expect(ability.can(action, App)).toBe(true);
        });
      }
    });

    it('grants PROMOTE to isAdmin', () => {
      const perms = buildPermissions({ isAdmin: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(true);
    });

    it('grants PROMOTE to superAdmin', () => {
      const perms = buildPermissions({ superAdmin: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(true);
    });

    it('grants all actions for admin even with no APP permissions set', () => {
      // admin bypasses all permission flag checks via early return
      const perms = buildPermissions({ isAdmin: true, isAllEditable: false, editableAppsId: [] });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      [...ALL_ACTIONS, FEATURE_KEY.PROMOTE].forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });
  });

  describe('PROMOTE permission', () => {
    it('grants PROMOTE when appPromote is true', () => {
      const perms = buildPermissions({ appPromote: true, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(true);
    });

    it('denies PROMOTE when appPromote is false', () => {
      const perms = buildPermissions({ appPromote: false, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
    });

  });

  describe('builder role edge cases', () => {
    it('does not apply builder component grant on APP resource type', () => {
      // isBuilder + MODULES.APP → no special builder grant (only MODULES.MODULES triggers it)
      const perms = buildPermissions({ isBuilder: true, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      // no edit permissions set, so component actions should be denied
      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE_COMPONENTS, App)).toBe(false);
    });

    it('denies version management actions to isBuilder on MODULES without per-module edit assignment', () => {
      const perms = buildPermissions({ isBuilder: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.APP_VERSION_CREATE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.APP_VERSION_DELETE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.APP_VERSION_UPDATE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.DELETE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE_PAGES, App)).toBe(false);
    });
  });

  describe('granular permission boundary conditions', () => {
    it('denies edit actions when editableAppsId is non-empty but resourceId is undefined', () => {
      const perms = buildPermissions({ editableAppsId: ['app-uuid-1'] });
      const { can, build } = makeBuilder();
      // no resourceId passed
      defineAppVersionAbility(can, perms, undefined);
      const ability = build();

      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE_PAGES, App)).toBe(false);
    });

    it('denies view actions when viewableAppsId is non-empty but resourceId is undefined', () => {
      const perms = buildPermissions({ viewableAppsId: ['app-uuid-1'] });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, undefined);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });

    it('grants edit actions from isAllEditable even without resourceId', () => {
      const perms = buildPermissions({ isAllEditable: true });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms, undefined);
      const ability = build();

      ALL_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });
  });
});
