/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstance } from '../test.helper';
import { AuditLog } from 'src/entities/audit_log.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

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

    // should create audit log
    const auditLog = await AuditLog.findOne({
      userId: user.id,
    });

    expect(auditLog.organizationId).toEqual(user.organizationId);
    expect(auditLog.resourceId).toEqual(user.id);
    expect(auditLog.resourceType).toEqual('USER');
    expect(auditLog.resourceName).toEqual(user.email);
    expect(auditLog.actionType).toEqual('USER_SIGNUP');
    expect(auditLog.createdAt).toBeDefined();

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

    const user = await User.findOne({ email: 'admin@tooljet.io' });
    // should create audit log
    const auditLog = await AuditLog.findOne({
      userId: user.id,
    });

    expect(auditLog.organizationId).toEqual(user.organizationId);
    expect(auditLog.resourceId).toEqual(user.id);
    expect(auditLog.resourceType).toEqual('USER');
    expect(auditLog.resourceName).toEqual(user.email);
    expect(auditLog.actionType).toEqual('USER_LOGIN');
    expect(auditLog.createdAt).toBeDefined();
  });

  it('throw 401 if invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/authenticate')
      .send({ email: 'amdin@tooljet.io', password: 'pwd' })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
