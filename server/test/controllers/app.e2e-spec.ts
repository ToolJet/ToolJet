import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { clearDB } from '../test.helper';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

describe('Authentication', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  beforeEach(async () => {
    await clearDB();

    const organization = await organizationRepository.save(organizationRepository.create({ name: 'test org', createdAt: new Date(), updatedAt: new Date() }));
    const user = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'admin@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const adminOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: user, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');

  });

  it('should create new users', async () => {

    const response = await request(app.getHttpServer())
      .post('/signup')
      .send({ email: 'test@tooljet.io' })
      
    expect(response.statusCode).toBe(201);

    const id = response.body['id'];
    const user = await userRepository.findOne(id, { relations: ['organization']});

    expect(user.organization.name).toBe('Untitled organization');
    const orgUser = user.organizationUsers[0];
    expect(orgUser.role).toBe('admin');
  });

  it(`authenticate if valid credentials`, async () => {

    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'admin@tooljet.io', password: 'password' })
      .expect(201)
  });

  it(`throw 401 if invalid credentials`, async () => {

    return request(app.getHttpServer())
      .post('/authenticate')
      .send({ email: 'adnin@tooljet.io', password: 'pwd' })
      .expect(401)
  });

  afterAll(async () => {
    await app.close();
  });
});