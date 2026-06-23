import { AbilityBuilder, Ability, subject } from '@casl/ability';
import { App } from 'src/entities/app.entity';
import { FEATURE_KEY } from 'src/modules/modules/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { UserAllPermissions } from 'src/modules/app/types';
import { FeatureAbility, FeatureAbilityFactory } from 'src/modules/modules/ability';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calls defineAbilityFor directly without the NestJS DI / AbilityService.
 * We instantiate the factory with a stub abilityService (unused in defineAbilityFor).
 */
function buildAbility(permissions: Partial<UserAllPermissions>): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  // defineAbilityFor is protected — cast to access in tests
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions);
  return build({
    detectSubjectType: (item: any) => item.constructor,
  });
}

function baseUserPermission() {
  return {
    appCreate: false,
    appDelete: false,
    appRelease: false,
    appPromote: false,
    workflowCreate: false,
    workflowDelete: false,
    moduleCreate: false,
    moduleDelete: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
    folderCRUD: false,
    orgConstantCRUD: false,
    orgVariableCRUD: false,
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

function appInstance(id: string, userId?: string): App {
  const a = new App();
  (a as any).id = id;
  if (userId !== undefined) (a as any).userId = userId;
  return a;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeatureAbilityFactory — modules ability', () => {
  describe('CREATE_MODULE', () => {
    it('builder WITH moduleCreate=true → can CREATE_MODULE', () => {
      const permissions = makePermissions({
        userPermission: { ...baseUserPermission(), moduleCreate: true } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CREATE_MODULE, App)).toBe(true);
    });

    it('builder WITHOUT moduleCreate, not admin → cannot CREATE_MODULE', () => {
      const permissions = makePermissions({
        userPermission: { ...baseUserPermission(), moduleCreate: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CREATE_MODULE, App)).toBe(false);
    });

    it('admin → can CREATE_MODULE regardless of moduleCreate flag', () => {
      const permissions = makePermissions({
        isAdmin: true,
        userPermission: { ...baseUserPermission(), isAdmin: true, moduleCreate: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CREATE_MODULE, App)).toBe(true);
    });
  });

  describe('DELETE_MODULE', () => {
    it('builder WITH moduleDelete=true → can DELETE_MODULE (any app)', () => {
      const permissions = makePermissions({
        userPermission: { ...baseUserPermission(), moduleDelete: true } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(true);
    });

    it('builder WITHOUT moduleDelete, not admin, not owner → cannot DELETE_MODULE', () => {
      // Must use an App instance with a non-matching userId; class-level check
      // returns true whenever any conditional rule exists (CASL behaviour).
      const permissions = makePermissions({
        user: { id: 'user-1' } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, subject(App, appInstance('mod-xyz', 'other-user')))).toBe(false);
    });

    it('admin WITHOUT moduleDelete → can DELETE_MODULE', () => {
      const permissions = makePermissions({
        isAdmin: true,
        userPermission: { ...baseUserPermission(), isAdmin: true, moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(true);
    });

    it('builder WITHOUT moduleDelete, app.userId === user.id → can DELETE_MODULE (owner)', () => {
      const userId = 'user-1';
      const permissions = makePermissions({
        user: { id: userId } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      // Must check against an instance carrying userId so CASL evaluates the condition
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, subject(App, appInstance('mod-abc', userId)))).toBe(true);
    });

    it('builder WITHOUT moduleDelete, app.userId !== user.id → cannot DELETE_MODULE (not owner)', () => {
      const permissions = makePermissions({
        user: { id: 'user-1' } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, subject(App, appInstance('mod-abc', 'other-user')))).toBe(false);
    });
  });

  describe('UPDATE_MODULE', () => {
    it('builder with editableAppsId=[abc] → can UPDATE_MODULE for App{id:abc}', () => {
      const permissions = makePermissions({
        userPermission: {
          ...baseUserPermission(),
          [MODULES.MODULES]: {
            editableAppsId: ['abc'],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, subject(App, appInstance('abc')))).toBe(true);
    });

    it('builder with editableAppsId=[abc] → cannot UPDATE_MODULE for App{id:xyz}', () => {
      const permissions = makePermissions({
        userPermission: {
          ...baseUserPermission(),
          [MODULES.MODULES]: {
            editableAppsId: ['abc'],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, subject(App, appInstance('xyz')))).toBe(false);
    });

    it('builder with isAllEditable=true → can UPDATE_MODULE any App', () => {
      const permissions = makePermissions({
        userPermission: {
          ...baseUserPermission(),
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: true,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(true);
    });

    it('builder with empty editableAppsId → cannot UPDATE_MODULE', () => {
      const permissions = makePermissions({
        userPermission: {
          ...baseUserPermission(),
          [MODULES.MODULES]: {
            editableAppsId: [],
            isAllEditable: false,
            viewableAppsId: [],
            isAllViewable: false,
            hiddenAppsId: [],
            hideAll: false,
          },
        } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(false);
    });
  });

  describe('CLONE/EXPORT/IMPORT', () => {
    it('builder (isBuilder=true) → can CLONE/EXPORT/IMPORT', () => {
      const permissions = makePermissions();
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CLONE_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.EXORT_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.IMPORT_MODULE, App)).toBe(true);
    });

    it('end-user (isBuilder=false, not admin) → cannot CLONE/EXPORT/IMPORT', () => {
      const permissions = makePermissions({
        isBuilder: false,
        isEndUser: true,
        userPermission: { ...baseUserPermission(), isBuilder: false, isEndUser: true } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CLONE_MODULE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.EXORT_MODULE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.IMPORT_MODULE, App)).toBe(false);
    });
  });

  describe('superAdmin', () => {
    it('superAdmin → can all module actions', () => {
      const permissions = makePermissions({
        superAdmin: true,
        userPermission: { ...baseUserPermission(), isSuperAdmin: true } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CREATE_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.CLONE_MODULE, App)).toBe(true);
    });
  });
});
