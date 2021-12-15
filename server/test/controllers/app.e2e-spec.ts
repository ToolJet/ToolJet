/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstance } from '../test.helper';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  const originalEnv = process.env;

  beforeEach(async () => {
    await clearDB();
    await createUser(app, { email: 'admin@tooljet.io' });
  });

  beforeAll(async () => {
    app = await createNestAppInstance();

    userRepository = app.get('UserRepository');
  });

  it('should create new users', async () => {
    const response = await request(app.getHttpServer()).post('/api/signup').send({ email: 'test@tooljet.io' });
    expect(response.statusCode).toBe(201);

    const id = response.body['id'];
    const user = await userRepository.findOne(id, {
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
