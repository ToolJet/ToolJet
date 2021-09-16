/* eslint-disable @typescript-eslint/no-unused-vars */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB, createUser, createNestAppInstance } from '../test.helper';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  beforeEach(async () => {
    await clearDB();
    await createUser(app, { email: 'admin@tooljet.io' });
  });

  beforeAll(async () => {
    app = await createNestAppInstance();

    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');
  });

  it('should create new users', async () => {
    const response = await request(app.getHttpServer()).post('/signup').send({ email: 'test@tooljet.io' });

    expect(response.statusCode).toBe(201);

    const id = response.body['id'];
    const user = await userRepository.findOne(id, {
      relations: ['organization'],
    });

    expect(user.organization.name).toBe('Untitled organization');
    const orgUser = user.organizationUsers[0];
    expect(orgUser.role).toBe('admin');
  });

  it(`authenticate if valid credentials`, async () => {
    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'admin@tooljet.io', password: 'password' })
      .expect(201);
  });

  it(`throw 401 if invalid credentials`, async () => {
    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'adnin@tooljet.io', password: 'pwd' })
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
