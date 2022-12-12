import { INestApplication, ConflictException, BadRequestException } from '@nestjs/common';
import { GroupPermissionsService } from '@services/group_permissions.service';
import { clearDB, createNestAppInstance, setupOrganization } from '../test.helper';

describe('GroupPermissionsService', () => {
  let service: GroupPermissionsService;
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<GroupPermissionsService>(GroupPermissionsService);
  });

  describe('.create', () => {
    it('should pass group name', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      await expect(service.create(adminUser, '')).rejects.toEqual(
        new BadRequestException('Cannot create group without name')
      );
    });

    it('should validate uniqueness of group permission group name', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      await service.create(adminUser, 'avengers');

      await expect(service.create(adminUser, 'avengers')).rejects.toEqual(
        new ConflictException('Group name already exist')
      );
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
