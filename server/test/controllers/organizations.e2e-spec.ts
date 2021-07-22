import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { authHeaderForUser, clearDB } from '../test.helper';

describe('organizations controller', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should allow only authenticated users to list org users', async () => {
    await request(app.getHttpServer()).get('/organizations/users').expect(401);
  });

  it('should list organization users', async () => {

    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');

    const organization = await organizationRepository.save(organizationRepository.create({ name: 'test org', createdAt: new Date(), updatedAt: new Date() }));
    const user = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'dev@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const orgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));

    const response = await request(app.getHttpServer())
      .get('/organizations/users')
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
    expect(response.body.users.length).toBe(1);

    expect(response.body.users[0]).toStrictEqual({
      email: user.email, 
      first_name: user.firstName, 
      id: orgUser.id, 
      last_name: user.lastName, 
      name: `${user.firstName} ${user.lastName}`, 
      role: orgUser.role, 
      status: orgUser.status
    })
  });

  
  afterAll(async () => {
    await app.close();
  });
});