import {
  clearDB,
  createUser,
  createNestAppInstance,
  createApplication,
  createAppGroupPermission,
  createUserGroupPermissions,
  createGroupPermission,
} from '../test.helper';
import { UsersService } from '../../src/services/users.service';
import { INestApplication } from '@nestjs/common';
import { getManager } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';

describe('UsersService', () => {
  let nestApp: INestApplication;
  let service: UsersService;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
    service = nestApp.get<UsersService>(UsersService);
  });

  describe('.create', () => {
    it('should create user', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      await service.create(
        {
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Wick',
        },
        adminUser.organization,
        ['all_users']
      );

      const manager = getManager();
      const newUser = await manager.findOne(User, { email: 'john@example.com' });
      expect(newUser.firstName).toEqual('John');
      expect(newUser.lastName).toEqual('Wick');
      expect(newUser.organizationId).toBe(adminUser.organizationId);

      // expect default group permission is associated
      const userGroups = await manager.find(UserGroupPermission, { userId: newUser.id });
      expect(userGroups).toHaveLength(1);

      const groupPermission = await manager.findOne(GroupPermission, { id: userGroups[0].groupPermissionId });
      expect(groupPermission.group).toEqual('all_users');
      expect(groupPermission.organizationId).toEqual(adminUser.organizationId);
    });
  });

  describe('.update', () => {
    it('should update user', async () => {
      const { defaultUser } = await setupOrganization(nestApp);

      await service.update(defaultUser.id, { firstName: 'Updated Name' });
      await defaultUser.reload();

      expect(defaultUser.firstName).toEqual('Updated Name');
    });

    it('should throw error when adding non existent user groups', async () => {
      const { defaultUser } = await setupOrganization(nestApp);

      await expect(service.update(defaultUser.id, { addGroups: ['admin', 'non-existent'] })).rejects.toThrow(
        'non-existent group does not exist for current organization'
      );
    });

    it('should add user groups', async () => {
      const { defaultUser } = await setupOrganization(nestApp);
      await createGroupPermission(nestApp, { organizationId: defaultUser.organizationId, group: 'new-group' });

      await service.update(defaultUser.id, { addGroups: ['new-group'] });
      await defaultUser.reload();

      const userGroups = (await defaultUser.groupPermissions).map((groupPermission) => groupPermission.group);

      expect(userGroups.includes('new-group')).toBeTruthy;
    });

    it('should not add duplicate user groups', async () => {
      const { defaultUser } = await setupOrganization(nestApp);
      await createGroupPermission(nestApp, { organizationId: defaultUser.organizationId, group: 'new-group' });

      await service.update(defaultUser.id, { addGroups: ['new-group'] });
      await defaultUser.reload();

      await service.update(defaultUser.id, { addGroups: ['new-group', 'new-group'] });
      await defaultUser.reload();

      const allUserGroups = (await defaultUser.groupPermissions).map((x) => x.group);
      expect(new Set(allUserGroups)).toEqual(new Set(['all_users', 'new-group']));
    });

    it('should remove user groups', async () => {
      const { defaultUser } = await setupOrganization(nestApp);
      await createGroupPermission(nestApp, { organizationId: defaultUser.organizationId, group: 'new-group' });

      await service.update(defaultUser.id, { addGroups: ['new-group'] });
      await defaultUser.reload();
      expect(await defaultUser.groupPermissions).toHaveLength(2);

      await service.update(defaultUser.id, { removeGroups: ['new-group'] });
      await defaultUser.reload();
      const allUserGroups = (await defaultUser.groupPermissions).map((x) => x.group);
      expect(new Set(allUserGroups)).toEqual(new Set(['all_users']));
    });

    it('should remove user groups only if it exists', async () => {
      const { defaultUser } = await setupOrganization(nestApp);
      await createGroupPermission(nestApp, { organizationId: defaultUser.organizationId, group: 'new-group' });

      await service.update(defaultUser.id, { addGroups: ['new-group'] });
      await defaultUser.reload();
      expect(await defaultUser.groupPermissions).toHaveLength(2);

      await service.update(defaultUser.id, { removeGroups: ['new-group', 'new-group', 'non-existent'] });
      await defaultUser.reload();
      const allUserGroups = (await defaultUser.groupPermissions).map((x) => x.group);
      expect(new Set(allUserGroups)).toEqual(new Set(['all_users']));
    });

    it('should throw error when trying to remove admin user group if there is only one admin', async () => {
      const { adminUser } = await setupOrganization(nestApp);

      await expect(service.update(adminUser.id, { removeGroups: ['admin'] })).rejects.toThrow(
        'Atleast one active admin is required.'
      );
    });
  });

  describe('.groupPermissions', () => {
    it('should return group permissions for the user', async () => {
      const { adminUser, defaultUser } = await setupOrganization(nestApp);

      await createGroupPermission(nestApp, { organizationId: adminUser.organizationId, group: 'group1' });
      await service.update(adminUser.id, { addGroups: ['group1'] });
      await adminUser.reload();

      await createGroupPermission(nestApp, { organizationId: defaultUser.organizationId, group: 'group2' });
      await service.update(defaultUser.id, { addGroups: ['group2'] });
      await defaultUser.reload();

      let groupPermissions = (await service.groupPermissions(adminUser)).map((x) => x.group);
      expect(new Set(groupPermissions)).toEqual(new Set(['all_users', 'admin', 'group1']));

      groupPermissions = (await service.groupPermissions(defaultUser)).map((x) => x.group);
      expect(new Set(groupPermissions)).toEqual(new Set(['all_users', 'group2']));
    });
  });

  describe('.appGroupPermissions', () => {
    it('should return app group permissions for the user', async () => {
      const { adminUser, defaultUser, app } = await setupOrganization(nestApp);
      let groupPermissionIdsFromApp = (await service.appGroupPermissions(adminUser, app.id)).map(
        (x) => x.groupPermissionId
      );
      const adminGroupPermissionIds = (await service.groupPermissions(adminUser))
        .filter((x) => x.group == 'admin')
        .map((x) => x.id);

      expect(new Set(groupPermissionIdsFromApp)).toEqual(new Set(adminGroupPermissionIds));

      groupPermissionIdsFromApp = (await service.appGroupPermissions(defaultUser, app.id)).map(
        (x) => x.groupPermissionId
      );

      expect(groupPermissionIdsFromApp).toEqual([]);
    });
  });

  describe('.groupPermissionsForOrganization', () => {
    it('should return all group permissions within organization', async () => {
      const { defaultUser } = await setupOrganization(nestApp);
      const groupPermissions = (await service.groupPermissionsForOrganization(defaultUser.organizationId)).map(
        (x) => x.group
      );

      expect(new Set(groupPermissions)).toEqual(new Set(['all_users', 'admin']));
    });
  });

  describe('.hasGroup', () => {
    it('should return false if user has group', async () => {
      const { adminUser } = await setupOrganization(nestApp);
      expect(await service.hasGroup(adminUser, 'admin')).toBeTruthy();
    });

    it('should return true if user has group', async () => {
      const { adminUser } = await setupOrganization(nestApp);
      expect(await service.hasGroup(adminUser, 'superduper-admin')).toBeFalsy();
    });
  });

  describe('.userCan', () => {
    describe('perform action on invalid entity', () => {
      it('should return false', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);

        expect(await service.userCan(adminUser, 'create', 'Ice cream', app.id)).toEqual(false);
        expect(await service.userCan(adminUser, 'read', 'Ice cream', app.id)).toEqual(false);
        expect(await service.userCan(adminUser, 'update', 'Ice cream', app.id)).toEqual(false);
        expect(await service.userCan(adminUser, 'delete', 'Ice cream', app.id)).toEqual(false);
      });
    });

    describe("perform action on 'App' entity", () => {
      it('should return boolean based on permissible actions', async () => {
        const { adminUser, app } = await setupOrganization(nestApp);

        expect(await service.userCan(adminUser, 'create', 'App', app.id)).toEqual(true);
        expect(await service.userCan(adminUser, 'read', 'App', app.id)).toEqual(true);
        expect(await service.userCan(adminUser, 'update', 'App', app.id)).toEqual(true);
        expect(await service.userCan(adminUser, 'delete', 'App', app.id)).toEqual(true);
      });

      it('should allow actions with custom groups based on app permissions', async () => {
        const { defaultUser, app } = await setupOrganization(nestApp);
        const userGroups = await createUserGroupPermissions(nestApp, defaultUser, ['developer']);
        const developerUserGroup = userGroups[0];
        await createAppGroupPermission(nestApp, app, developerUserGroup.groupPermissionId, {
          read: true,
          update: true,
          delete: false,
        });

        expect(await service.userCan(defaultUser, 'create', 'App', app.id)).toEqual(false);
        expect(await service.userCan(defaultUser, 'read', 'App', app.id)).toEqual(true);
        expect(await service.userCan(defaultUser, 'update', 'App', app.id)).toEqual(true);
        expect(await service.userCan(defaultUser, 'delete', 'App', app.id)).toEqual(false);
      });

      it('should opt the permissible group among multiple groups', async () => {
        const { defaultUser, app } = await setupOrganization(nestApp);
        const userGroups = await createUserGroupPermissions(nestApp, defaultUser, ['updater', 'deleter']);

        const updaterUserGroup = userGroups[0];
        await createAppGroupPermission(nestApp, app, updaterUserGroup.groupPermissionId, {
          read: true,
          update: true,
          delete: false,
        });

        const deleterUserGroup = userGroups[1];
        await createAppGroupPermission(nestApp, app, deleterUserGroup.groupPermissionId, {
          read: false,
          update: false,
          delete: true,
        });

        expect(await service.userCan(defaultUser, 'create', 'App', app.id)).toEqual(false);
        expect(await service.userCan(defaultUser, 'read', 'App', app.id)).toEqual(true);
        expect(await service.userCan(defaultUser, 'update', 'App', app.id)).toEqual(true);
        expect(await service.userCan(defaultUser, 'delete', 'App', app.id)).toEqual(true);
      });
    });
  });

  async function setupOrganization(nestApp) {
    const adminUserData = await createUser(nestApp, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;
    const defaultUserData = await createUser(nestApp, {
      email: 'developer@tooljet.io',
      groups: ['all_users'],
      organization,
    });
    const defaultUser = defaultUserData.user;

    const app = await createApplication(nestApp, {
      user: adminUser,
      name: 'sample app',
      isPublic: false,
    });

    return { adminUser, defaultUser, app };
  }

  afterAll(async () => {
    await nestApp.close();
  });
});
