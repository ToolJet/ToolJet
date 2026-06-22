import { AbilityBuilder, Ability } from '@casl/ability';
import { defineAppAbility } from 'src/modules/apps/ability/app.ability';
import { App } from 'src/entities/app.entity';
import { FEATURE_KEY, APP_TYPES } from 'src/modules/apps/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { UserAllPermissions } from 'src/modules/app/types';
import { plainToClass } from 'class-transformer';
import { ForbiddenException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FeatureAbility = Ability<[FEATURE_KEY, typeof App | 'all']>;

function buildAbility(permissions: Partial<UserAllPermissions>, appId?: string): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  defineAppAbility(can as any, permissions as UserAllPermissions, appId);
  return build();
}

function makeModulePermissions(override: Partial<UserAllPermissions> = {}): UserAllPermissions {
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser: false,
    user: { id: 'user-1' } as any,
    resource: [{ resourceType: MODULES.MODULES }],
    userPermission: {
      appCreate: false,
      appDelete: false,
      appRelease: false,
      appPromote: false,
      workflowCreate: false,
      workflowDelete: false,
      dataSourceCreate: false,
      dataSourceDelete: false,
      folderCRUD: false,
      orgConstantCRUD: false,
      orgVariableCRUD: false,
      isAdmin: false,
      isBuilder: true,
      isEndUser: false,
      isSuperAdmin: false,
      [MODULES.APP]: {
        editableAppsId: [],
        isAllEditable: false,
        viewableAppsId: [],
        isAllViewable: false,
        hiddenAppsId: [],
        hideAll: false,
      },
      [MODULES.MODULES]: undefined,
    } as any,
    ...override,
  };
}

const MODULE_APP_ID = 'module-app-uuid-1';
const OTHER_MODULE_APP_ID = 'module-app-uuid-2';

// ---------------------------------------------------------------------------
// Tests — defineAppAbility (module resource type)
// ---------------------------------------------------------------------------

describe('defineAppAbility — MODULES.MODULES resource', () => {
  describe('Case 1: editable (editableAppsId includes appId)', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        userPermission: {
          ...makeModulePermissions().userPermission,
          [MODULES.MODULES]: {
            editableAppsId: [MODULE_APP_ID],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, MODULE_APP_ID);
    });

    it('can(UPDATE, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, MODULE_APP_ID)).toBe(true);
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, MODULE_APP_ID)).toBe(true);
    });
  });

  describe('Case 2: viewable-only (viewableAppsId includes appId, not in editable)', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        userPermission: {
          ...makeModulePermissions().userPermission,
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [MODULE_APP_ID],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, MODULE_APP_ID);
    });

    it('can(UPDATE, App, appId) = false', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, MODULE_APP_ID)).toBe(false);
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, MODULE_APP_ID)).toBe(true);
    });
  });

  describe('Case 3: neither editable nor viewable', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        userPermission: {
          ...makeModulePermissions().userPermission,
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, MODULE_APP_ID);
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, appId) = false', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, MODULE_APP_ID)).toBe(false);
    });

    it('can(UPDATE, App, appId) = false', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, MODULE_APP_ID)).toBe(false);
    });
  });

  describe('Case 4: isAllEditable = true', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        userPermission: {
          ...makeModulePermissions().userPermission,
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: true,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, 'any-random-module-id');
    });

    it('can(UPDATE, App, anyId) = true', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, 'any-random-module-id')).toBe(true);
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, anyId) = true', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, 'any-random-module-id')).toBe(true);
    });
  });

  describe('Case 4b: isAllViewable = true (no editable flag)', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        userPermission: {
          ...makeModulePermissions().userPermission,
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: true,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, 'any-random-module-id');
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, anyId) = true', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, 'any-random-module-id')).toBe(true);
    });

    it('can(UPDATE, App, anyId) = false', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, 'any-random-module-id')).toBe(false);
    });

    it('can(GET_ONE, App, anyId) = true', () => {
      expect(ability.can(FEATURE_KEY.GET_ONE, App, 'any-random-module-id')).toBe(true);
    });
  });

  describe('Case 5: admin — regression, full permissions unchanged', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      const permissions = makeModulePermissions({
        isAdmin: true,
        userPermission: {
          ...makeModulePermissions().userPermission,
          isAdmin: true,
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        },
      });
      ability = buildAbility(permissions, MODULE_APP_ID);
    });

    it('can(UPDATE, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, MODULE_APP_ID)).toBe(true);
    });

    it('can(DELETE, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.DELETE, App, MODULE_APP_ID)).toBe(true);
    });

    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, appId) = true', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, MODULE_APP_ID)).toBe(true);
    });
  });

  describe('Case 6: non-module (FRONT_END) + viewable-only builder — regression', () => {
    let ability: FeatureAbility;

    beforeEach(() => {
      // resource = MODULES.APP, not MODULES.MODULES
      const permissions: UserAllPermissions = {
        superAdmin: false,
        isAdmin: false,
        isBuilder: true,
        isEndUser: false,
        user: { id: 'user-1' } as any,
        resource: [{ resourceType: MODULES.APP }],
        userPermission: {
          appCreate: false,
          appDelete: false,
          appRelease: false,
          appPromote: false,
          workflowCreate: false,
          workflowDelete: false,
          dataSourceCreate: false,
          dataSourceDelete: false,
          folderCRUD: false,
          orgConstantCRUD: false,
          orgVariableCRUD: false,
          isAdmin: false,
          isBuilder: true,
          isEndUser: false,
          isSuperAdmin: false,
          [MODULES.APP]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [MODULE_APP_ID],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
            environmentAccess: {
              development: false,
              staging: false,
              production: false,
              released: false,
            },
          },
        } as any,
      };
      ability = buildAbility(permissions, MODULE_APP_ID);
    });

    it('can(UPDATE, App, appId) = false — non-module viewable-only builder cannot edit', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, App, MODULE_APP_ID)).toBe(false);
    });

    it('can(GET_BY_SLUG, App, appId) = true — non-module viewable-only builder can view', () => {
      expect(ability.can(FEATURE_KEY.GET_BY_SLUG, App, MODULE_APP_ID)).toBe(true);
    });

    // Pre-H2: non-module viewable builder without non-released env access
    // does NOT get VALIDATE_PRIVATE_APP_ACCESS (no hasNonReleasedAccess)
    it('can(VALIDATE_PRIVATE_APP_ACCESS, App, appId) = false — no env access, old behavior', () => {
      expect(ability.can(FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS, App, MODULE_APP_ID)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — validatePrivateAppAccess service behavior
// ---------------------------------------------------------------------------

import { AppsService } from 'src/modules/apps/service';
import { ValidateAppAccessResponseDto } from 'src/modules/apps/dto';

// Minimal mock of the ability object shape
function makeAbility(canUpdate: boolean, canGetBySlug: boolean) {
  return {
    can: (action: string, subject: any, id?: string) => {
      if (action === FEATURE_KEY.UPDATE) return canUpdate;
      if (action === FEATURE_KEY.GET_BY_SLUG) return canGetBySlug;
      return false;
    },
  } as any;
}

// Minimal mock app
function makeApp(type: APP_TYPES, id = MODULE_APP_ID, orgId = 'org-1') {
  return { id, slug: `slug-${id}`, type, organizationId: orgId } as any;
}

// Minimal mock service (bypass constructor DI)
function makeService() {
  const svc = Object.create(AppsService.prototype) as AppsService;
  // Stub versionRepository and appsUtilService to avoid real DB calls
  (svc as any).versionRepository = {};
  (svc as any).appsUtilService = {};
  return svc;
}

describe('AppsService.validatePrivateAppAccess — module canEdit behavior', () => {
  let service: AppsService;

  beforeEach(() => {
    service = makeService();
  });

  describe('Case 7: Module + viewable-only + access_type=edit → success with canEdit:false', () => {
    it('returns response with canEdit:false instead of throwing', async () => {
      const ability = makeAbility(false, true); // no UPDATE, has GET_BY_SLUG
      const app = makeApp(APP_TYPES.MODULE);
      const user = { id: 'user-1' } as any;
      const dto = { accessType: 'edit' };

      const result = await service.validatePrivateAppAccess(app, ability, user, dto as any);

      expect(result).toBeInstanceOf(ValidateAppAccessResponseDto);
      expect((result as any).canEdit).toBe(false);
    });
  });

  describe('Case 8: Module + no permission + access_type=edit → ForbiddenException', () => {
    it('throws ForbiddenException', async () => {
      const ability = makeAbility(false, false); // no UPDATE, no GET_BY_SLUG
      const app = makeApp(APP_TYPES.MODULE);
      const user = { id: 'user-1' } as any;
      const dto = { accessType: 'edit' };

      await expect(service.validatePrivateAppAccess(app, ability, user, dto as any)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });
  });

  describe('Case 9: Non-module + viewable-only + access_type=edit → ForbiddenException (regression)', () => {
    it('throws ForbiddenException — non-module path unchanged', async () => {
      const ability = makeAbility(false, true); // no UPDATE, has GET_BY_SLUG
      const app = makeApp(APP_TYPES.FRONT_END);
      const user = { id: 'user-1' } as any;
      const dto = { accessType: 'edit' };

      await expect(service.validatePrivateAppAccess(app, ability, user, dto as any)).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });
  });
});
