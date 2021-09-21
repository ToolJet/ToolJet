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
    await createUser(app, { email: 'someUser@tooljet.io', role: 'admin' });

    // setup organization and user setup to test against
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });

    const organization = adminUserData.organization;

    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization,
    });

    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization,
    });

    await request(app.getHttpServer())
      .post(`/organization_users`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ email: 'test@tooljet.io', role: 'Viewer' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/organization_users`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .send({ email: 'test2@tooljet.io', role: 'Viewer' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/organization_users`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .send({ email: 'test3@tooljet.io', role: 'Viewer' })
      .expect(403);
  });

  it('should allow only authenticated users to archive org users', async () => {
    await request(app.getHttpServer()).post('/organization_users/random-id/archive').expect(401);
  });

  it('should allow only admin users to archive org users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const organization = adminUserData.organization;
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization,
    });

    let response = await request(app.getHttpServer())
      .post(`/organization_users/${adminUserData.orgUser.id}/archive`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .expect(403);

    await adminUserData.orgUser.reload();
    expect(adminUserData.orgUser.status).toBe('invited');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${adminUserData.orgUser.id}/archive`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .expect(403);

    await adminUserData.orgUser.reload();
    expect(adminUserData.orgUser.status).toBe('invited');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${developerUserData.orgUser.id}/archive`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .expect(201);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.status).toBe('archived');
  });

  it('should allow only admin users to change role of org users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const organization = adminUserData.organization;
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
      organization,
    });
    const viewerUserData = await createUser(app, {
      email: 'viewer@tooljet.io',
      role: 'viewer',
      organization,
    });

    let response = await request(app.getHttpServer())
      .post(`/organization_users/${viewerUserData.orgUser.id}/change_role`)
      .set('Authorization', authHeaderForUser(developerUserData.user))
      .send({ role: 'developer' })
      .expect(403);

    await viewerUserData.orgUser.reload();
    expect(viewerUserData.orgUser.role).toBe('viewer');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${viewerUserData.orgUser.id}/change_role`)
      .set('Authorization', authHeaderForUser(viewerUserData.user))
      .send({ role: 'viewer' })
      .expect(403);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.role).toBe('developer');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${developerUserData.orgUser.id}/change_role`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ role: 'viewer' })
      .expect(201);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.role).toBe('viewer');
  });

  it('should allow only admin users to change role of org users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
    });

    const response = await request(app.getHttpServer())
      .post(`/organization_users/${developerUserData.orgUser.id}/change_role`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ role: 'viewer' })
      .expect(403);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.role).toBe('developer');
  });

  it('should not allow to change role from admin when no other admins are present', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
      status: 'active',
    });

    const response = await request(app.getHttpServer())
      .post(`/organization_users/${adminUserData.orgUser.id}/change_role`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .send({ role: 'viewer' })
      .expect(400);

    await adminUserData.orgUser.reload();
    expect(adminUserData.orgUser.role).toBe('admin');
  });

  it('should allow only admin users to archive org users', async () => {
    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      role: 'admin',
    });
    const developerUserData = await createUser(app, {
      email: 'developer@tooljet.io',
      role: 'developer',
    });

    const response = await request(app.getHttpServer())
      .post(`/organization_users/${developerUserData.orgUser.id}/archive`)
      .set('Authorization', authHeaderForUser(adminUserData.user))
      .expect(403);

    await developerUserData.orgUser.reload();
    expect(developerUserData.orgUser.status).toBe('invited');
  });

  afterAll(async () => {
    await app.close();
  });
});
