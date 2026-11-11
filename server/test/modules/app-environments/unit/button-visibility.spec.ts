import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';

/** @group platform */
describe('AppEnvironmentUtilService.calculateButtonVisibility', () => {
  it('should retain workspace context for the app load subscriber while calculating promotion controls', async () => {
    const findOneOrFail = jest.fn().mockResolvedValue({ id: 'planner-app', currentVersionId: 'released-version' });
    const manager = { findOneOrFail } as unknown as EntityManager;
    const utilService = new AppEnvironmentUtilService(null as unknown as LicenseTermsService);

    await expect(
      utilService.calculateButtonVisibility(
        true,
        { isDefault: false } as AppEnvironment,
        'planner-app',
        'draft-version',
        manager
      )
    ).resolves.toEqual({ shouldRenderPromoteButton: true, shouldRenderReleaseButton: false });

    // App loads invoke AppsSubscriber, whose git configuration lookup requires organizationId.
    expect(findOneOrFail).toHaveBeenCalledWith(
      App,
      expect.objectContaining({
        select: expect.arrayContaining(['organizationId']),
        where: { id: 'planner-app' },
      })
    );
  });
});
