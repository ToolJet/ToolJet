import { INestApplication } from '@nestjs/common';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createBuilder, createEndUser, findEntityOrFail, saveEntity } from 'test-helper';

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

  // Seeds the invalid state the lookup must survive: one user in two DEFAULT groups of the same workspace.
  async function addToDefaultGroup(userId: string, organizationId: string, name: USER_ROLE) {
    const group = await findEntityOrFail(GroupPermissions, {
      organizationId,
      name,
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    });
    await saveEntity(GroupUsers, { groupId: group.id, userId });
  }

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

    it('should prefer admin over builder and end-user when the user holds several default groups', async () => {
      const admin = await createAdmin(app, 'get-user-role-admin-wins@tooljet.io');
      await addToDefaultGroup(admin.user.id, admin.workspace.id, USER_ROLE.END_USER);
      await addToDefaultGroup(admin.user.id, admin.workspace.id, USER_ROLE.BUILDER);

      const role = await rolesRepository.getUserRole(admin.user.id, admin.workspace.id);

      expect(role).toMatchObject({ name: USER_ROLE.ADMIN });
    });

    it('should prefer builder over end-user when the user holds both default groups', async () => {
      const builder = await createBuilder(app, 'get-user-role-builder-wins@tooljet.io');
      await addToDefaultGroup(builder.user.id, builder.workspace.id, USER_ROLE.END_USER);

      const role = await rolesRepository.getUserRole(builder.user.id, builder.workspace.id);

      expect(role).toMatchObject({ name: USER_ROLE.BUILDER });
    });
  });
});
