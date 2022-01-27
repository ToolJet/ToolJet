/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstance, authHeaderForUser } from '../test.helper';
import { OrganizationUser } from 'src/entities/organization_user.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgUserRepository: Repository<OrganizationUser>;
  const originalEnv = process.env;

  beforeEach(async () => {
    await clearDB();
    await createUser(app, { email: 'admin@tooljet.io' });
  });

  beforeAll(async () => {
    app = await createNestAppInstance();

    userRepository = app.get('UserRepository');
    orgUserRepository = app.get('OrganizationUserRepository');
  });

  it('should create new users', async () => {
    const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
    expect(response.statusCode).toBe(201);

    const user = await userRepository.findOne({
      where: { email: 'test@tooljet.io' },
      relations: ['organization'],
    });

    expect(user.organization.name).toBe('Untitled organization');

    const groupPermissions = await user.groupPermissions;
    const groupNames = groupPermissions.map((x) => x.group);

    expect(new Set(['all_users', 'admin'])).toEqual(new Set(groupNames));

    const adminGroup = groupPermissions.find((x) => x.group == 'admin');
    expect(adminGroup.appCreate).toBeTruthy();
    expect(adminGroup.appDelete).toBeTruthy();
    expect(adminGroup.folderCreate).toBeTruthy();

    const allUserGroup = groupPermissions.find((x) => x.group == 'all_users');
    expect(allUserGroup.appCreate).toBeFalsy();
    expect(allUserGroup.appDelete).toBeFalsy();
    expect(allUserGroup.folderCreate).toBeFalsy();
  });

  it('authenticate if valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/authenticate')
      .send({ email: 'admin@tooljet.io', password: 'password' })
      .expect(201);
  });

  it('throw 401 if user is archived', async () => {
    await createUser(app, { email: 'user@tooljet.io', status: 'archived' });

    await request(app.getHttpServer())
      .post('/api/authenticate')
      .send({ email: 'user@tooljet.io', password: 'password' })
      .expect(401);

    const adminUser = await userRepository.findOne({
      email: 'admin@tooljet.io',
    });
    await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

    await request(app.getHttpServer())
      .get('/api/organizations/users')
      .set('Authorization', authHeaderForUser(adminUser))
      .expect(401);
  });

  it('throw 401 if invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/authenticate')
      .send({ email: 'amdin@tooljet.io', password: 'pwd' })
      .expect(401);
  });

  describe('if password login is disabled', () => {
    beforeAll(async () => {
      process.env = { ...originalEnv, DISABLE_PASSWORD_LOGIN: 'true' };
    });

    it('should not create new users', async () => {
      const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
      expect(response.statusCode).toBe(403);
    });

    it('does authenticate if valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/authenticate')
        .send({ email: 'admin@tooljet.io', password: 'password' })
        .expect(403);
    });

    afterAll(async () => {
      process.env = { ...originalEnv };
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
