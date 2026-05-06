/// <reference types="jest" />
import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { FeatureAbility } from '@modules/versions/ability/index';
import { defineAppVersionAbility } from '@modules/versions/ability/app-version.ability';
import { FEATURE_KEY } from '@modules/versions/constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';

const makeBuilder = () => new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);

const buildPermissions = (overrides: {
  superAdmin?: boolean;
  isAdmin?: boolean;
  isBuilder?: boolean;
  isAllEditable?: boolean;
  isAllViewable?: boolean;
  editableAppsId?: string[];
  viewableAppsId?: string[];
  resourceType?: MODULES;
  appPromote?: boolean;
} = {}) => {
  const {
    superAdmin = false,
    isAdmin = false,
    isBuilder = false,
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
    isEndUser: false,
    user: {} as any,
    resource: [{ resourceType }],
    userPermission: {
      isAdmin: false,
      isSuperAdmin: false,
      isBuilder: false,
      isEndUser: false,
      appCreate: false,
      appDelete: false,
      workflowCreate: false,
      workflowDelete: false,
      appPromote,
      appRelease: false,
      dataSourceCreate: false,
      dataSourceDelete: false,
      folderCreate: false,
      folderDelete: false,
      orgConstantCRUD: false,
      orgVariableCRUD: false,
      [MODULES.APP]: {
        isAllEditable,
        isAllViewable,
        editableAppsId,
        viewableAppsId,
        hiddenAppsId: [],
        hideAll: false,
      },
    },
  };
};

/** @group platform */
describe('defineAppVersionAbility', () => {
  const EDIT_ACTIONS = [
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
    it('grants all edit actions when isAllEditable is true', () => {
      const perms = buildPermissions({ isAllEditable: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      EDIT_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('grants all edit actions when resourceId is in editableAppsId', () => {
      const resourceId = 'module-uuid-1';
      const perms = buildPermissions({ editableAppsId: [resourceId], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any, resourceId);
      const ability = build();

      EDIT_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('denies edit actions when resourceId is not in editableAppsId', () => {
      const perms = buildPermissions({ editableAppsId: ['other-uuid'], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any, 'module-uuid-1');
      const ability = build();

      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.CREATE_PAGES, App)).toBe(false);
    });

    it('grants view actions when isAllViewable is true', () => {
      const perms = buildPermissions({ isAllViewable: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
    });

    it('grants view actions when resourceId is in viewableAppsId', () => {
      const resourceId = 'module-uuid-2';
      const perms = buildPermissions({ viewableAppsId: [resourceId], resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any, resourceId);
      const ability = build();

      VIEW_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(false);
    });

    it('grants component/event operations to isBuilder', () => {
      const perms = buildPermissions({ isBuilder: true, resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      expect(ability.can(FEATURE_KEY.UPDATE_COMPONENTS, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.CREATE_COMPONENTS, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.DELETE_COMPONENTS, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.CREATE_EVENT, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.UPDATE_EVENT, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.DELETE_EVENT, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.GET_ONE, App)).toBe(true);
    });

    it('denies all actions with no permissions', () => {
      const perms = buildPermissions({ resourceType: MODULES.MODULES });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      EDIT_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(false);
      });
    });
  });

  describe('APP resource type (regression)', () => {
    it('grants all edit actions when isAllEditable is true', () => {
      const perms = buildPermissions({ isAllEditable: true, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      EDIT_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });

    it('grants all edit actions when resourceId is in editableAppsId', () => {
      const resourceId = 'app-uuid-1';
      const perms = buildPermissions({ editableAppsId: [resourceId], resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any, resourceId);
      const ability = build();

      EDIT_ACTIONS.forEach((action) => {
        expect(ability.can(action, App)).toBe(true);
      });
    });
  });

  describe('admin / superAdmin bypass', () => {
    it('grants all edit actions for isAdmin regardless of resource type', () => {
      for (const resourceType of [MODULES.APP, MODULES.MODULES]) {
        const perms = buildPermissions({ isAdmin: true, resourceType });
        const { can, build } = makeBuilder();
        defineAppVersionAbility(can, perms as any);
        const ability = build();

        EDIT_ACTIONS.forEach((action) => {
          expect(ability.can(action, App)).toBe(true);
        });
      }
    });

    it('grants all edit actions for superAdmin regardless of resource type', () => {
      for (const resourceType of [MODULES.APP, MODULES.MODULES]) {
        const perms = buildPermissions({ superAdmin: true, resourceType });
        const { can, build } = makeBuilder();
        defineAppVersionAbility(can, perms as any);
        const ability = build();

        EDIT_ACTIONS.forEach((action) => {
          expect(ability.can(action, App)).toBe(true);
        });
      }
    });
  });

  describe('PROMOTE permission', () => {
    it('grants PROMOTE when appPromote is true', () => {
      const perms = buildPermissions({ appPromote: true, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(true);
    });

    it('denies PROMOTE when appPromote is false', () => {
      const perms = buildPermissions({ appPromote: false, resourceType: MODULES.APP });
      const { can, build } = makeBuilder();
      defineAppVersionAbility(can, perms as any);
      const ability = build();

      expect(ability.can(FEATURE_KEY.PROMOTE, App)).toBe(false);
    });
  });
});
