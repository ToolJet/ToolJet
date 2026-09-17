/**
 * Unit tests for picker-context module list filtering (H2 — DEV-63).
 *
 * Tests the `viewableAppsQueryUsingPermissions` method on AppsUtilService,
 * specifically the branching introduced in the APP_TYPES.MODULE case:
 *   - no `context` (or context !== 'picker')  → addViewableFrontEndAppsFilter (hide_from_dashboard respected)
 *   - context === 'picker'                     → addPickerModulesFilter (hidden ignored, permission still applied)
 *
 * Strategy: subclass AppsUtilService to expose the protected method, mock all
 * constructor dependencies so NestJS DI is bypassed, and spy on QueryBuilder
 * `andWhere` to assert which filter clause gets applied.
 */

import { SelectQueryBuilder, EntityManager } from 'typeorm';
import { AppsUtilService } from '../../../../src/modules/apps/util.service';
import { AppBase } from '../../../../src/entities/app_base.entity';
import { APP_TYPES } from '../../../../src/modules/apps/constants';
import { UserAppsPermissions } from '../../../../src/modules/ability/types';
import { User } from '../../../../src/entities/user.entity';
import { USER_TYPE } from '../../../../src/modules/users/constants/lifecycle';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Expose the protected method for testing. */
class TestableAppsUtilService extends AppsUtilService {
  callViewableAppsQueryUsingPermissions(
    user: User,
    perms: UserAppsPermissions,
    manager: EntityManager,
    searchKey?: string,
    select?: string[],
    type?: string,
    context?: string
  ): SelectQueryBuilder<AppBase> {
    return this.viewableAppsQueryUsingPermissions(user, perms, manager, searchKey, select, type, context);
  }
}

/** Minimal mock QueryBuilder — records andWhere calls. */
function makeMockQb() {
  const calls: Array<{ sql: string; params?: Record<string, unknown> }> = [];
  const qb: Partial<SelectQueryBuilder<AppBase>> = {
    innerJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockImplementation((sql: string, params?: Record<string, unknown>) => {
      calls.push({ sql, params });
      return qb as SelectQueryBuilder<AppBase>;
    }),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return { qb: qb as SelectQueryBuilder<AppBase>, calls };
}

/** Mock EntityManager that returns the provided QueryBuilder. */
function makeMockManager(qb: SelectQueryBuilder<AppBase>): EntityManager {
  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as EntityManager;
}

/** Factory for a non-superadmin user. */
function makeUser(id = 'user-1', orgId = 'org-1'): User {
  const u = new User();
  u.id = id;
  u.organizationId = orgId;
  u.userType = USER_TYPE.DEFAULT;
  return u;
}

/** Factory for UserAppsPermissions (module permission shape is identical). */
function makePerms(overrides: Partial<UserAppsPermissions> = {}): UserAppsPermissions {
  return {
    editableAppsId: [],
    isAllEditable: false,
    viewableAppsId: [],
    isAllViewable: false,
    hiddenAppsId: [],
    hideAll: false,
    ...overrides,
  };
}

// ── Service construction ───────────────────────────────────────────────────────

function buildService(): TestableAppsUtilService {
  // All constructor deps are no-ops — we only test the filtering helpers.
  return new TestableAppsUtilService(
    {} as any, // AppsRepository
    {} as any, // AppEnvironmentUtilService
    {} as any, // VersionRepository
    {} as any, // LicenseTermsService
    {} as any, // OrganizationRepository
    {} as any  // AbilityService
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppsUtilService — picker-context module filtering', () => {
  let service: TestableAppsUtilService;

  beforeEach(() => {
    service = buildService();
  });

  // TC1 — Dashboard path: hidden module excluded for view-only user
  it('TC1: dashboard context — excludes hidden module for view-only user', () => {
    const hiddenModuleId = 'mod-hidden';
    const perms = makePerms({
      viewableAppsId: [hiddenModuleId],
      hiddenAppsId: [hiddenModuleId],
      hideAll: false,
      isAllViewable: false,
    });
    const { qb, calls } = makeMockQb();
    const manager = makeMockManager(qb);
    const user = makeUser();

    service.callViewableAppsQueryUsingPermissions(user, perms, manager, '', undefined, APP_TYPES.MODULE);

    // dashboard path calls addViewableFrontEndAppsFilter which uses id IN (:...viewableApps)
    const idFilterCall = calls.find((c) => c.sql.includes('apps.id IN (:...viewableApps)'));
    expect(idFilterCall).toBeDefined();

    // viewableApps for this user = null + editableAppsId ∪ (viewableAppsId minus hiddenAppsId)
    // = [null] (hidden is excluded from the union)
    const viewableApps = idFilterCall!.params!['viewableApps'] as string[];
    expect(viewableApps).not.toContain(hiddenModuleId);
  });

  // TC2 — Picker path: hidden module included for view-only user
  it('TC2: picker context — includes hidden module for view-only user', () => {
    const hiddenModuleId = 'mod-hidden';
    const perms = makePerms({
      viewableAppsId: [hiddenModuleId],
      hiddenAppsId: [hiddenModuleId],
      hideAll: false,
      isAllViewable: false,
    });
    const { qb, calls } = makeMockQb();
    const manager = makeMockManager(qb);
    const user = makeUser();

    service.callViewableAppsQueryUsingPermissions(user, perms, manager, '', undefined, APP_TYPES.MODULE, 'picker');

    // picker path calls addPickerModulesFilter which uses id IN (:...viewableModules)
    const pickerFilterCall = calls.find((c) => c.sql.includes('apps.id IN (:...viewableModules)'));
    expect(pickerFilterCall).toBeDefined();

    const viewableModules = pickerFilterCall!.params!['viewableModules'] as string[];
    // hidden module is in viewableAppsId → should be present in picker filter
    expect(viewableModules).toContain(hiddenModuleId);
  });

  // TC3 — Picker path: module user has no permission on is still excluded
  it('TC3: picker context — excludes module user has no permission on', () => {
    const permittedModuleId = 'mod-permitted';
    const unpermittedModuleId = 'mod-none';
    const perms = makePerms({
      viewableAppsId: [permittedModuleId],
      hiddenAppsId: [],
      hideAll: false,
      isAllViewable: false,
    });
    const { qb, calls } = makeMockQb();
    const manager = makeMockManager(qb);
    const user = makeUser();

    service.callViewableAppsQueryUsingPermissions(user, perms, manager, '', undefined, APP_TYPES.MODULE, 'picker');

    const pickerFilterCall = calls.find((c) => c.sql.includes('apps.id IN (:...viewableModules)'));
    expect(pickerFilterCall).toBeDefined();

    const viewableModules = pickerFilterCall!.params!['viewableModules'] as string[];
    expect(viewableModules).toContain(permittedModuleId);
    expect(viewableModules).not.toContain(unpermittedModuleId);
  });

  // TC4 — Owner (isAllEditable): sees own module in both dashboard and picker (no id filter)
  it('TC4: owner (isAllEditable) — no id filter applied in either context', () => {
    const perms = makePerms({ isAllEditable: true });
    const user = makeUser();

    // dashboard
    {
      const { qb, calls } = makeMockQb();
      service.callViewableAppsQueryUsingPermissions(user, perms, makeMockManager(qb), '', undefined, APP_TYPES.MODULE);
      expect(calls.find((c) => c.sql.includes('apps.id IN'))).toBeUndefined();
    }

    // picker
    {
      const { qb, calls } = makeMockQb();
      service.callViewableAppsQueryUsingPermissions(
        user,
        perms,
        makeMockManager(qb),
        '',
        undefined,
        APP_TYPES.MODULE,
        'picker'
      );
      expect(calls.find((c) => c.sql.includes('apps.id IN'))).toBeUndefined();
    }
  });

  // TC6 — Picker path: empty permission sets emit '1 = 0' (no crash, no results)
  it('TC6: picker context — empty permissions emits 1=0 guard (no PostgreSQL IN () crash)', () => {
    const perms = makePerms({
      editableAppsId: [],
      viewableAppsId: [],
      isAllEditable: false,
      isAllViewable: false,
    });
    const { qb, calls } = makeMockQb();
    const manager = makeMockManager(qb);
    const user = makeUser();

    // Should not throw; should not emit 'apps.id IN ()'.
    expect(() =>
      service.callViewableAppsQueryUsingPermissions(user, perms, manager, '', undefined, APP_TYPES.MODULE, 'picker')
    ).not.toThrow();

    const emptyInCall = calls.find((c) => c.sql.includes('apps.id IN (:...viewableModules)'));
    expect(emptyInCall).toBeUndefined(); // never emitted with empty array

    const zeroGuard = calls.find((c) => c.sql === '1 = 0');
    expect(zeroGuard).toBeDefined(); // guard clause applied
  });

  // TC5 — Regression: APP_TYPES.FRONT_END is unaffected by context param
  it('TC5: regression — FRONT_END type uses dashboard filter regardless of context=picker', () => {
    const hiddenAppId = 'app-hidden';
    const perms = makePerms({
      viewableAppsId: [hiddenAppId],
      hiddenAppsId: [hiddenAppId],
      hideAll: false,
      isAllViewable: false,
    });
    const user = makeUser();

    // with context=picker but type=front-end — should still use addViewableFrontEndAppsFilter
    const { qb, calls } = makeMockQb();
    service.callViewableAppsQueryUsingPermissions(
      user,
      perms,
      makeMockManager(qb),
      '',
      undefined,
      APP_TYPES.FRONT_END,
      'picker'
    );

    // front-end always goes through addViewableFrontEndAppsFilter
    const idFilterCall = calls.find((c) => c.sql.includes('apps.id IN (:...viewableApps)'));
    expect(idFilterCall).toBeDefined();

    // picker-specific filter must NOT be used for front-end
    expect(calls.find((c) => c.sql.includes('viewableModules'))).toBeUndefined();
  });
});
