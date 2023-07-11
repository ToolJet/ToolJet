import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  clearDB,
  createApplication,
  createUser,
  createNestAppInstance,
  generateAppDefaults,
  authenticateUser,
  logoutUser,
} from '../test.helper';

describe('app_users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to create new app users', async () => {
    await request(app.getHttpServer()).post('/api/app_users').expect(401);
  });

  it('should be able to create a new app user if admin of same organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });

    const loggedUser = await authenticateUser(app);

    const developerUserData = await createUser(app, {
      email: 'dev@tooljet.io',
      groups: ['all_users', 'developer'],
      organization: adminUserData.organization,
    });
    const { application } = await generateAppDefaults(app, adminUserData.user, {});

    const response = await request(app.getHttpServer())
      .post(`/api/app_users`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({
        app_id: application.id,
        org_user_id: developerUserData.orgUser.id,
        groups: ['all_users', 'admin'],
        role: '',
      });

    expect(response.statusCode).toBe(201);

    await logoutUser(app, loggedUser.tokenCookie, adminUserData.user.defaultOrganizationId);
  });

  it('should not be able to create new app user if admin of another organization', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const developerUserData = await createUser(app, {
      email: 'dev@tooljet.io',
      groups: ['all_users', 'developer'],
      organization: adminUserData.organization,
    });
    const anotherOrgAdminUserData = await createUser(app, {
      email: 'another@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });

    const loggedUser = await authenticateUser(app, 'another@tooljet.io');

    const response = await request(app.getHttpServer())
      .post(`/api/app_users`)
      .set('tj-workspace-id', anotherOrgAdminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({
        app_id: application.id,
        org_user_id: adminUserData.orgUser.id,
        groups: ['all_users', 'admin'],
      });

    expect(response.statusCode).toBe(403);

    await logoutUser(app, loggedUser.tokenCookie, anotherOrgAdminUserData.user.defaultOrganizationId);
  });

  it('should not allow developers and viewers to create app users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    const application = await createApplication(app, {
      name: 'name',
      user: adminUserData.user,
    });

    const developerUserData = await createUser(app, {
      email: 'dev@tooljet.io',
      groups: ['all_users', 'developer'],
      organization: adminUserData.organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['all_users', 'viewer'],
      organization: adminUserData.organization,
    });

    const loggedUser = await authenticateUser(app, 'dev@tooljet.io');

    let response = await request(app.getHttpServer())
      .post(`/api/app_users/`)
      .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
      .set('Cookie', loggedUser.tokenCookie)
      .send({
        app_id: application.id,
        org_user_id: viewerUserData.orgUser.id,
        groups: ['all_users', 'admin'],
      });
    expect(response.statusCode).toBe(403);

    await logoutUser(app, loggedUser.tokenCookie, developerUserData.user.defaultOrganizationId);
    const loggedDeveloperUser = await authenticateUser(app, 'viewer@tooljet.io');

    response = response = await request(app.getHttpServer())
      .post(`/api/app_users/`)
      .set('Cookie', loggedDeveloperUser.tokenCookie)
      .send({
        app_id: application.id,
        org_user_id: developerUserData.orgUser.id,
        groups: ['all_users', 'admin'],
      });

    await logoutUser(app, loggedDeveloperUser.tokenCookie, viewerUserData.user.defaultOrganizationId);
    await application.reload();
  });

  afterAll(async () => {
    await app.close();
  });
});
