/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance, authenticateUser } from '../test.helper';

describe('organization users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only admin to be able to invite new users', async () => {
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

    loggedUser = await authenticateUser(app, 'developer@tooljet.io');
    developerUserData['tokenCookie'] = loggedUser.tokenCookie;

    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['viewer', 'all_users'],
      organization,
    });

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

    it('should allow only admin users to archive org users', async () => {
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
    });
  });

  describe('POST /api/organization_users/:id/unarchive', () => {
    it('should allow only authenticated users to unarchive org users', async () => {
      await request(app.getHttpServer()).post('/api/organization_users/random-id/unarchive/').expect(401);
    });

    it('should allow only admin users to unarchive org users', async () => {
      const adminUserData = await createUser(app, {
        email: 'admin@tooljet.io',
        status: 'active',
        groups: ['admin', 'all_users'],
      });

      let loggedUser = await authenticateUser(app);
      adminUserData['tokenCookie'] = loggedUser.tokenCookie;

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

  afterAll(async () => {
    await app.close();
  });
});
