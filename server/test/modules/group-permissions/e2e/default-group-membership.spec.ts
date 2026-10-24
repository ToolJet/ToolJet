import { BadRequestException, ConflictException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GroupUsers } from '@entities/group_users.entity';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { ERROR_HANDLER } from '@modules/group-permissions/constants/error';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
import { initTestApp, closeTestApp } from 'test-helper';
import { createAdmin, createBuilder, createEndUser, findEntities, findEntityOrFail } from 'test-helper';

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

  function findDefaultGroup(workspaceId: string, name: USER_ROLE) {
    return findEntityOrFail(GroupPermissions, {
      organizationId: workspaceId,
      name,
      type: GROUP_PERMISSIONS_TYPE.DEFAULT,
    });
  }

  async function defaultRolesOf(userId: string): Promise<string[]> {
    const memberships = await findEntities(GroupUsers, { where: { userId }, relations: ['group'] });
    return memberships.filter((m) => m.group.type === GROUP_PERMISSIONS_TYPE.DEFAULT).map((m) => m.group.name);
  }

  describe('addUsersToGroup() | default groups', () => {
    it('should leave a builder in only the end-user default group after moving them there', async () => {
      const admin = await createAdmin(app, 'default-group-builder-to-end-user-admin@tooljet.io');
      const member = await createBuilder(app, 'default-group-builder-to-end-user@tooljet.io', {
        workspace: admin.workspace,
      });
      const endUserGroup = await findDefaultGroup(admin.workspace.id, USER_ROLE.END_USER);

      await util.addUsersToGroup({ userIds: [member.user.id], groupId: endUserGroup.id }, admin.workspace.id);

      expect(await defaultRolesOf(member.user.id)).toEqual([USER_ROLE.END_USER]);
    });

    it('should leave an admin in only the builder default group after moving them there, while another admin remains', async () => {
      const admin = await createAdmin(app, 'default-group-admin-to-builder-admin@tooljet.io');
      const movedAdmin = await createAdmin(app, 'default-group-admin-to-builder-moved@tooljet.io', {
        workspace: admin.workspace,
      });
      const builderGroup = await findDefaultGroup(admin.workspace.id, USER_ROLE.BUILDER);

      await util.addUsersToGroup({ userIds: [movedAdmin.user.id], groupId: builderGroup.id }, admin.workspace.id);

      expect(await defaultRolesOf(movedAdmin.user.id)).toEqual([USER_ROLE.BUILDER]);
      expect(await defaultRolesOf(admin.user.id)).toEqual([USER_ROLE.ADMIN]);
    });

    it('should reject moving the only admin out of the admin default group and keep their membership', async () => {
      const soleAdmin = await createAdmin(app, 'default-group-sole-admin@tooljet.io');
      const builderGroup = await findDefaultGroup(soleAdmin.workspace.id, USER_ROLE.BUILDER);

      const result = util.addUsersToGroup(
        { userIds: [soleAdmin.user.id], groupId: builderGroup.id },
        soleAdmin.workspace.id
      );

      await expect(result).rejects.toBeInstanceOf(BadRequestException);
      await expect(result).rejects.toMatchObject({
        response: { message: { error: ERROR_HANDLER.EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED } },
      });
      expect(await defaultRolesOf(soleAdmin.user.id)).toEqual([USER_ROLE.ADMIN]);
    });

    it('should reject an end user moving into the builder default group without allowRoleChange and write nothing', async () => {
      const admin = await createAdmin(app, 'default-group-end-user-conflict-admin@tooljet.io');
      const member = await createEndUser(app, 'default-group-end-user-conflict@tooljet.io', {
        workspace: admin.workspace,
      });
      const builderGroup = await findDefaultGroup(admin.workspace.id, USER_ROLE.BUILDER);

      await expect(
        util.addUsersToGroup({ userIds: [member.user.id], groupId: builderGroup.id }, admin.workspace.id)
      ).rejects.toBeInstanceOf(ConflictException);

      expect(await defaultRolesOf(member.user.id)).toEqual([USER_ROLE.END_USER]);
    });

    it('should promote an end user to builder with allowRoleChange and leave them in only the builder default group', async () => {
      const admin = await createAdmin(app, 'default-group-end-user-promote-admin@tooljet.io');
      const member = await createEndUser(app, 'default-group-end-user-promote@tooljet.io', {
        workspace: admin.workspace,
      });
      const builderGroup = await findDefaultGroup(admin.workspace.id, USER_ROLE.BUILDER);

      await util.addUsersToGroup(
        { userIds: [member.user.id], groupId: builderGroup.id, allowRoleChange: true },
        admin.workspace.id
      );

      expect(await defaultRolesOf(member.user.id)).toEqual([USER_ROLE.BUILDER]);
    });
  });

  describe('POST /api/v2/group-permissions/:id/users | default groups', () => {
    it('should return 400 and keep the admin membership when the only admin is sent to the builder default group', async () => {
      const soleAdmin = await createAdmin(app, 'default-group-http-sole-admin@tooljet.io');
      const builderGroup = await findDefaultGroup(soleAdmin.workspace.id, USER_ROLE.BUILDER);

      const response = await request(app.getHttpServer())
        .post(`/api/v2/group-permissions/${builderGroup.id}/users`)
        .set('tj-workspace-id', soleAdmin.workspace.id)
        .set('Cookie', soleAdmin.cookie)
        .send({ userIds: [soleAdmin.user.id], groupId: builderGroup.id });

      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        message: { error: ERROR_HANDLER.EDITING_LAST_ADMIN_ROLE_NOT_ALLOWED },
      });
      expect(await defaultRolesOf(soleAdmin.user.id)).toEqual([USER_ROLE.ADMIN]);
    });
  });
});
