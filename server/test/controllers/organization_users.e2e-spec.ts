/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';

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
    await createUser(app, { email: 'someUser@tooljet.io', groups: ['admin', 'all_users'] });

    // setup organization and user setup to test against
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['admin', 'all_users'],
    });

    const organization = adminUserData.organization;

    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      groups: ['developer', 'all_users'],
      organization,
    });

    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['viewer', 'all_users'],
      organization,
    });

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ email: 'test@tooljet.io', groups: ['Viewer', 'all_users'] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .send({ email: 'test2@tooljet.io', groups: ['Viewer', 'all_users'] })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/organization_users/`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .send({ email: 'test3@tooljet.io', groups: ['Viewer', 'all_users'] })
      .expect(403);
  });

  it('should allow only authenticated users to archive org users', async () => {
    await request(app.getHttpServer()).post('/api/organization_users/random-id/archive/').expect(401);
  });

  it('should allow only admin users to archive org users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['admin', 'all_users'],
    });
    const organization = adminUserData.organization;
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      groups: ['developer', 'all_users'],
      organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      groups: ['viewer', 'all_users'],
      organization,
    });

    await request(app.getHttpServer())
      .post(`/api/organization_users/${adminUserData.orgUser.id}/archive/`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .expect(403);

    await adminUserData.orgUser.reload();
    expect(adminUserData.orgUser.status).toBe('invited');

    await request(app.getHttpServer())
      .post(`/api/organization_users/${adminUserData.orgUser.id}/archive/`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .expect(403);

    await adminUserData.orgUser.reload();
    expect(adminUserData.orgUser.status).toBe('invited');

    await request(app.getHttpServer())
      .post(`/api/organization_users/${developerUserData.orgUser.id}/archive/`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .expect(201);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.status).toBe('archived');
  });

  afterAll(async () => {
    await app.close();
  });
});
