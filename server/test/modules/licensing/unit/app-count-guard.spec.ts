/** @group platform */
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { AppsRepository } from '@modules/apps/repository';
import { AppCountGuard } from '@modules/licensing/guards/app.guard';
import { ResourceCountGuard } from '@modules/licensing/guards/resourceCount.guard';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';

type FetchTotalAppCount = (manager: EntityManager, organizationId: string) => Promise<number>;

function stubManager(appTotal: number) {
  return {
    count: jest.fn().mockResolvedValue(appTotal),
    find: jest.fn(),
  } as unknown as EntityManager & { count: jest.Mock; find: jest.Mock };
}

const licenseTermsService = {
  getLicenseTerms: jest.fn(),
} as unknown as LicenseTermsService;

const guards: [string, () => FetchTotalAppCount][] = [
  [
    'AppCountGuard',
    () => {
      const guard = new AppCountGuard(licenseTermsService);
      return guard.fetchTotalAppCount.bind(guard);
    },
  ],
  [
    'ResourceCountGuard',
    () => {
      const guard = new ResourceCountGuard(null as unknown as AppsRepository, licenseTermsService);
      return (guard as unknown as { fetchTotalAppCount: FetchTotalAppCount }).fetchTotalAppCount.bind(guard);
    },
  ],
];

describe.each(guards)('%s', (_name, buildFetchTotalAppCount) => {
  const originalEdition = process.env.TOOLJET_EDITION;

  afterEach(() => {
    if (originalEdition === undefined) delete process.env.TOOLJET_EDITION;
    else process.env.TOOLJET_EDITION = originalEdition;
  });

  describe('fetchTotalAppCount', () => {
    it('should count active-workspace front-end apps instance-wide with a single COUNT query on self-hosted', async () => {
      process.env.TOOLJET_EDITION = 'ee';
      const manager = stubManager(30);

      await expect(buildFetchTotalAppCount()(manager, 'org-1')).resolves.toBe(30);

      expect(manager.count).toHaveBeenCalledTimes(1);
      expect(manager.count).toHaveBeenCalledWith(App, {
        where: { type: APP_TYPES.FRONT_END, organization: { status: WORKSPACE_STATUS.ACTIVE } },
        relations: ['organization'],
      });
      expect(manager.find).not.toHaveBeenCalled();
    });

    it('should scope the COUNT to the workspace on cloud', async () => {
      process.env.TOOLJET_EDITION = 'cloud';
      const manager = stubManager(3);

      await expect(buildFetchTotalAppCount()(manager, 'org-1')).resolves.toBe(3);

      expect(manager.count).toHaveBeenCalledWith(App, {
        where: { type: APP_TYPES.FRONT_END, organization: { status: WORKSPACE_STATUS.ACTIVE, id: 'org-1' } },
        relations: ['organization'],
      });
      expect(manager.find).not.toHaveBeenCalled();
    });
  });
});
