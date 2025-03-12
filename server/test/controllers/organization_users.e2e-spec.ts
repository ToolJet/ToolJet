/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { AuditLog } from 'src/entities/audit_log.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstance, authenticateUser } from '../test.helper';

describe('organization users controller', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    userRepository = app.get('UserRepository');
  });

  it('should allow only admin/super admin to be able to invite new users', async () => {
    // setup a pre existing user of different organization
    await createUser(app, {
      email: 'someUser@tooljet.io',
      groups: ['admin', 'all_users'],
    });

    // setup organization and user setup to test against
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['admin', 'all_users'],
    });

    const organization = adminUserData.organization;

    let loggedUser = await authenticateUser(app);
    adminUserData['tokenCookie'] = loggedUser.tokenCookie;

    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      groups: ['developer', 'all_users'],
      organization,
    });

    const superAdminUserData = await createUser(app, {
      email: 'superadmin@tooljet.io',
      groups: ['developer', 'all_users'],
      userType: 'instance',
    });

    loggedUser = await authenticateUser(app, superAdminUserData.user.email, 'password', adminUserData.organization.id);
    superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

    loggedUser = await authenticateUser(app, 'developer@tooljet.io');
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;

    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['viewer', 'all_users'],
      organization,
    });

    for (const [index, userData] of [adminUserData, superAdminUserData].entries()) {
      const response = await request(app.getHttpServer())
        .post(`/api/organization_users/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', userData['tokenCookie'])
        .send({ email: `test${index}@tooljet.io` })
        .expect(201);

      // should create audit log
      const auditLog = await AuditLog.findOne({
        order: { createdAt: 'DESC' },
      });

      const user = await userRepository.findOneOrFail({
        where: { email: `test${index}@tooljet.io` },
      });

      expect(Object.keys(response.body).length).toBe(0); // Security issue fix - not returning user details
      expect(auditLog.organizationId).toEqual(adminUserData.organization.id);
      expect(auditLog.resourceId).toEqual(user.id);
      expect(auditLog.resourceType).toEqual('USER');
      expect(auditLog.resourceName).toEqual(user.email);
      expect(auditLog.actionType).toEqual('USER_INVITE');
      expect(auditLog.createdAt).toBeDefined();
    }
    loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
    viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', adminUserData['tokenCookie'])
      .send({ email: 'test@tooljet.io' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
      .set('Cookie', developerUserData['tokenCookie'])
      .send({ email: 'test2@tooljet.io' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('tj-workspace-id', viewerUserData.user.defaultOrganizationId)
      .set('Cookie', viewerUserData['tokenCookie'])
      .send({ email: 'test3@tooljet.io' })
      .expect(403);
  });

  describe('POST /api/organization_users/:id/archive', () => {
    it('should allow only authenticated users to archive org users', async () => {
      await request(app.getHttpServer()).post('/api/organization_users/random-id/archive/').expect(401);
    });

    it('should throw error when trying to remove last active admin', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
        status: 'active',
      });

      const loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const anotherAdminUserData = await createUser(app, {
        email: 'another-admin@tooljet.io',
        groups: ['admin', 'all_users'],
        status: 'active',
        organization,
      });

      const _archivedAdmin = await createUser(app, {
        email: 'archived-admin@tooljet.io',
        groups: ['admin', 'all_users'],
        status: 'archived',
        organization,
      });

      await request(app.getHttpServer())
        .post(`/api/organization_users/${anotherAdminUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/api/organization_users/${adminUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie']);

      expect(response.statusCode).toEqual(400);
      expect(response.body.message).toEqual('Atleast one active admin is required.');
    });

    it('should allow only admin/super admin users to archive org users', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        groups: ['admin', 'all_users'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        groups: ['developer', 'all_users'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        groups: ['viewer', 'all_users'],
        organization,
        status: 'invited',
      });

      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['developer', 'all_users'],
        userType: 'instance',
      });

      loggedUser = await authenticateUser(app, superAdminUserData.user.email, 'password', organization.id);
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .expect(403);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('invited');

      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(201);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('archived');

      //unarchive the user
      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(201);

      //archive the user again by super admin
      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
        .expect(201);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('archived');
    });
  });

  describe('POST /api/organization_users/:id/unarchive', () => {
    it('should allow only authenticated users to unarchive org users', async () => {
      await request(app.getHttpServer()).post('/api/organization_users/random-id/unarchive/').expect(401);
    });

    it('should allow only admin/super admin users to unarchive org users', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        status: 'active',
        groups: ['admin', 'all_users'],
      });
      const superAdminUserData = await createUser(app, {
        email: 'superadmin@tooljet.io',
        groups: ['developer', 'all_users'],
        userType: 'instance',
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(
        app,
        superAdminUserData.user.email,
        'password',
        adminUserData.organization.id
      );
      superAdminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        status: 'active',
        groups: ['developer', 'all_users'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'developer@tooljet.io');
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const viewerUserData = await createUser(app, {
        email: 'viewer@tooljet.io',
        status: 'archived',
        groups: ['viewer', 'all_users'],
        organization,
      });

      loggedUser = await authenticateUser(app, 'viewer@tooljet.io');
      viewerUserData['tokenCookie'] = loggedUser.tokenCookie;

      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .expect(403);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('archived');

      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', developerUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .expect(403);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('archived');

      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(201);

      await viewerUserData.orgUser.reload();
      await viewerUserData.user.reload();
      expect(viewerUserData.orgUser.status).toBe('invited');
      expect(viewerUserData.user.invitationToken).not.toBe('');
      expect(viewerUserData.user.password).not.toBe('old-password');

      //archive the user again
      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/archive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(201);

      await viewerUserData.orgUser.reload();
      expect(viewerUserData.orgUser.status).toBe('archived');

      //unarchiving by super admin
      await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', superAdminUserData['tokenCookie'])
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
        groups: ['admin', 'all_users'],
      });

      const loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        status: 'active',
        groups: ['developer', 'all_users'],
        organization,
      });

      await request(app.getHttpServer())
        .post(`/api/organization_users/${developerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(400);

      await developerUserData.orgUser.reload();
      expect(developerUserData.orgUser.status).toBe('active');
    });

    it('should not allow unarchive if user status is not archived', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        status: 'active',
        groups: ['admin', 'all_users'],
      });
      const organization = adminUserData.organization;
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        status: 'invited',
        groups: ['developer', 'all_users'],
        organization,
      });

      const loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      await request(app.getHttpServer())
        .post(`/api/organization_users/${developerUserData.orgUser.id}/unarchive/`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .expect(400);

      await developerUserData.orgUser.reload();
      expect(developerUserData.orgUser.status).toBe('invited');
    });
  });

  describe('POST /api/organization_users/:userId/archive-all', () => {
    it('only superadmins can able to archive all users', async () => {
      const adminUserData = await createUser(app, { email: 'admin@tooljet.io', userType: 'instance' });
      const developerUserData = await createUser(app, {
        email: 'developer@tooljet.io',
        userType: 'workspace',
        organization: adminUserData.organization,
      });
      const viewerUserData = await createUser(app, { email: 'viewer@tooljet.io', userType: 'workspace' });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

      loggedUser = await authenticateUser(app, developerUserData.user.email);
      developerUserData['tokenCookie'] = loggedUser.tokenCookie;

      const adminRequestResponse = await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.user.id}/archive-all`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', adminUserData['tokenCookie'])
        .send();

      expect(adminRequestResponse.statusCode).toBe(201);

      const developerRequestResponse = await request(app.getHttpServer())
        .post(`/api/organization_users/${viewerUserData.user.id}/archive-all`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Cookie', developerUserData['tokenCookie'])
        .send();

      expect(developerRequestResponse.statusCode).toBe(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
