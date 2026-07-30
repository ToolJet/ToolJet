import { ForbiddenException } from '@nestjs/common';
import { AppImportExportService } from '@ee/apps/services/app-import-export.service';

/**
 * Covers the moduleCreate permission gate for git-import flows (parity with the
 * device-import gate in the CE base's `import()`). Git-import call sites hydrate
 * referenced modules into the DB before `import()`'s own gate ever evaluates, so
 * `missingModules` is always empty by the time that gate runs — this method is
 * the new choke point called BEFORE hydration, from git call sites directly.
 */
describe('AppImportExportService (EE) — assertModuleCreatePermission', () => {
  let service: AppImportExportService;
  let entityManager: { find: jest.Mock };
  let abilityService: { resourceActionsPermission: jest.Mock };

  const user = { id: 'user-1', organizationId: 'org-1' } as any;

  beforeEach(() => {
    entityManager = { find: jest.fn() };
    abilityService = { resourceActionsPermission: jest.fn() };

    service = new AppImportExportService(
      {} as any, // dataSourcesUtilService
      {} as any, // dataSourcesRepository
      {} as any, // appEnvironmentUtilService
      {} as any, // componentsService
      {} as any, // usersUtilService
      entityManager as any, // entityManager
      {} as any, // appsRepository
      {} as any, // transactionLogger
      {} as any, // gitSyncConfigsUtilService
      abilityService as any // abilityService
    );
  });

  it('does nothing when no modules are referenced', async () => {
    await service.assertModuleCreatePermission(user, 'org-1', new Set());

    expect(entityManager.find).not.toHaveBeenCalled();
    expect(abilityService.resourceActionsPermission).not.toHaveBeenCalled();
  });

  it('does nothing when every referenced module already exists in the org', async () => {
    entityManager.find.mockResolvedValue([{ co_relation_id: 'mod-1' }, { co_relation_id: 'mod-2' }]);

    await expect(
      service.assertModuleCreatePermission(user, 'org-1', new Set(['mod-1', 'mod-2']))
    ).resolves.toBeUndefined();

    expect(abilityService.resourceActionsPermission).not.toHaveBeenCalled();
  });

  it('does not throw when a module is missing but the user has moduleCreate permission', async () => {
    entityManager.find.mockResolvedValue([]);
    abilityService.resourceActionsPermission.mockResolvedValue({
      isSuperAdmin: false,
      isAdmin: false,
      moduleCreate: true,
    });

    await expect(
      service.assertModuleCreatePermission(user, 'org-1', new Set(['mod-missing']))
    ).resolves.toBeUndefined();
  });

  it('does not throw when a module is missing but the user is an admin', async () => {
    entityManager.find.mockResolvedValue([]);
    abilityService.resourceActionsPermission.mockResolvedValue({
      isSuperAdmin: false,
      isAdmin: true,
      moduleCreate: false,
    });

    await expect(
      service.assertModuleCreatePermission(user, 'org-1', new Set(['mod-missing']))
    ).resolves.toBeUndefined();
  });

  it('throws ForbiddenException when a module is missing and the user lacks moduleCreate permission', async () => {
    entityManager.find.mockResolvedValue([{ co_relation_id: 'mod-1' }]);
    abilityService.resourceActionsPermission.mockResolvedValue({
      isSuperAdmin: false,
      isAdmin: false,
      moduleCreate: false,
    });

    await expect(
      service.assertModuleCreatePermission(user, 'org-1', new Set(['mod-1', 'mod-missing']))
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.assertModuleCreatePermission(user, 'org-1', new Set(['mod-1', 'mod-missing']))
    ).rejects.toThrow(
      "This app requires creating modules, but you don't have permission to create modules. Contact admin."
    );
  });
});
