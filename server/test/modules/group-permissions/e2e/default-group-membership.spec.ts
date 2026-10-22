import { INestApplication } from '@nestjs/common';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createEndUser, findEntities, findEntityOrFail } from 'test-helper';

/** @group platform */
describe('GroupPermissionsUtilService', () => {
  let app: INestApplication;
  let util: GroupPermissionsUtilService;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    util = app.get(GroupPermissionsUtilService);
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('addUsersToGroup() | default groups', () => {
    it('should leave the user in exactly one default group after moving to another role', async () => {
      const admin = await createAdmin(app, 'default-group-admin@tooljet.io');
      const member = await createEndUser(app, 'default-group-member@tooljet.io', { workspace: admin.workspace });
      const builderGroup = await findEntityOrFail(GroupPermissions, {
        organizationId: admin.workspace.id,
        name: USER_ROLE.BUILDER,
        type: GROUP_PERMISSIONS_TYPE.DEFAULT,
      });

      await util.addUsersToGroup({ userIds: [member.user.id], groupId: builderGroup.id }, admin.workspace.id);

      const memberships = await findEntities(GroupUsers, { where: { userId: member.user.id }, relations: ['group'] });
      const defaultMemberships = memberships.filter((m) => m.group.type === GROUP_PERMISSIONS_TYPE.DEFAULT);
      expect(defaultMemberships).toHaveLength(1);
      expect(defaultMemberships[0].group).toMatchObject({ name: USER_ROLE.BUILDER });
    });
  });
});
