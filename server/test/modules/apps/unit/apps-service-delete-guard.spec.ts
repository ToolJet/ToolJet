/**
 * Unit tests for the module delete-in-use guard in AppsService.delete (H3 — DEV-64).
 *
 * The guard sits at the top of AppsService.delete: if app.type === 'module',
 * it counts ModuleViewer components in other apps that reference this module via
 * properties.moduleAppId.value. If count > 0, throws BadRequestException.
 *
 * Strategy: mock dbTransactionWrap (the helper is imported from @helpers/database.helper)
 * and mock all AppsService constructor dependencies so NestJS DI is bypassed.
 * The mock for the guard's dbTransactionWrap call captures the QueryBuilder calls
 * and resolves with a configurable count.
 */

import { BadRequestException } from '@nestjs/common';

// ── Mock dbTransactionWrap before importing service ──────────────────────────

const mockGetCount = jest.fn();

/**
 * dbTransactionWrap is called twice in AppsService.delete for a module:
 *   call 1 — guard query (our code under test)
 *   call 2 — the main delete transaction
 *
 * We provide one mock manager that is fully-featured enough for both calls.
 * getCount is only called by the guard (call 1), so we control the outcome via
 * mockGetCount. The main delete body calls methods like innerJoinAndSelect,
 * find, delete — all are stubs that resolve to safe defaults.
 */
function makeMockManager() {
  const qb: any = {};
  // Chain every known QueryBuilder method back to the same object
  const chainMethods = [
    'innerJoin', 'innerJoinAndSelect', 'leftJoin', 'leftJoinAndSelect',
    'where', 'andWhere', 'orWhere', 'select', 'addSelect',
    'orderBy', 'addOrderBy', 'take', 'skip', 'distinct',
  ];
  for (const m of chainMethods) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getCount = mockGetCount;
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getOne = jest.fn().mockResolvedValue(null);

  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
  };
}

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => {
    return cb(makeMockManager());
  }),
}));

// ── Minimal mocks for all AppsService constructor dependencies ────────────────

jest.mock('../../../../src/modules/apps/util.service');
jest.mock('../../../../src/modules/apps/repository');
jest.mock('../../../../src/modules/versions/repository');
jest.mock('../../../../src/modules/ability/util.service');
jest.mock('../../../../src/modules/app-environments/util.service');
jest.mock('../../../../src/modules/folders/util.service');
jest.mock('../../../../src/modules/folder-apps/util.service');
jest.mock('../../../../src/modules/organization-themes/util.service');
jest.mock('../../../../src/modules/ai/util.service');
jest.mock('../../../../src/modules/app-git/repository');
jest.mock('@nestjs/event-emitter', () => ({
  EventEmitter2: jest.fn().mockImplementation(() => ({ emit: jest.fn() })),
}));

import { AppsService } from '../../../../src/modules/apps/service';
import { APP_TYPES } from '../../../../src/modules/apps/constants';
import { App } from '../../../../src/entities/app.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeService(): AppsService {
  // Construct with all-undefined deps; the guard code only uses dbTransactionWrap
  // (already mocked) so it never reaches the other deps in these tests.
  return new AppsService(
    null as any, // appsUtilService
    null as any, // licenseTermsService
    null as any, // appEnvironmentUtilService
    null as any, // versionRepository
    null as any, // appRepository
    null as any, // foldersUtilService
    null as any, // folderAppsUtilService
    null as any, // pageService
    null as any, // eventService
    null as any, // organizationThemeUtilService
    null as any, // aiUtilService
    null as any, // componentsService
    null as any, // eventEmitter
    null as any, // appGitRepository
  );
}

function makeApp(type: APP_TYPES, id = 'app-uuid-1'): App {
  const app = new App();
  app.id = id;
  app.type = type;
  return app;
}

function makeUser() {
  return { id: 'user-uuid-1', organizationId: 'org-uuid-1' } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppsService.delete — module delete-in-use guard', () => {
  let service: AppsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = makeService();
  });

  describe('Test A — module with no external references → does NOT throw', () => {
    it('resolves without error when refCount is 0', async () => {
      mockGetCount.mockResolvedValueOnce(0); // guard: no refs
      // The main dbTransactionWrap (the actual delete) will also be invoked.
      // We let it resolve to undefined (the mock default) to avoid cascading.

      const moduleApp = makeApp(APP_TYPES.MODULE);
      const user = makeUser();

      await expect(service.delete(moduleApp, user)).resolves.not.toThrow();
    });
  });

  describe('Test B — module referenced by another app → throws BadRequestException', () => {
    it('throws BadRequestException with the exact message', async () => {
      mockGetCount.mockResolvedValue(2); // guard: 2 external refs — sticky for this test

      const moduleApp = makeApp(APP_TYPES.MODULE);
      const user = makeUser();

      await expect(service.delete(moduleApp, user)).rejects.toThrow(
        'This module is referenced by other apps. Remove all references before deleting.'
      );
    });

    it('throws an instance of BadRequestException', async () => {
      mockGetCount.mockResolvedValue(1);

      const moduleApp = makeApp(APP_TYPES.MODULE);
      const user = makeUser();

      await expect(service.delete(moduleApp, user)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Test C — regular app (type=APP_TYPES.FRONT_END) → guard skipped, does NOT throw', () => {
    it('does not call getCount for non-module apps', async () => {
      const regularApp = makeApp(APP_TYPES.FRONT_END);
      const user = makeUser();

      // Guard must not run; mockGetCount should never be called.
      await service.delete(regularApp, user).catch(() => {
        // The actual delete will fail (null deps), but the guard must not throw.
      });

      expect(mockGetCount).not.toHaveBeenCalled();
    });
  });
});
