import { INestApplication, BadRequestException } from '@nestjs/common';
import { AppsService } from '@services/apps.service';
import { clearDB, createNestAppInstance, setupOrganization, createApplicationVersion } from '../test.helper';

describe('AppsService', () => {
  let service: AppsService;
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<AppsService>(AppsService);
  });

  describe('Create Version', () => {
    it('should be able to create version', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      const v1 = await createApplicationVersion(nestApp, app, {
        name: 'v1',
        definition: { foo: 'bar' },
      });

      const newVersion = await service.createVersion(adminUser, app, 'v2', v1.id);

      expect(newVersion.id).toBeDefined();
      expect(newVersion.name).toBe('v2');
    });

    it('should not be able to create version with empty name', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      const v1 = await createApplicationVersion(nestApp, app, {
        name: 'v1',
        definition: { foo: 'bar' },
      });

      await expect(service.createVersion(adminUser, app, '', v1.id)).rejects.toEqual(
        new BadRequestException('The version name should not be empty')
      );
    });

    it('should not be able to create version with more than 255 characters', async () => {
      const { adminUser, app } = await setupOrganization(nestApp);

      const v1 = await createApplicationVersion(nestApp, app, {
        name: 'v1',
        definition: { foo: 'bar' },
      });

      await expect(service.createVersion(adminUser, app, 'v2'.repeat(200), v1.id)).rejects.toEqual(
        new BadRequestException('The version name cannot be more than 255 characters')
      );
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
