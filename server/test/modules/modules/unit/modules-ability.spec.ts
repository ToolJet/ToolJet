import { AbilityBuilder, Ability } from '@casl/ability';
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
 *
 * Pass `request` to simulate the HTTP request object carrying `tj_app` (set by
 * ValidAppGuard).  The factory resolves ownership/ID checks at build time using
 * request.tj_app, so tests that exercise the guard call shape (ability.can with
 * a string resourceId) MUST supply the right tj_app here.
 */
function buildAbility(permissions: Partial<UserAllPermissions>, request?: { tj_app?: App }): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  // defineAbilityFor is protected — cast to access in tests
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions, { moduleName: '', features: [] }, request);
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
    folderCreate: false,
    folderDelete: false,
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

    it('builder WITHOUT moduleDelete, not admin, no tj_app → cannot DELETE_MODULE at class level', () => {
      // No request.tj_app — factory emits no rule, so class-level check is false.
      const permissions = makePermissions({
        user: { id: 'user-1' } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(false);
    });

    it('builder WITHOUT moduleDelete, tj_app.userId !== user.id → cannot DELETE_MODULE', () => {
      // tj_app present but owned by someone else — still denied.
      const permissions = makePermissions({
        user: { id: 'user-1' } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions, { tj_app: appInstance('mod-xyz', 'other-user') });
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(false);
      // Guard call shape: string resourceId must also be false (no conditional rule emitted)
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App, 'mod-xyz')).toBe(false);
    });

    it('admin WITHOUT moduleDelete → can DELETE_MODULE', () => {
      const permissions = makePermissions({
        isAdmin: true,
        userPermission: { ...baseUserPermission(), isAdmin: true, moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(true);
    });

    it('builder WITHOUT moduleDelete, tj_app.userId === user.id → can DELETE_MODULE (owner)', () => {
      const userId = 'user-1';
      const permissions = makePermissions({
        user: { id: userId } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      // Pass tj_app so factory resolves ownership at build time → unconditional can()
      const ability = buildAbility(permissions, { tj_app: appInstance('mod-abc', userId) });
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(true);
      // Guard call shape (string resourceId) must also pass
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App, 'mod-abc')).toBe(true);
    });

    it('builder WITHOUT moduleDelete, tj_app.userId !== user.id → cannot DELETE_MODULE (not owner)', () => {
      const permissions = makePermissions({
        user: { id: 'user-1' } as any,
        userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
      });
      const ability = buildAbility(permissions, { tj_app: appInstance('mod-abc', 'other-user') });
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App)).toBe(false);
      // Guard call shape: string resourceId must also be false
      expect(ability.can(FEATURE_KEY.DELETE_MODULE, App, 'mod-abc')).toBe(false);
    });

    describe('guard call shape — string resourceId (C1 regression)', () => {
      it('no moduleDelete + no ownership → false even with string resourceId', () => {
        const permissions = makePermissions({
          user: { id: 'user-1' } as any,
          userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
        });
        // This is the exact call the base AbilityGuard makes: ability.can(feature, App, "uuid")
        const ability = buildAbility(permissions, { tj_app: appInstance('any-uuid', 'other-user') });
        expect(ability.can(FEATURE_KEY.DELETE_MODULE, App, 'any-uuid')).toBe(false);
      });

      it('owner → true with string resourceId matching tj_app', () => {
        const userId = 'user-1';
        const permissions = makePermissions({
          user: { id: userId } as any,
          userPermission: { ...baseUserPermission(), moduleDelete: false } as any,
        });
        const ability = buildAbility(permissions, { tj_app: appInstance('owned-uuid', userId) });
        expect(ability.can(FEATURE_KEY.DELETE_MODULE, App, 'owned-uuid')).toBe(true);
      });
    });
  });

  describe('UPDATE_MODULE', () => {
    it('builder with editableAppsId=[abc], tj_app.id=abc → can UPDATE_MODULE', () => {
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
      // Factory resolves editableAppsId.includes(tjApp.id) at build time
      const ability = buildAbility(permissions, { tj_app: appInstance('abc') });
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(true);
      // Guard call shape
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App, 'abc')).toBe(true);
    });

    it('builder with editableAppsId=[abc], tj_app.id=xyz → cannot UPDATE_MODULE (C2 regression)', () => {
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
      // tj_app.id=xyz is NOT in editableAppsId → must be denied
      const ability = buildAbility(permissions, { tj_app: appInstance('xyz', 'other-user') });
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(false);
      // Guard call shape: string resourceId must also be false
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App, 'xyz')).toBe(false);
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
      // isAllEditable → unconditional without needing tj_app
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(true);
    });

    it('builder with empty editableAppsId, no tj_app → cannot UPDATE_MODULE', () => {
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

    it('builder with editableAppsId=[], tj_app owned by user → can UPDATE_MODULE (owner fallback)', () => {
      const userId = 'user-1';
      const permissions = makePermissions({
        user: { id: userId } as any,
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
      const ability = buildAbility(permissions, { tj_app: appInstance('mod-owned', userId) });
      expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App)).toBe(true);
    });

    describe('guard call shape — string resourceId (C2 regression)', () => {
      it('non-empty editableAppsId but wrong app → false even with string resourceId', () => {
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
        // tj_app.id=xyz (not in editableAppsId) → no rule emitted → false
        const ability = buildAbility(permissions, { tj_app: appInstance('xyz', 'other-user') });
        expect(ability.can(FEATURE_KEY.UPDATE_MODULE, App, 'xyz')).toBe(false);
      });
    });
  });

  describe('CLONE/EXPORT/IMPORT', () => {
    // CLONE/IMPORT create a new module, so they're gated on moduleCreate (like CREATE_MODULE)
    // rather than plain isBuilder — see the CREATE/UPDATE/DELETE_MODULE describe blocks above.
    it('builder WITHOUT moduleCreate → can EXPORT only, not CLONE/IMPORT', () => {
      const permissions = makePermissions();
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CLONE_MODULE, App)).toBe(false);
      expect(ability.can(FEATURE_KEY.EXPORT_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.IMPORT_MODULE, App)).toBe(false);
    });

    it('builder WITH moduleCreate → can CLONE/EXPORT/IMPORT', () => {
      const permissions = makePermissions({
        userPermission: { ...baseUserPermission(), moduleCreate: true } as any,
      });
      const ability = buildAbility(permissions);
      expect(ability.can(FEATURE_KEY.CLONE_MODULE, App)).toBe(true);
      expect(ability.can(FEATURE_KEY.EXPORT_MODULE, App)).toBe(true);
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
      expect(ability.can(FEATURE_KEY.EXPORT_MODULE, App)).toBe(false);
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
