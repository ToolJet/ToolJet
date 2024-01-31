import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, createApplication, authenticateUser } from '../test.helper';
import { getManager } from 'typeorm';
import { AppGroupPermission } from 'src/entities/app_group_permission.entity';
import { UserGroupPermission } from 'src/entities/user_group_permission.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { AuditLog } from 'src/entities/audit_log.entity';

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

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(403);
    });

    it('should be able to create group permission for super admin', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      expect(updatedGroup.group).toBe('avengers');
      expect(updatedGroup.organizationId).toBe(organization.id);
      expect(updatedGroup.createdAt).toBeDefined();
      expect(updatedGroup.updatedAt).toBeDefined();

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: superAdminUserData.user.id,
          resourceType: 'GROUP_PERMISSION',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUser.organizationId);
      expect(auditLog.resourceId).toEqual(updatedGroup.id);
      expect(auditLog.resourceType).toEqual('GROUP_PERMISSION');
      expect(auditLog.resourceName).toEqual('avengers');
      expect(auditLog.actionType).toEqual('GROUP_PERMISSION_CREATE');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should be able to create group permission for authenticated admin', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      const response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      expect(updatedGroup.group).toBe('avengers');
      expect(updatedGroup.organizationId).toBe(organization.id);
      expect(updatedGroup.createdAt).toBeDefined();
      expect(updatedGroup.updatedAt).toBeDefined();

      // should create audit log
      const auditLog = await AuditLog.findOne({
        where: {
          userId: adminUser.id,
          resourceType: 'GROUP_PERMISSION',
        },
      });

      expect(auditLog.organizationId).toEqual(adminUser.organizationId);
      expect(auditLog.resourceId).toEqual(updatedGroup.id);
      expect(auditLog.resourceType).toEqual('GROUP_PERMISSION');
      expect(auditLog.resourceName).toEqual('avengers');
      expect(auditLog.actionType).toEqual('GROUP_PERMISSION_CREATE');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should not allow to create system defined group names', async () => {
      const {
        organization: { adminUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      const reservedGroups = ['All Users', 'Admin'];

      for (let i = 0; i < reservedGroups.length; i += 1) {
        const response = await request(nestApp.getHttpServer())
          .post('/api/group_permissions')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ group: reservedGroups[i] });

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Group name already exist');
      }
    });

    it('should validate uniqueness of group permission group name', async () => {
      const {
        organization: { adminUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(409);
    });

    it('should allow different organization to have same group name', async () => {
      const {
        organization: { adminUser },
        anotherOrganization: { anotherAdminUser },
      } = await setupOrganizations(nestApp);

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, anotherAdminUser.email);
      anotherAdminUser['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', anotherAdminUser.defaultOrganizationId)
        .set('Cookie', anotherAdminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('GET /group_permissions/:id', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions/id')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should get group permission for authenticated admin within organization or super admin of the instance', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      response = await request(nestApp.getHttpServer())
        .get(`/api/group_permissions/${updatedGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie']);

      expect(response.statusCode).toBe(200);
      expect(response.body.group).toBe('avengers');
      expect(response.body.organization_id).toBe(organization.id);
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
      expect(response.body.updated_at).toBeDefined();

      response = await request(nestApp.getHttpServer())
        .get(`/api/group_permissions/${updatedGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie']);

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

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, anotherAdminUser.email);
      anotherAdminUser['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      const groupPermissionId = response.body.id;

      response = await request(nestApp.getHttpServer())
        .post(`/api/group_permissions/${groupPermissionId}`)
        .set('tj-workspace-id', anotherAdminUser.defaultOrganizationId)
        .set('Cookie', anotherAdminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /group_permissions/:id', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .put('/api/group_permissions/id')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin to update a group name', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ group: 'avengers' });

      expect(createResponse.statusCode).toBe(201);

      let updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      //update a group name
      const updateResponse = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${updatedGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'titans' });

      expect(updateResponse.statusCode).toBe(200);

      updatedGroup = await getManager().findOne(GroupPermission, updatedGroup.id);
      expect(updatedGroup.group).toEqual('titans');
    });

    it('should allow super admin to update a group name', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(createResponse.statusCode).toBe(201);

      let updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      //update a group name
      const updateResponse = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${updatedGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .send({ name: 'titans' });

      expect(updateResponse.statusCode).toBe(200);

      updatedGroup = await getManager().findOne(GroupPermission, updatedGroup.id);
      expect(updatedGroup.group).toEqual('titans');
    });

    it('should not be able to update a group name with existing names', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const loggedUser = authenticateUser(nestApp);
      adminUser['tokenCookie'] = (await loggedUser).tokenCookie;

      const createResponse = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(createResponse.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      //update a group name
      const updateResponse = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${updatedGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ name: 'All users' });

      expect(updateResponse.statusCode).toBe(400);
    });

    it('should not be able to update a default group name', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);

      const adminGroup = await getManager().findOne(GroupPermission, {
        where: { group: 'admin', organizationId: organization.id },
      });

      //update a group name
      const updateResponse = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${adminGroup.id}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ name: 'titans' });

      expect(updateResponse.statusCode).toBe(400);
    });

    it('should allow admin/super admin to add and remove apps to group permission', async () => {
      const {
        organization: { adminUser, app, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;
      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      const groupPermissionId = updatedGroup.id;

      for (const user of [adminUser, superAdminUserData.user]) {
        response = await request(nestApp.getHttpServer())
          .put(`/api/group_permissions/${groupPermissionId}/app`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
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

        // should create audit log
        let auditLog = await AuditLog.findOne({
          where: {
            userId: user.id,
            resourceType: 'GROUP_PERMISSION',
          },
          order: { createdAt: 'DESC' },
        });
        expect(auditLog.organizationId).toEqual(adminUser.organizationId);
        expect(auditLog.resourceId).toEqual(groupPermissionId);
        expect(auditLog.resourceType).toEqual('GROUP_PERMISSION');
        expect(auditLog.resourceName).toEqual('avengers');
        expect(auditLog.actionType).toEqual('GROUP_PERMISSION_UPDATE');
        expect(auditLog.createdAt).toBeDefined();
        expect(auditLog.metadata).toEqual({
          updateParams: {
            add_apps: [app.id],
          },
        });

        response = await request(nestApp.getHttpServer())
          .put(`/api/group_permissions/${groupPermissionId}/app`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
          .send({ remove_apps: [app.id] });

        expect(response.statusCode).toBe(200);

        appsInGroup = await manager.find(AppGroupPermission, {
          where: { groupPermissionId },
        });

        expect(appsInGroup).toHaveLength(0);

        // should create audit log
        auditLog = await AuditLog.findOne({
          where: {
            userId: user.id,
            resourceType: 'GROUP_PERMISSION',
          },
          order: { createdAt: 'DESC' },
        });
        expect(auditLog.organizationId).toEqual(adminUser.organizationId);
        expect(auditLog.resourceId).toEqual(groupPermissionId);
        expect(auditLog.resourceType).toEqual('GROUP_PERMISSION');
        expect(auditLog.resourceName).toEqual('avengers');
        expect(auditLog.actionType).toEqual('GROUP_PERMISSION_UPDATE');
        expect(auditLog.createdAt).toBeDefined();
        expect(auditLog.metadata).toEqual({
          updateParams: {
            remove_apps: [app.id],
          },
        });
      }
    });

    it('should allow allow admin/super admin to add and remove users to group permission', async () => {
      const {
        organization: { adminUser, defaultUser, organization },
      } = await setupOrganizations(nestApp);

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });
      const groupPermissionId = updatedGroup.id;

      for (const user of [adminUser, superAdminUserData.user]) {
        response = await request(nestApp.getHttpServer())
          .put(`/api/group_permissions/${groupPermissionId}/user`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
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
          .put(`/api/group_permissions/${groupPermissionId}/user`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', adminUser['tokenCookie'])
          .send({ remove_users: [defaultUser.id] });

        expect(response.statusCode).toBe(200);

        usersInGroup = await manager.find(UserGroupPermission, {
          where: { groupPermissionId },
        });

        expect(usersInGroup).toHaveLength(0);
      }
    });

    it('should not allow to remove users from admin group permission without any at least one active admin', async () => {
      const { user, organization } = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const manager = getManager();
      const adminGroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          group: 'admin',
          organizationId: organization.id,
        },
      });

      const loggedUser = await authenticateUser(nestApp);

      const response = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${adminGroupPermission.id}/user`)
        .set('tj-workspace-id', user.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ remove_users: [user.id] });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Atleast one active admin is required.');
    });

    it('should not allow to remove any users from all_users group permission', async () => {
      const {
        organization: { adminUser, defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      const manager = getManager();
      const adminGroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          group: 'all_users',
          organizationId: adminUser.organizationId,
        },
      });

      const response = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${adminGroupPermission.id}/user`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ remove_users: [defaultUser.id] });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Cannot remove user from default group.');
    });
  });

  describe('GET /group_permissions', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to list group permission', async () => {
      const {
        organization: { adminUser, defaultUser, app, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });
      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      // create group permission
      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const updatedGroup: GroupPermission = await getManager().findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      const groupPermissionId = updatedGroup.id;

      // add apps and users to group permission
      response = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${groupPermissionId}`)
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ add_apps: [app.id], add_users: [defaultUser.id] });

      expect(response.statusCode).toBe(200);

      // list group permission
      for (const user of [adminUser, superAdminUserData.user]) {
        response = await request(nestApp.getHttpServer())
          .get('/api/group_permissions')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie']);
        expect(response.statusCode).toBe(200);

        const groupPermissions = response.body.group_permissions;
        const groups = groupPermissions.map((gp) => gp.group);
        const organizationId = [...new Set(groupPermissions.map((gp) => gp.organization_id))];

        expect(new Set(groups)).toEqual(new Set(['avengers', 'all_users', 'admin']));
        expect(organizationId).toEqual([organization.id]);
      }
    });
  });

  describe('GET /group_permissions/:id/apps', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions/id/apps')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to list apps in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });
      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      const manager = getManager();
      const adminGroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          group: 'admin',
          organizationId: organization.id,
        },
      });

      for (const user of [adminUser, superAdminUserData.user]) {
        const response = await request(nestApp.getHttpServer())
          .get(`/api/group_permissions/${adminGroupPermission.id}/apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie']);

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
      }
    });
  });

  describe('GET /group_permissions/:id/addable_apps', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions/id/addable_apps')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to list apps not in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;
      // create group permission
      let response = await request(nestApp.getHttpServer())
        .post('/api/group_permissions')
        .set('tj-workspace-id', adminUser.defaultOrganizationId)
        .set('Cookie', adminUser['tokenCookie'])
        .send({ group: 'avengers' });

      expect(response.statusCode).toBe(201);

      const manager = getManager();
      const groupPermission: GroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'avengers',
        },
      });

      const groupPermissionId = groupPermission.id;

      for (const user of [adminUser, superAdminUserData.user]) {
        response = await request(nestApp.getHttpServer())
          .get(`/api/group_permissions/${groupPermissionId}/addable_apps`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie']);

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
        expect(userAppGroupPermission.read).toBe(false);
        expect(userAppGroupPermission.update).toBe(false);
        expect(userAppGroupPermission.delete).toBe(false);
      }
    });
  });

  describe('GET /group_permissions/:id/users', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions/id/users')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to list users in group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });
      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      const manager = getManager();
      const adminGroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          group: 'admin',
          organizationId: organization.id,
        },
      });

      for (const userData of [adminUser, superAdminUserData.user]) {
        const response = await request(nestApp.getHttpServer())
          .get(`/api/group_permissions/${adminGroupPermission.id}/users`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        const users = response.body.users;

        const user = users[0];

        expect(users).toHaveLength(1);
        expect(Object.keys(user).sort()).toEqual(['id', 'email', 'first_name', 'last_name'].sort());
        expect(user.email).toBe('admin@tooljet.io');
        expect(user.first_name).toBe('test');
        expect(user.last_name).toBe('test');
      }
    });
  });

  describe('GET /group_permissions/:id/addable_users', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .get('/api/group_permissions/id/addable_users')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie);

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to list users not in group permission', async () => {
      const adminUser = await createUser(nestApp, { email: 'admin@tooljet.io' });
      const userone = await createUser(nestApp, {
        email: 'userone@tooljet.io',
        groups: ['all_users'],
        organization: adminUser.organization,
      });

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(
        nestApp,
        superAdminUserData.user.email,
        'password',
        adminUser.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const manager = getManager();
      const adminGroupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          group: 'admin',
          organizationId: adminUser.organization.id,
        },
      });
      const groupPermissionId = adminGroupPermission.id;

      for (const userData of [adminUser, superAdminUserData]) {
        const response = await request(nestApp.getHttpServer())
          .get(`/api/group_permissions/${groupPermissionId}/addable_users?input=userone@tooljet.io`)
          .set('tj-workspace-id', adminUser.user.defaultOrganizationId)
          .set('Cookie', userData['tokenCookie']);

        expect(response.statusCode).toBe(200);

        const users = response.body.users;
        const user = users[0];

        expect(users).toHaveLength(1);
        expect(user.first_name).toBe('test');
        expect(user.last_name).toBe('test');
        expect(user.id).toBe(userone.user.id);
        expect(Object.keys(user).sort()).toEqual(['first_name', 'last_name', 'id', 'email'].sort());
      }
    });
  });

  describe('PUT /group_permissions/:id/app_group_permissions/:appGroupPermisionId', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, 'developer@tooljet.io');

      const response = await request(nestApp.getHttpServer())
        .put('/api/group_permissions/id/app_group_permissions/id')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ read: true });

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to update app group permission', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      const manager = getManager();
      const groupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'all_users',
        },
      });
      const groupPermissionId = groupPermission.id;
      const appGroupPermission = await manager.findOneOrFail(AppGroupPermission, {
        where: {
          groupPermissionId,
        },
      });
      const appGroupPermissionId = appGroupPermission.id;

      expect(appGroupPermission.read).toBe(false);
      expect(appGroupPermission.update).toBe(false);

      for (const user of [adminUser, superAdminUserData.user]) {
        const response = await request(nestApp.getHttpServer())
          .put(`/api/group_permissions/${groupPermissionId}/app_group_permissions/${appGroupPermissionId}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
          .send({ actions: { read: false, update: true } });

        expect(response.statusCode).toBe(200);

        await appGroupPermission.reload();

        expect(appGroupPermission.read).toBe(false);
        expect(appGroupPermission.update).toBe(true);

        // should create audit log
        const auditLog = await AuditLog.findOne({
          where: { userId: user.id, actionType: 'APP_GROUP_PERMISSION_UPDATE', resourceType: 'APP_GROUP_PERMISSION' },
        });

        expect(auditLog.organizationId).toEqual(adminUser.organizationId);
        expect(auditLog.resourceId).toEqual(appGroupPermissionId);
        expect(auditLog.resourceType).toEqual('APP_GROUP_PERMISSION');
        expect(auditLog.resourceName).toEqual(groupPermission.group);
        expect(auditLog.actionType).toEqual('APP_GROUP_PERMISSION_UPDATE');
        expect(auditLog.createdAt).toBeDefined();
      }
    });

    it('should not allow admin to update app group permission of different organization', async () => {
      const {
        organization: { organization },
        anotherOrganization: { anotherAdminUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, anotherAdminUser.email);

      const manager = getManager();
      const groupPermission = await manager.findOneOrFail(GroupPermission, {
        where: {
          organizationId: organization.id,
          group: 'all_users',
        },
      });
      const groupPermissionId = groupPermission.id;
      const appGroupPermission = await manager.findOneOrFail(AppGroupPermission, {
        where: {
          groupPermissionId,
        },
      });
      const appGroupPermissionId = appGroupPermission.id;

      expect(appGroupPermission.read).toBe(false);
      expect(appGroupPermission.update).toBe(false);

      const response = await request(nestApp.getHttpServer())
        .put(`/api/group_permissions/${groupPermissionId}/app_group_permissions/${appGroupPermissionId}`)
        .set('tj-workspace-id', anotherAdminUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ actions: { read: false, update: true } });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /group_permissions/:id', () => {
    it('should not allow unauthenticated admin', async () => {
      const {
        organization: { defaultUser },
      } = await setupOrganizations(nestApp);

      const loggedUser = await authenticateUser(nestApp, defaultUser.email);

      const response = await request(nestApp.getHttpServer())
        .del('/api/group_permissions/id')
        .set('tj-workspace-id', defaultUser.defaultOrganizationId)
        .set('Cookie', loggedUser.tokenCookie)
        .send({ read: true });

      expect(response.statusCode).toBe(403);
    });

    it('should allow admin/super admin to delete group', async () => {
      const {
        organization: { adminUser, organization },
      } = await setupOrganizations(nestApp);

      const superAdminUserData = await createUser(nestApp, {
        email: 'superadmin@tooljet.io',
        groups: ['all_users', 'admin'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(nestApp);
      adminUser['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(nestApp, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData.user['tokenCookie'] = loggedUser.tokenCookie;

      for (const user of [adminUser, superAdminUserData.user]) {
        await request(nestApp.getHttpServer())
          .post('/api/group_permissions')
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
          .send({ group: 'avengers' });

        const manager = getManager();
        const groupPermission: GroupPermission = await manager.findOneOrFail(GroupPermission, {
          where: {
            organizationId: organization.id,
            group: 'avengers',
          },
        });

        const response = await request(nestApp.getHttpServer())
          .del(`/api/group_permissions/${groupPermission.id}`)
          .set('tj-workspace-id', adminUser.defaultOrganizationId)
          .set('Cookie', user['tokenCookie'])
          .send({ group: 'avengers' });

        expect(response.statusCode).toBe(200);

        // should create audit log
        const auditLog = await AuditLog.findOne({
          where: { userId: user.id, actionType: 'GROUP_PERMISSION_DELETE', resourceType: 'GROUP_PERMISSION' },
        });

        expect(auditLog.organizationId).toEqual(adminUser.organizationId);
        expect(auditLog.resourceId).toEqual(groupPermission.id);
        expect(auditLog.resourceType).toEqual('GROUP_PERMISSION');
        expect(auditLog.resourceName).toEqual('avengers');
        expect(auditLog.actionType).toEqual('GROUP_PERMISSION_DELETE');
        expect(auditLog.createdAt).toBeDefined();
      }
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
      organization: anotherOrganization,
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
