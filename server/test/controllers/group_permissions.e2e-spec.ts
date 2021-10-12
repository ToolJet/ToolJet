import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance, createApplication } from '../test.helper';
import { getManager } from 'typeorm';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';

describe('group permissions controller', () => {
  let nestApp: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    nestApp = await createNestAppInstance();
  });

  describe('POST /group_permissions', () => {
    it('should not allow non admin to create group permission', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(defaultUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(403);
    });

    it('should be able to create group permission for authenticated admin', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);
      expect(response.body.group).toBe('avengers');
      expect(response.body.organization_id).toBe(organization.id);
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    });

    it('should validate uniqueness of group permission group name', async () => {
      const {
        organization: { adminUser },
      } = await setupOrganizations(nestApp);
      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      // FIXME: setup postgres error codes and handle error gracefully
      expect(response.statusCode).toBe(500);
    });

    it('should allow different organization to have same group name', async () => {
      const {
        organization: { adminUser },
        anotherOrganization: { anotherAdminUser },
      } = await setupOrganizations(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(anotherAdminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /group_permissions/:id', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions/id')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should get group permission for authenticated admin within organization', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .get(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser));

      expect(response.statusCode).toBe(200);
      expect(response.body.group).toBe('avengers');
      expect(response.body.organization_id).toBe(organization.id);
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();
    });

    it('should not get group permission for authenticated admin not within organization', async () => {
      const {
        organization: { adminUser },
        anotherOrganization: { anotherAdminUser },
      } = await setupOrganizations(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .post(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(anotherAdminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /group_permissions/:id', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .put('/group_permissions/id')
        .set('Authorization', authHeaderForUser(defaultUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to add and remove apps to group permission', async () => {
      const {
        organization: { adminUser, app },
      } = await setupOrganizations(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ add_apps: [app.id] });

      expect(response.statusCode).toBe(200);

      const manager = getManager();
      let appsInGroup = await manager.find(AppGroupPermission, {
        where: { groupPermissionId },
      });

      expect(appsInGroup).toHaveLength(1);

      const addedApp = appsInGroup[0];

      expect(addedApp.appId).toBe(app.id);
      expect(addedApp.read).toBe(true);
      expect(addedApp.update).toBe(false);
      expect(addedApp.delete).toBe(false);

      response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ remove_apps: [app.id] });

      expect(response.statusCode).toBe(200);

      appsInGroup = await manager.find(AppGroupPermission, {
        where: { groupPermissionId },
      });

      expect(appsInGroup).toHaveLength(0);
    });

    it('should allow admin to add and remove users to group permission', async () => {
      const {
        organization: { adminUser, defaultUser },
      } = await setupOrganizations(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ add_users: [defaultUser.id] });

      expect(response.statusCode).toBe(200);

      const manager = getManager();
      let usersInGroup = await manager.find(UserGroupPermission, {
        where: { groupPermissionId },
      });

      expect(usersInGroup).toHaveLength(1);

      const addedUser = usersInGroup[0];

      expect(addedUser.userId).toBe(defaultUser.id);

      response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ remove_users: [defaultUser.id] });

      expect(response.statusCode).toBe(200);

      usersInGroup = await manager.find(UserGroupPermission, {
        where: { groupPermissionId },
      });

      expect(usersInGroup).toHaveLength(0);
    });

    it('should not allow to remove users from admin group permission without any atleast one active admin', async () => {
      const {
        organization: { adminUser, defaultUser },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        group: 'admin',
      });

      const response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${adminGroupPermission.id}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ remove_users: [defaultUser.id] });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Atleast one active admin is required.');
    });

    it('should not allow to remove any users from all_users group permission', async () => {
      const {
        organization: { adminUser, defaultUser },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        group: 'all_users',
      });

      const response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${adminGroupPermission.id}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ remove_users: [defaultUser.id] });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Cannot remove user from default group.');
    });
  });

  describe('GET /group_permissions', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to list group permission', async () => {
      const {
        organization: { adminUser, defaultUser, app, organization },
      } = await setupOrganizations(nestApp);

      // create group permission
      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const groupPermissionId = response.body.id;

      // add apps and users to group permission
      response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ add_apps: [app.id], add_users: [defaultUser.id] });

      expect(response.statusCode).toBe(200);

      // list group permission
      response = await request(nestApp.getHttpServer())
        .get('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser));
      expect(response.statusCode).toBe(200);

      const groupPermissions = response.body.group_permissions;
      const groups = groupPermissions.map((gp) => gp.group);
      const organizationId = [...new Set(groupPermissions.map((gp) => gp.organization_id))];

      expect(new Set(groups)).toEqual(new Set(['avengers', 'all_users', 'admin']));
      expect(organizationId).toEqual([organization.id]);
    });
  });

  describe('GET /group_permissions/:id/apps', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions/id/apps')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to list apps in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        group: 'admin',
        organizationId: organization.id,
      });

      const response = await request(nestApp.getHttpServer())
        .get(`/group_permissions/${adminGroupPermission.id}/apps`)
        .set('Authorization', authHeaderForUser(adminUser));

      expect(response.statusCode).toBe(200);

      const apps = response.body.apps;
      const sampleApp = apps[0];

      expect(apps).toHaveLength(1);
      expect(sampleApp.organization_id).toBe(organization.id);
      expect(sampleApp.name).toBe('sample app');

      expect(sampleApp.group_permissions).toHaveLength(1);
      expect(sampleApp.group_permissions[0].group).toBe('admin');

      expect(sampleApp.app_group_permissions).toHaveLength(1);
      expect(sampleApp.app_group_permissions[0].group_permission_id).toBe(sampleApp.group_permissions[0].id);
      expect(sampleApp.app_group_permissions[0].read).toBe(true);
      expect(sampleApp.app_group_permissions[0].update).toBe(true);
      expect(sampleApp.app_group_permissions[0].delete).toBe(true);
    });
  });

  describe('GET /group_permissions/:id/addable_apps', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions/id/addable_apps')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to list apps not in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      // create group permission
      let response = await request(nestApp.getHttpServer())
        .post('/group_permissions')
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .get(`/group_permissions/${groupPermissionId}/addable_apps`)
        .set('Authorization', authHeaderForUser(adminUser));

      expect(response.statusCode).toBe(200);

      const apps = response.body.apps;
      const sampleApp = apps[0];

      expect(apps).toHaveLength(1);
      expect(sampleApp.organization_id).toBe(organization.id);
      expect(sampleApp.name).toBe('sample app');
      expect(sampleApp.group_permissions).toHaveLength(2);

      const adminGroupPermission = sampleApp.group_permissions.find((a) => a.group == 'admin');
      const adminAppGroupPermission = sampleApp.app_group_permissions.find(
        (a) => a.group_permission_id == adminGroupPermission.id
      );
      expect(adminAppGroupPermission.read).toBe(true);
      expect(adminAppGroupPermission.update).toBe(true);
      expect(adminAppGroupPermission.delete).toBe(true);

      const userGroupPermission = sampleApp.group_permissions.find((a) => a.group == 'all_users');
      const userAppGroupPermission = sampleApp.app_group_permissions.find(
        (a) => a.group_permission_id == userGroupPermission.id
      );
      expect(userAppGroupPermission.read).toBe(true);
      expect(userAppGroupPermission.update).toBe(false);
      expect(userAppGroupPermission.delete).toBe(false);
    });
  });

  describe('GET /group_permissions/:id/users', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions/id/users')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to list users in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        group: 'admin',
        organizationId: organization.id,
      });

      const response = await request(nestApp.getHttpServer())
        .get(`/group_permissions/${adminGroupPermission.id}/users`)
        .set('Authorization', authHeaderForUser(adminUser));

      expect(response.statusCode).toBe(200);

      const users = response.body.users;
      const user = users[0];

      expect(users).toHaveLength(1);
      expect(user.organization_id).toBe(organization.id);
      expect(user.email).toBe('admin@tooljet.io');
    });
  });

  describe('GET /group_permissions/:id/addable_users', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .get('/group_permissions/id/addable_users')
        .set('Authorization', authHeaderForUser(defaultUser));

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to list users not in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        group: 'admin',
        organizationId: organization.id,
      });
      const groupPermissionId = adminGroupPermission.id;
      const response = await request(nestApp.getHttpServer())
        .get(`/group_permissions/${groupPermissionId}/addable_users`)
        .set('Authorization', authHeaderForUser(adminUser));

      expect(response.statusCode).toBe(200);

      const users = response.body.users;
      const user = users[0];

      expect(users).toHaveLength(1);
      expect(user.organization_id).toBe(organization.id);
      expect(user.email).toBe('developer@tooljet.io');
    });
  });

  describe('PUT /group_permissions/:id/app_group_permissions/:appGroupPermisionId', () => {
    it('should not allow unauthenicated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);
      const response = await request(nestApp.getHttpServer())
        .put('/group_permissions/id/app_group_permissions/id')
        .set('Authorization', authHeaderForUser(defaultUser))
        .send({ read: true });

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to update app group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'all_users',
        },
      });
      const groupPermissionId = adminGroupPermission.id;
      const appGroupPermission = await manager.findOne(AppGroupPermission, {
        groupPermissionId,
      });
      const appGroupPermissionId = appGroupPermission.id;

      expect(appGroupPermission.read).toBe(true);
      expect(appGroupPermission.update).toBe(false);

      const response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}/app_group_permissions/${appGroupPermissionId}`)
        .set('Authorization', authHeaderForUser(adminUser))
        .send({ actions: { read: false, update: true } });

      expect(response.statusCode).toBe(200);

      await appGroupPermission.reload();

      expect(appGroupPermission.read).toBe(false);
      expect(appGroupPermission.update).toBe(true);
    });

    it('should not allow admin to update app group permission of different organization', async () => {
      const {
        organization: { organization },
        anotherOrganization: { anotherAdminUser },
      } = await setupOrganizations(nestApp);

      const manager = getManager();
      const adminGroupPermission = await manager.findOne(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'all_users',
        },
      });
      const groupPermissionId = adminGroupPermission.id;
      const appGroupPermission = await manager.findOne(AppGroupPermission, {
        groupPermissionId,
      });
      const appGroupPermissionId = appGroupPermission.id;

      expect(appGroupPermission.read).toBe(true);
      expect(appGroupPermission.update).toBe(false);

      const response = await request(nestApp.getHttpServer())
        .put(`/group_permissions/${groupPermissionId}/app_group_permissions/${appGroupPermissionId}`)
        .set('Authorization', authHeaderForUser(anotherAdminUser))
        .send({ actions: { read: false, update: true } });

      expect(response.statusCode).toBe(400);
    });
  });

  async function setupOrganizations(nestApp) {
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

    const anotherAdminUserData = await createUser(nestApp, {
      email: 'another_admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const anotherAdminUser = anotherAdminUserData.user;
    const anotherOrganization = anotherAdminUserData.organization;
    const anotherDefaultUserData = await createUser(nestApp, {
      email: 'another_developer@tooljet.io',
      groups: ['all_users'],
      anotherOrganization,
    });
    const anotherDefaultUser = anotherDefaultUserData.user;

    const anotherApp = await createApplication(nestApp, {
      user: anotherAdminUser,
      name: 'another app',
      isPublic: false,
    });

    return {
      organization: { adminUser, defaultUser, organization, app },
      anotherOrganization: {
        anotherAdminUser,
        anotherDefaultUser,
        anotherOrganization,
        anotherApp,
      },
    };
  }

  afterAll(async () => {
    await nestApp.close();
  });
});
