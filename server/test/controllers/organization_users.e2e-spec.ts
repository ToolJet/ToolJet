import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { JwtService } from '@nestjs/jwt';
import { authHeaderForUser } from '../test.helper';

describe('organization users controller', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  it('should allow only authenticated users to archive org users', async () => {
    await request(app.getHttpServer()).post('/organization_users/random-id/archive').expect(401);
  });

  it('should change role & archive organization users if current user is admin of the org', async () => {

    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');

    const organization = await organizationRepository.save(organizationRepository.create({ name: 'test org', createdAt: new Date(), updatedAt: new Date() }));
    const admin = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'admin@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const adminOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: admin, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));

    const anotherUser = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'dev@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const anotherOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: anotherUser, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));

    let response = await request(app.getHttpServer())
      .post(`/organization_users/${anotherOrgUser.id}/change_role`)
      .set('Authorization',authHeaderForUser(admin))
      .send({ role: 'developer' })

    expect(response.statusCode).toBe(201);
    await anotherOrgUser.reload();
    expect(anotherOrgUser.role).toBe('developer');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${anotherOrgUser.id}/archive`)
      .set('Authorization',authHeaderForUser(admin));

    expect(response.statusCode).toBe(201);
    
    await anotherOrgUser.reload();

    expect(anotherOrgUser.status).toBe('archived');

  });  
  afterAll(async () => {
    await app.close();
  });
});