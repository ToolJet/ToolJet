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
      const mockReq = {} as globalThis.Request;

      await expect(service.create(mockReq, adminUser, '')).rejects.toEqual(
        new BadRequestException('Cannot create group without name')
      );
    });

    it('should validate uniqueness of group permission group name', async () => {
      const { adminUser } = await setupOrganization(nestApp);
      const mockReq = {} as globalThis.Request;

      const data = await service.create(mockReq, adminUser, 'avengers');

      expect(data.id).toBeDefined();
      expect(data.organizationId).toBeDefined();
      expect(data.group).toEqual('avengers');

      await expect(service.create(mockReq, adminUser, 'avengers')).rejects.toEqual(
        new ConflictException('Group name already exist')
      );
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
