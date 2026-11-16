import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { AppEnvironmentService } from '@modules/app-environments/service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';

/** @group platform */
describe('app-environments workspace scoping', () => {
  const organizationId = 'org-a';
  const utilService = new AppEnvironmentUtilService({} as LicenseTermsService);

  describe('AppEnvironmentUtilService.assertOwnedByOrganization', () => {
    const managerWithExists = (exists: jest.Mock) => ({ exists }) as unknown as EntityManager;

    it('should resolve when the app and the environment belong to the workspace', async () => {
      const exists = jest.fn().mockResolvedValue(true);

      await expect(
        utilService.assertOwnedByOrganization(
          organizationId,
          { appId: 'app-1', environmentId: 'env-1' },
          managerWithExists(exists)
        )
      ).resolves.toBeUndefined();

      expect(exists).toHaveBeenCalledWith(App, { where: { id: 'app-1', organizationId } });
      expect(exists).toHaveBeenCalledWith(AppEnvironment, { where: { id: 'env-1', organizationId } });
    });

    it('should throw NotFoundException for an app outside the workspace without looking up the environment', async () => {
      const exists = jest.fn().mockResolvedValue(false);

      await expect(
        utilService.assertOwnedByOrganization(
          organizationId,
          { appId: 'app-1', environmentId: 'env-1' },
          managerWithExists(exists)
        )
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(exists).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for an environment outside the workspace', async () => {
      const exists = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await expect(
        utilService.assertOwnedByOrganization(
          organizationId,
          { appId: 'app-1', environmentId: 'env-1' },
          managerWithExists(exists)
        )
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should skip lookups for ids that were not supplied', async () => {
      const exists = jest.fn();

      await expect(
        utilService.assertOwnedByOrganization(organizationId, {}, managerWithExists(exists))
      ).resolves.toBeUndefined();

      expect(exists).not.toHaveBeenCalled();
    });
  });

  describe('AppEnvironmentService.getVersionsByEnvironment', () => {
    const service = new AppEnvironmentService(utilService, {} as LicenseTermsService);

    it.each([undefined, ''])(
      'should reject app_id=%p before querying, since an absent id matches every app',
      async (appId) => {
        await expect(service.getVersionsByEnvironment(organizationId, appId, 'env-1')).rejects.toBeInstanceOf(
          BadRequestException
        );
      }
    );
  });
});
