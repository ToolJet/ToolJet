/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import {
  createUser,
  initTestApp,
  login,
  buildTestSession,
  getEntityRepository,
  closeTestApp,
  createGroupPermission,
  grantModulePermission,
  findEntities,
} from 'test-helper';

/** @group platform */
describe('OrganizationUsersController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      userRepository = getEntityRepository(User);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    describe('POST /api/organization-users | Invite user', () => {
      it('should allow only admin/super admin to be able to invite new users', async () => {
        // setup a pre existing user of different organization
        await createUser(app, {
          email: 'someUser@tooljet.io',
          groups: ['admin', 'end-user'],
        });

        // setup organization and user setup to test against
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });

        const organization = adminUserData.organization;

        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['developer', 'end-user'],
          organization,
        });

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['admin', 'end-user'],
          userType: 'instance',
        });
        // Add superadmin to admin's org so they can be authenticated against it
        await createUser(
          app,
          {
            email: 'superadmin@tooljet.io',
            groups: ['admin', 'end-user'],
            organization,
          },
          superAdminUserData.user
        );

        const superAdminSession = await buildTestSession(superAdminUserData.user, organization.id);
        superAdminUserData['tokenCookie'] = superAdminSession.tokenCookie;

        const developerSession = await buildTestSession(developerUserData.user, organization.id);
        developerUserData['tokenCookie'] = developerSession.tokenCookie;

        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['viewer', 'end-user'],
          organization,
        });

        for (const [index, userData] of [adminUserData, superAdminUserData].entries()) {
          const response = await request(app.getHttpServer())
            .post('/api/organization-users/')
            .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
            .set('Cookie', userData['tokenCookie'])
            .send({ email: `test${index}@tooljet.io`, role: 'end-user' })
            .expect(201);

          expect(Object.keys(response.body).length).toBe(0); // Security issue fix - not returning user details

          // Verify user was created
          const user = await userRepository.findOneOrFail({
            where: { email: `test${index}@tooljet.io` },
          });
          expect(user).toBeDefined();
        }

        const viewerSession = await buildTestSession(viewerUserData.user, organization.id);
        viewerUserData['tokenCookie'] = viewerSession.tokenCookie;

        await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({ email: 'test@tooljet.io', role: 'end-user' })
          .expect(201);

        await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send({ email: 'test2@tooljet.io', role: 'end-user' })
          .expect(403);

        await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
          .set('Cookie', viewerUserData['tokenCookie'])
          .send({ email: 'test3@tooljet.io', role: 'end-user' })
          .expect(403);
      });
    });

    describe('POST /api/organization-users | Invite user into a module-permission group', () => {
      it('should reject inviting an end-user into a group with module Build-with (view-only) permission', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });
        const organization = adminUserData.organization;
        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const moduleGroup = await createGroupPermission(app, { name: 'module-viewers', organization });
        await grantModulePermission(app, moduleGroup.id, { read: true });

        const response = await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({ email: 'blocked-build-with@tooljet.io', role: 'end-user', groups: [moduleGroup.id] });

        expect(response.statusCode).toBe(400);
        expect(response.body.message.title).toBe('Conflicting permissions');

        // The invite must never leave the end-user attached to the module-permission group,
        // regardless of whether the account itself ended up being created.
        const invitedUser = await userRepository.findOne({ where: { email: 'blocked-build-with@tooljet.io' } });
        if (invitedUser) {
          const usersInGroup = await findEntities(GroupUsers, { where: { groupId: moduleGroup.id, userId: invitedUser.id } });
          expect(usersInGroup).toHaveLength(0);
        }
      });

      it('should reject inviting an end-user into a group with module Edit permission', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });
        const organization = adminUserData.organization;
        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const moduleGroup = await createGroupPermission(app, { name: 'module-editors', organization });
        await grantModulePermission(app, moduleGroup.id, { update: true });

        const response = await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({ email: 'blocked-module-edit@tooljet.io', role: 'end-user', groups: [moduleGroup.id] });

        expect(response.statusCode).toBe(400);
        expect(response.body.message.title).toBe('Conflicting permissions');

        const invitedUser = await userRepository.findOne({ where: { email: 'blocked-module-edit@tooljet.io' } });
        if (invitedUser) {
          const usersInGroup = await findEntities(GroupUsers, { where: { groupId: moduleGroup.id, userId: invitedUser.id } });
          expect(usersInGroup).toHaveLength(0);
        }
      });

      it('should allow inviting a builder into a group with module Build-with permission', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });
        const organization = adminUserData.organization;
        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const moduleGroup = await createGroupPermission(app, { name: 'module-viewers-builder', organization });
        await grantModulePermission(app, moduleGroup.id, { read: true });

        const response = await request(app.getHttpServer())
          .post('/api/organization-users/')
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({ email: 'allowed-builder@tooljet.io', role: 'builder', groups: [moduleGroup.id] });

        expect(response.statusCode).toBe(201);

        const invitedUser = await userRepository.findOneOrFail({ where: { email: 'allowed-builder@tooljet.io' } });
        const usersInGroup = await findEntities(GroupUsers, { where: { groupId: moduleGroup.id, userId: invitedUser.id } });
        expect(usersInGroup).toHaveLength(1);
      });
    });

    describe('POST /api/organization-users/:id/archive | Archive user', () => {
      it('should allow only authenticated users to archive org users', async () => {
        await request(app.getHttpServer()).post('/api/organization-users/random-id/archive').send({}).expect(401);
      });

      it('should throw error when trying to remove last active admin', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
          status: 'active',
        });

        const adminSession = await buildTestSession(adminUserData.user, adminUserData.organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const organization = adminUserData.organization;
        const anotherAdminUserData = await createUser(app, {
          email: 'another-admin@tooljet.io',
          groups: ['admin', 'end-user'],
          status: 'active',
          organization,
        });

        const _archivedAdmin = await createUser(app, {
          email: 'archived-admin@tooljet.io',
          groups: ['admin', 'end-user'],
          status: 'archived',
          organization,
        });

        await request(app.getHttpServer())
          .post(`/api/organization-users/${anotherAdminUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(201);

        const response = await request(app.getHttpServer())
          .post(`/api/organization-users/${adminUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({});

        expect(response.statusCode).toEqual(400);
        expect(response.body.message).toEqual('Atleast one active admin is required');
      });

      it('should allow only admin/super admin users to archive org users', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          groups: ['admin', 'end-user'],
        });

        const organization = adminUserData.organization;

        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          groups: ['developer', 'end-user'],
          organization,
        });

        const developerSession = await buildTestSession(developerUserData.user, organization.id);
        developerUserData['tokenCookie'] = developerSession.tokenCookie;

        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          groups: ['viewer', 'end-user'],
          organization,
          status: 'invited',
        });

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['admin', 'end-user'],
          userType: 'instance',
        });
        // Add superadmin to admin's org
        await createUser(
          app,
          { email: 'superadmin@tooljet.io', groups: ['admin', 'end-user'], organization },
          superAdminUserData.user
        );

        const superAdminSession = await buildTestSession(superAdminUserData.user, organization.id);
        superAdminUserData['tokenCookie'] = superAdminSession.tokenCookie;

        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send({})
          .expect(403);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('invited');

        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(201);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('archived');

        //unarchive the user
        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(201);

        //archive the user again by super admin
        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({})
          .expect(201);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('archived');
      });
    });

    describe('POST /api/organization-users/:id/unarchive | Unarchive user', () => {
      it('should allow only authenticated users to unarchive org users', async () => {
        await request(app.getHttpServer()).post('/api/organization-users/random-id/unarchive').send({}).expect(401);
      });

      it('should allow only admin/super admin users to unarchive org users', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          status: 'active',
          groups: ['admin', 'end-user'],
        });
        const organization = adminUserData.organization;

        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          groups: ['admin', 'end-user'],
          userType: 'instance',
        });
        // Add superadmin to admin's org
        await createUser(
          app,
          { email: 'superadmin@tooljet.io', groups: ['admin', 'end-user'], organization },
          superAdminUserData.user
        );

        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const superAdminSession = await buildTestSession(superAdminUserData.user, organization.id);
        superAdminUserData['tokenCookie'] = superAdminSession.tokenCookie;

        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          status: 'active',
          groups: ['developer', 'end-user'],
          organization,
        });

        const developerSession = await buildTestSession(developerUserData.user, organization.id);
        developerUserData['tokenCookie'] = developerSession.tokenCookie;

        const viewerUserData = await createUser(app, {
          email: 'viewer@tooljet.io',
          status: 'archived',
          groups: ['viewer', 'end-user'],
          organization,
        });

        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send({})
          .expect(403);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('archived');

        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send({})
          .expect(403);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('archived');

        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(201);

        await viewerUserData.orgUser.reload();
        await viewerUserData.user.reload();
        expect(viewerUserData.orgUser.status).toBe('invited');
        expect(viewerUserData.user.invitationToken).not.toBe('');
        expect(viewerUserData.user.password).not.toBe('old-password');

        //archive the user again
        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/archive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(201);

        await viewerUserData.orgUser.reload();
        expect(viewerUserData.orgUser.status).toBe('archived');

        //unarchiving by super admin
        await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', superAdminUserData['tokenCookie'])
          .send({})
          .expect(201);

        await viewerUserData.orgUser.reload();
        await viewerUserData.user.reload();
        expect(viewerUserData.orgUser.status).toBe('invited');
        expect(viewerUserData.user.invitationToken).not.toBe('');
        expect(viewerUserData.user.password).not.toBe('old-password');
      });

      it('should not allow unarchive if user status is not archived', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          status: 'active',
          groups: ['admin', 'end-user'],
        });

        const adminSession = await buildTestSession(adminUserData.user, adminUserData.organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const organization = adminUserData.organization;
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          status: 'active',
          groups: ['developer', 'end-user'],
          organization,
        });

        await request(app.getHttpServer())
          .post(`/api/organization-users/${developerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(400);

        await developerUserData.orgUser.reload();
        expect(developerUserData.orgUser.status).toBe('active');
      });

      it('should not allow unarchive if user status is not archived', async () => {
        const adminUserData = await createUser(app, {
          email: 'admin@tooljet.io',
          status: 'active',
          groups: ['admin', 'end-user'],
        });
        const organization = adminUserData.organization;
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          status: 'invited',
          groups: ['developer', 'end-user'],
          organization,
        });

        const adminSession = await buildTestSession(adminUserData.user, organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        await request(app.getHttpServer())
          .post(`/api/organization-users/${developerUserData.orgUser.id}/unarchive`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send({})
          .expect(400);

        await developerUserData.orgUser.reload();
        expect(developerUserData.orgUser.status).toBe('invited');
      });
    });

    describe('POST /api/organization-users/:userId/archive-all | Archive from all workspaces', () => {
      it('only superadmins can able to archive all users', async () => {
        const adminUserData = await createUser(app, { email: 'admin@tooljet.io', userType: 'instance' });
        const developerUserData = await createUser(app, {
          email: 'developer@tooljet.io',
          userType: 'workspace',
          organization: adminUserData.organization,
        });
        const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', userType: 'workspace' });

        const adminSession = await buildTestSession(adminUserData.user, adminUserData.organization.id);
        adminUserData['tokenCookie'] = adminSession.tokenCookie;

        const developerSession = await buildTestSession(developerUserData.user, adminUserData.organization.id);
        developerUserData['tokenCookie'] = developerSession.tokenCookie;

        const adminRequestResponse = await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.user.id}/archive-all`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', adminUserData['tokenCookie'])
          .send();

        expect(adminRequestResponse.statusCode).toBe(201);

        const developerRequestResponse = await request(app.getHttpServer())
          .post(`/api/organization-users/${viewerUserData.user.id}/archive-all`)
          .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
          .set('Cookie', developerUserData['tokenCookie'])
          .send();

        expect(developerRequestResponse.statusCode).toBe(403);
      });
    });
  });
});
