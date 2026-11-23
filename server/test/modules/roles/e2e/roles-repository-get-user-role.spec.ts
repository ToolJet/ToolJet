import { INestApplication } from '@nestjs/common';
import { RolesRepository } from '@modules/roles/repository';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createBuilder, createEndUser } from 'test-helper';

/** @group platform */
describe('RolesRepository', () => {
  let app: INestApplication;
  let rolesRepository: RolesRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    rolesRepository = app.get(RolesRepository);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('getUserRole()', () => {
    it('should return the only default group the user belongs to', async () => {
      const builder = await createBuilder(app, 'get-user-role-single@tooljet.io');

      const role = await rolesRepository.getUserRole(builder.user.id, builder.workspace.id);

      expect(role).toMatchObject({ name: USER_ROLE.BUILDER });
    });

    it('should return null when the user has no default group in the workspace', async () => {
      const admin = await createAdmin(app, 'get-user-role-none-admin@tooljet.io');
      const outsider = await createEndUser(app, 'get-user-role-none-outsider@tooljet.io');

      await expect(rolesRepository.getUserRole(outsider.user.id, admin.workspace.id)).resolves.toBeNull();
    });
  });
});
